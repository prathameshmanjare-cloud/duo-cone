import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  downloadDeliveryNote,
  type AdminOrder,
  type DeliveryNoteDetails,
  type OrderStatus,
} from "../../lib/adminApi";
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
  orderTone,
} from "./ui";
import s from "./Admin.module.css";

const STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
];
const PAGE_SIZE = 50;
// a delivery note only exists for orders that have been paid
const DELIVERABLE: OrderStatus[] = ["paid", "processing", "shipped", "completed"];

export function OrdersAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<{ id: string; toNote?: boolean } | null>(null);

  const params = { q: search || undefined, status: status || undefined, page, page_size: PAGE_SIZE };
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "orders", params],
    queryFn: () => adminApi.listOrders(params),
  });

  const setStatusMut = useMutation({
    mutationFn: ({ id, st }: { id: string; st: OrderStatus }) => adminApi.setOrderStatus(id, st),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Track payments and move orders through fulfilment."
        actions={<ExportButtons resource="orders" params={{ q: search || undefined, status: status || undefined }} />}
      />
      <form
        className={s.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
      >
        <SearchField value={q} onChange={setQ} placeholder="Search order number or email" />
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

      {isLoading && <TableSkeleton cols={6} />}
      {error && <p className={s.error}>{(error as Error).message}</p>}
      {setStatusMut.error && <p className={s.error}>{(setStatusMut.error as Error).message}</p>}

      {data && (
        <>
          <div className={s.tableWrap}>
            <table className={`${s.table} ${s.tableStack}`}>
              <thead>
                <tr>
                  <th>Order</th><th>Date</th><th>Customer</th><th className={s.right}>Total</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o.id}>
                    <td data-primary><span className={s.code}>{o.number}</span></td>
                    <td data-label="Date" className={s.muted}>{fmtDate(o.created_at)}</td>
                    <td data-label="Customer">{o.email}</td>
                    <td data-label="Total" className={`${s.right} ${s.num} ${s.strong}`}>
                      {formatPrice(o.total_cents, o.currency)}
                    </td>
                    <td data-label="Status">
                      <StatusSelect
                        value={o.status}
                        options={STATUSES}
                        tone={orderTone(o.status)}
                        label={`Status for ${o.number}`}
                        onChange={(st) => setStatusMut.mutate({ id: o.id, st })}
                      />
                    </td>
                    <td className={s.cellActions}>
                      {DELIVERABLE.includes(o.status) && (
                        <button
                          className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
                          onClick={() => setOpen({ id: o.id, toNote: true })}
                        >
                          <Icon name="truck" size={15} /> Delivery note
                        </button>
                      )}
                      <button className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => setOpen({ id: o.id })}>
                        <Icon name="eye" size={15} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <EmptyRow colSpan={6} title="No orders found" hint="Try a different search or status filter." />
                )}
              </tbody>
            </table>
          </div>
          <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
        </>
      )}

      {open && <OrderDrawer id={open.id} toNote={open.toNote} onClose={() => setOpen(null)} />}
    </>
  );
}

