import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminOrder, type OrderStatus } from "../../lib/adminApi";
import { formatPrice } from "../../lib/format";
import { ExportButtons } from "./ExportButtons";
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

const badgeClass = (st: OrderStatus) =>
  st === "cancelled" || st === "refunded"
    ? s.badgeDanger
    : st === "pending"
      ? s.badgeWarn
      : s.badgeOk;

export function OrdersAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

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

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <div className={s.row} style={{ justifyContent: "space-between" }}>
        <h1 className={s.h1}>Orders</h1>
        <ExportButtons resource="orders" params={{ q: search || undefined, status: status || undefined }} />
      </div>
      <form
        className={s.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
      >
        <input className={s.input} placeholder="Search number / email" value={q} onChange={(e) => setQ(e.target.value)} />
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
                <tr><th>Number</th><th>Date</th><th>Email</th><th>Total</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o.id}>
                    <td>{o.number}</td>
                    <td className={s.muted}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}</td>
                    <td>{o.email}</td>
                    <td>{formatPrice(o.total_cents, o.currency)}</td>
                    <td>
                      <select
                        className={s.select}
                        value={o.status}
                        onChange={(e) => setStatusMut.mutate({ id: o.id, st: e.target.value as OrderStatus })}
                      >
                        {STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </td>
                    <td>
                      <button className={`${s.btn} ${s.btnGhost}`} onClick={() => setOpen(o.id)}>View</button>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr><td colSpan={6} className={s.muted}>No orders.</td></tr>
                )}
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

      {open && <OrderDrawer id={open} onClose={() => setOpen(null)} badge={badgeClass} />}
    </>
  );
}

function OrderDrawer({
  id,
  onClose,
  badge,
}: {
  id: string;
  onClose: () => void;
  badge: (st: OrderStatus) => string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => adminApi.getOrder(id),
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
            <p>
              <span className={`${s.badge} ${badge(data.status)}`}>{data.status}</span>{" "}
              <span className={s.muted}>{data.created_at ? new Date(data.created_at).toLocaleString() : ""}</span>
            </p>
            <p>{data.email}</p>
            <Totals order={data} />
            <h3>Items</h3>
            <table className={s.table}>
              <thead><tr><th>SKU</th><th>Name</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
              <tbody>
                {data.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.sku}</td>
                    <td>{it.name}</td>
                    <td>{it.qty}</td>
                    <td>{formatPrice(it.unit_price_cents, data.currency)}</td>
                    <td>{formatPrice(it.total_cents, data.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3>Shipping address</h3>
            <pre className={s.muted} style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(data.shipping_address, null, 2)}
            </pre>
            {data.customer_note && (
              <>
                <h3>Customer note</h3>
                <p>{data.customer_note}</p>
              </>
            )}
          </>
        )}
      </aside>
    </>
  );
}

function Totals({ order }: { order: AdminOrder }) {
  const c = order.currency;
  return (
    <table className={s.table}>
      <tbody>
        <tr><td>Subtotal</td><td>{formatPrice(order.subtotal_cents, c)}</td></tr>
        <tr><td>Discount</td><td>-{formatPrice(order.discount_cents, c)}</td></tr>
        <tr><td>Shipping</td><td>{formatPrice(order.shipping_cents, c)}</td></tr>
        <tr><td>Tax</td><td>{formatPrice(order.tax_cents, c)}</td></tr>
        <tr><td><strong>Total</strong></td><td><strong>{formatPrice(order.total_cents, c)}</strong></td></tr>
      </tbody>
    </table>
  );
}
