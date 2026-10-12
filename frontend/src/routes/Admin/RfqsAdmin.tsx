import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type RfqStatus } from "../../lib/adminApi";
import { formatPrice } from "../../lib/format";
import { ExportButtons } from "./ExportButtons";
import {
  Drawer,
  DrawerSection,
  EmptyRow,
  Icon,
  PageHeader,
  Pager,
  SearchField,
  StatusPill,
  StatusSelect,
  TableSkeleton,
  fmtDate,
  fmtDateTime,
  rfqTone,
} from "./ui";
import s from "./Admin.module.css";

const STATUSES: RfqStatus[] = ["new", "quoted", "won", "lost", "closed"];
const PAGE_SIZE = 50;

export function RfqsAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  const params = { q: search || undefined, status: status || undefined, page, page_size: PAGE_SIZE };
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "rfqs", params],
    queryFn: () => adminApi.listRfqs(params),
  });

  const setStatusMut = useMutation({
    mutationFn: ({ id, st }: { id: string; st: RfqStatus }) => adminApi.setRfqStatus(id, st),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "rfqs"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return (
    <>
      <PageHeader
        title="RFQs"
        subtitle="Quote requests from customers outside the direct-checkout flow."
        actions={<ExportButtons resource="rfqs" params={{ q: search || undefined, status: status || undefined }} />}
      />
      <form
        className={s.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
      >
        <SearchField value={q} onChange={setQ} placeholder="Search number, email or company" />
        <select
          className={s.select}
          aria-label="Filter by status"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((x) => <option key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</option>)}
        </select>
        <button className={`${s.btn} ${s.btnGhost}`} type="submit">Search</button>
      </form>

      {isLoading && <TableSkeleton cols={7} />}
      {error && <p className={s.error}>{(error as Error).message}</p>}
      {setStatusMut.error && <p className={s.error}>{(setStatusMut.error as Error).message}</p>}

      {data && (
        <>
          <div className={s.tableWrap}>
            <table className={`${s.table} ${s.tableStack}`}>
              <thead>
                <tr>
                  <th>Request</th><th>Date</th><th>Contact</th><th>Company</th>
                  <th className={s.right}>Items</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td data-primary><span className={s.code}>{r.number}</span></td>
                    <td data-label="Date" className={s.muted}>{fmtDate(r.created_at)}</td>
                    <td data-label="Contact">{r.email}</td>
                    <td data-label="Company">{r.company ?? "—"}</td>
                    <td data-label="Items" className={`${s.right} ${s.num}`}>{r.items.length}</td>
                    <td data-label="Status">
                      <StatusSelect
                        value={r.status}
                        options={STATUSES}
                        tone={rfqTone(r.status)}
                        label={`Status for ${r.number}`}
                        onChange={(st) => setStatusMut.mutate({ id: r.id, st })}
                      />
                    </td>
                    <td className={s.cellActions}>
                      <button className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => setOpen(r.id)}>
                        <Icon name="eye" size={15} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <EmptyRow colSpan={7} title="No RFQs found" hint="Try a different search or status filter." />
                )}
              </tbody>
            </table>
          </div>
          <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
        </>
      )}

      {open && <RfqDrawer id={open} onClose={() => setOpen(null)} />}
    </>
  );
}

const regionNames = new Intl.DisplayNames(undefined, { type: "region" });
const countryName = (code: string) => {
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
};

function RfqDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "rfq", id],
    queryFn: () => adminApi.getRfq(id),
  });

  const setStatusMut = useMutation({
    mutationFn: (st: RfqStatus) => adminApi.setRfqStatus(id, st),
    onSuccess: (rfq) => {
      qc.setQueryData(["admin", "rfq", id], rfq);
      qc.invalidateQueries({ queryKey: ["admin", "rfqs"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return (
    <Drawer
      title={data ? <span className={s.code}>{data.number}</span> : "RFQ"}
      meta={
        data && (
          <>
            <StatusPill tone={rfqTone(data.status)}>{data.status}</StatusPill>
            <span>Received {fmtDateTime(data.created_at)}</span>
          </>
        )
      }
      footer={
        data && (
          <>
            <StatusSelect
              value={data.status}
              options={STATUSES}
              tone={rfqTone(data.status)}
              label={`Status for ${data.number}`}
              onChange={(st) => setStatusMut.mutate(st)}
            />
            <a
              className={s.btn}
              href={`mailto:${data.email}?subject=${encodeURIComponent(`Your quote request ${data.number}`)}`}
            >
              <Icon name="mail" size={15} /> Reply by email
            </a>
          </>
        )
      }
      onClose={onClose}
    >
      {isLoading && <span className={s.spinner} />}
      {error && <p className={s.error}>{(error as Error).message}</p>}
      {setStatusMut.error && <p className={s.error}>{(setStatusMut.error as Error).message}</p>}
      {data && (
        <>
          <DrawerSection title="Contact">
            <dl className={s.dl}>
              <dt>Email</dt>
              <dd><a className={s.linkBtn} href={`mailto:${data.email}`}>{data.email}</a></dd>
              {data.phone && (<><dt>Phone</dt><dd><a className={s.linkBtn} href={`tel:${data.phone}`}>{data.phone}</a></dd></>)}
              {data.company && (<><dt>Company</dt><dd>{data.company}</dd></>)}
              {data.vat_id && (<><dt>VAT ID</dt><dd className={s.code}>{data.vat_id}</dd></>)}
              {data.country_code && (<><dt>Country</dt><dd>{countryName(data.country_code)}</dd></>)}
            </dl>
          </DrawerSection>

          {data.message && (
            <DrawerSection title="Message">
              <p className={s.quote}>{data.message}</p>
            </DrawerSection>
          )}

          <DrawerSection title={`Requested items (${data.items.length})`}>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr><th>Item</th><th className={s.right}>Qty</th><th className={s.right}>Target</th></tr>
                </thead>
                <tbody>
                  {data.items.map((it) => (
                    <tr key={it.id}>
                      <td className={s.wrap}>
                        <span className={s.cellStack}>
                          {/* free-text requests often carry only a SKU, so let it stand in for the name */}
                          {it.name ? (
                            <>
                              <span className={s.strong}>{it.name}</span>
                              {it.sku && <small className={s.code}>{it.sku}</small>}
                            </>
                          ) : (
                            <span className={`${s.strong} ${s.code}`}>{it.sku ?? "Unnamed item"}</span>
                          )}
                          {it.note && <small>{it.note}</small>}
                        </span>
                      </td>
                      <td className={`${s.right} ${s.num} ${s.strong}`}>{it.qty}</td>
                      <td className={`${s.right} ${s.num} ${it.target_price_cents == null ? s.muted : ""}`}>
                        {it.target_price_cents != null ? formatPrice(it.target_price_cents) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DrawerSection>
        </>
      )}
    </Drawer>
  );
}