function OrderDrawer({ id, toNote, onClose }: { id: string; toNote?: boolean; onClose: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => adminApi.getOrder(id),
  });

  return (
    <Drawer
      title={data ? `Order ${data.number}` : "Order"}
      meta={
        data && (
          <>
            <StatusPill tone={orderTone(data.status)}>{data.status}</StatusPill>
            <span>{fmtDateTime(data.created_at)}</span>
          </>
        )
      }
      onClose={onClose}
    >
      {isLoading && <span className={s.spinner} />}
      {error && <p className={s.error}>{(error as Error).message}</p>}
      {data && (
        <>
          <DrawerSection title="Customer">
            <p><a className={s.linkBtn} href={`mailto:${data.email}`}>{data.email}</a></p>
          </DrawerSection>

          <DrawerSection title={`Items (${data.items.length})`}>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr><th>Item</th><th className={s.right}>Qty</th><th className={s.right}>Unit</th><th className={s.right}>Total</th></tr>
                </thead>
                <tbody>
                  {data.items.map((it) => (
                    <tr key={it.id}>
                      <td className={s.wrap}>
                        <span className={s.cellStack}>
                          <span className={s.strong}>{it.name}</span>
                          <small className={s.code}>{it.sku}</small>
                        </span>
                      </td>
                      <td className={`${s.right} ${s.num}`}>{it.qty}</td>
                      <td className={`${s.right} ${s.num}`}>{formatPrice(it.unit_price_cents, data.currency)}</td>
                      <td className={`${s.right} ${s.num} ${s.strong}`}>{formatPrice(it.total_cents, data.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DrawerSection>

          <DrawerSection title="Summary">
            <Totals order={data} />
          </DrawerSection>

          {DELIVERABLE.includes(data.status) && <DeliveryNote key={data.delivery_note_number} order={data} scrollTo={toNote} />}

          <DrawerSection title="Shipping">
            <Address value={data.shipping_address} />
            {data.shipping_method && (
              <p className={s.muted} style={{ marginTop: 8 }}>Method: {data.shipping_method}</p>
            )}
          </DrawerSection>

          {data.billing_address && (
            <DrawerSection title="Billing">
              <Address value={data.billing_address} />
            </DrawerSection>
          )}

          {data.customer_note && (
            <DrawerSection title="Customer note">
              <p className={s.quote}>{data.customer_note}</p>
            </DrawerSection>
          )}
        </>
      )}
    </Drawer>
  );
}

const NOTE_FIELDS: { key: keyof DeliveryNoteDetails; label: string; placeholder: string }[] = [
  { key: "packages", label: "No. of packages", placeholder: "1" },
  { key: "weight", label: "Weight", placeholder: "3,10 KG" },
  { key: "size", label: "Size", placeholder: "20x20x20 cm" },
  { key: "hs_code", label: "HS code", placeholder: "84842000" },
  { key: "eori", label: "Customer EORI", placeholder: "Optional" },
];

/** Create / download the delivery note PDF and mail it to dispatch. */
function DeliveryNote({ order, scrollTo }: { order: AdminOrder; scrollTo?: boolean }) {
  const qc = useQueryClient();
  const anchor = useRef<HTMLDivElement>(null);
  // opened from the row's "Delivery note" button: jump straight to this section.
  // Scroll the drawer body itself — scrollIntoView would also drag the page along.
  useEffect(() => {
    const el = anchor.current;
    const body = el?.closest<HTMLElement>(`.${s.drawerBody}`);
    if (scrollTo && el && body) body.scrollTop = el.offsetTop - body.offsetTop - 44;
  }, [scrollTo]);
  const [details, setDetails] = useState<DeliveryNoteDetails>(order.delivery_note ?? {});
  const created = order.delivery_note_number != null;

  const onSaved = (o: AdminOrder) => {
    qc.setQueryData(["admin", "order", order.id], o);
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  };
  const saveMut = useMutation({
    mutationFn: async () => {
      const saved = await adminApi.saveDeliveryNote(order.id, details);
      await downloadDeliveryNote(saved);
      return saved;
    },
    onSuccess: onSaved,
  });
  const sendMut = useMutation({
    // save first so the mailed PDF always carries what is on screen
    mutationFn: async () => {
      await adminApi.saveDeliveryNote(order.id, details);
      return adminApi.sendDeliveryNote(order.id);
    },
    onSuccess: onSaved,
  });
  const busy = saveMut.isPending || sendMut.isPending;
  const err = (saveMut.error ?? sendMut.error) as Error | null;

  return (
    <DrawerSection title="Delivery note">
      <div ref={anchor} />
      {created && (
        <p className={s.row} style={{ marginBottom: 12 }}>
          <span className={s.code}>{order.delivery_note_number}</span>
          {order.delivery_note_sent_at ? (
            <StatusPill tone="ok">Sent {fmtDateTime(order.delivery_note_sent_at)}</StatusPill>
          ) : (
            <StatusPill tone="neutral">Not sent</StatusPill>
          )}
        </p>
      )}
      <div className={s.formGrid}>
        {NOTE_FIELDS.map((f) => (
          <div className={s.field} key={f.key}>
            <label htmlFor={`dn-${f.key}`}>{f.label}</label>
            <input
              id={`dn-${f.key}`}
              className={s.input}
              placeholder={f.placeholder}
              value={details[f.key] ?? ""}
              onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      {err && <p className={s.error} style={{ margin: "12px 0 0" }}>{err.message}</p>}
      <div className={s.row} style={{ marginTop: 14 }}>
        <button
          type="button"
          className={`${s.btn} ${created ? s.btnGhost : ""}`}
          disabled={busy}
          onClick={() => saveMut.mutate()}
        >
          <Icon name="download" size={15} />
          {saveMut.isPending ? "Preparing…" : created ? "Download PDF" : "Create delivery note"}
        </button>
        {created && (
          <button type="button" className={s.btn} disabled={busy} onClick={() => sendMut.mutate()}>
            <Icon name="mail" size={15} />
            {sendMut.isPending
              ? "Sending…"
              : `${order.delivery_note_sent_at ? "Resend" : "Send"} to ${order.delivery_note_email}`}
          </button>
        )}
      </div>
    </DrawerSection>
  );
}

const humanize = (key: string) => {
  const text = key.replace(/_/g, " ").replace(/([a-z])(\d)/g, "$1 $2");
  return text[0].toUpperCase() + text.slice(1);
};

/** Addresses are stored as free-form JSON; list whatever fields are filled in. */
function Address({ value }: { value: Record<string, unknown> | null }) {
  const rows = Object.entries(value ?? {}).filter(([, v]) => v != null && v !== "");
  if (rows.length === 0) return <p className={s.muted}>Not provided.</p>;
  return (
    <dl className={s.dl}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <dt>{humanize(k)}</dt>
          <dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Totals({ order }: { order: AdminOrder }) {
  const c = order.currency;
  return (
    <div className={s.totals}>
      <div className={s.totalsRow}><span>Subtotal</span><span>{formatPrice(order.subtotal_cents, c)}</span></div>
      {order.discount_cents > 0 && (
        <div className={s.totalsRow}><span>Discount</span><span>−{formatPrice(order.discount_cents, c)}</span></div>
      )}
      <div className={s.totalsRow}><span>Shipping</span><span>{formatPrice(order.shipping_cents, c)}</span></div>
      <div className={s.totalsRow}><span>Tax</span><span>{formatPrice(order.tax_cents, c)}</span></div>
      <div className={`${s.totalsRow} ${s.totalsGrand}`}><span>Total</span><span>{formatPrice(order.total_cents, c)}</span></div>
    </div>
  );
}
