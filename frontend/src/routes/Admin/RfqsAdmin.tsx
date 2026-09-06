import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type RfqStatus } from "../../lib/adminApi";
import { formatPrice } from "../../lib/format";
import { ExportButtons } from "./ExportButtons";
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

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <div className={s.row} style={{ justifyContent: "space-between" }}>
        <h1 className={s.h1}>RFQs</h1>
        <ExportButtons resource="rfqs" params={{ q: search || undefined, status: status || undefined }} />
      </div>
      <form
        className={s.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
      >
        <input className={s.input} placeholder="Search number / email / company" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={s.select} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <button className={s.btn} type="submit">Filter</button>
      </form>

      {isLoading && <p className={s.muted}>Loading…</p>}
      {error && <p className={s.error}>{(error as Error).message}</p>}

      {data && (
        <>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr><th>Number</th><th>Date</th><th>Email</th><th>Company</th><th>Items</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td>{r.number}</td>
                    <td className={s.muted}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                    <td>{r.email}</td>
                    <td>{r.company ?? "—"}</td>
                    <td className={s.muted}>{r.items.length}</td>
                    <td>
                      <select
                        className={s.select}
                        value={r.status}
                        onChange={(e) => setStatusMut.mutate({ id: r.id, st: e.target.value as RfqStatus })}
                      >
                        {STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </td>
                    <td><button className={`${s.btn} ${s.btnGhost}`} onClick={() => setOpen(r.id)}>View</button></td>
                  </tr>
                ))}
                {data.items.length === 0 && <tr><td colSpan={7} className={s.muted}>No RFQs.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className={s.pager}>
            <button className={`${s.btn} ${s.btnGhost}`} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span className={s.muted}>Page {page} / {totalPages} · {data.total} total</span>
            <button className={`${s.btn} ${s.btnGhost}`} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </>
      )}

      {open && <RfqDrawer id={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function RfqDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "rfq", id],
    queryFn: () => adminApi.getRfq(id),
  });

  return (
    <>
      <div className={s.overlay} onClick={onClose} />
      <aside className={s.drawer}>
        <button className={`${s.btn} ${s.btnGhost}`} onClick={onClose} style={{ float: "right" }}>Close</button>
        {isLoading && <p className={s.muted}>Loading…</p>}
        {data && (
          <>
            <h2>{data.number}</h2>
            <p><span className={`${s.badge}`}>{data.status}</span></p>
            <p>{data.email}{data.phone ? ` · ${data.phone}` : ""}</p>
            <p className={s.muted}>
              {[data.company, data.vat_id, data.country_code].filter(Boolean).join(" · ") || "—"}
            </p>
            {data.message && (<><h3>Message</h3><p style={{ whiteSpace: "pre-wrap" }}>{data.message}</p></>)}
            <h3>Requested items</h3>
            <table className={s.table}>
              <thead><tr><th>SKU</th><th>Name</th><th>Qty</th><th>Target</th><th>Note</th></tr></thead>
              <tbody>
                {data.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.sku ?? "—"}</td>
                    <td>{it.name ?? "—"}</td>
                    <td>{it.qty}</td>
                    <td>{it.target_price_cents != null ? formatPrice(it.target_price_cents) : "—"}</td>
                    <td>{it.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </aside>
    </>
  );
}
