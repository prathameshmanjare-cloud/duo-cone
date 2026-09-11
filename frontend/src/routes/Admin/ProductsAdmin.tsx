import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { adminApi, type AdminProduct } from "../../lib/adminApi";
import { formatPrice } from "../../lib/format";
import { ExportButtons } from "./ExportButtons";
import { ConfirmModal } from "./ConfirmModal";
import { usePrefersReducedMotion } from "./motionPrefs";
import s from "./Admin.module.css";

const PAGE_SIZE = 50;

export function ProductsAdmin() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [stock, setStock] = useState(searchParams.get("stock") ?? "");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const params = {
    q: search || undefined,
    stock: stock || undefined,
    is_active: status === "active" ? true : status === "inactive" ? false : undefined,
    is_rfq_only: status === "rfq" ? true : undefined,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "products", params],
    queryFn: () => adminApi.listProducts(params),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "products"] });

  const del = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: invalidate,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <div className={s.row} style={{ justifyContent: "space-between" }}>
        <h1 className={s.h1}>Products &amp; stock</h1>
        <span className={s.actions}>
          <ExportButtons
            resource="products"
            params={{
              q: params.q,
              is_active: params.is_active,
              is_rfq_only: params.is_rfq_only,
              stock: params.stock,
            }}
          />
          <Link className={s.btn} to="/admin/products/new">+ New product</Link>
        </span>
      </div>

      <form
        className={s.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
      >
        <input
          className={s.input}
          placeholder="Search name / SKU / slug"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className={s.select} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="rfq">Quote-only</option>
        </select>
        <select className={s.select} value={stock} onChange={(e) => { setStock(e.target.value); setPage(1); }}>
          <option value="">Any stock</option>
          <option value="out">Out of stock</option>
          <option value="low">Low (≤5)</option>
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
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Sale</th>
                  <th>Stock</th>
                  <th>Active</th>
                  <th>Quote-only</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {data.items.map((p) => (
                    <ProductRow key={p.id} product={p} onChanged={invalidate} onDelete={() => del.mutate(p.id)} />
                  ))}
                </AnimatePresence>
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className={s.muted}>No products match.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={s.pager}>
            <button className={`${s.btn} ${s.btnGhost}`} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>
            <span className={s.muted}>
              Page {page} / {totalPages} · {data.total} total
            </span>
            <button
              className={`${s.btn} ${s.btnGhost}`}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  );
}

function ProductRow({
  product,
  onChanged,
  onDelete,
}: {
  product: AdminProduct;
  onChanged: () => void;
  onDelete: () => void;
}) {
  const [price, setPrice] = useState((product.price_cents / 100).toString());
  const [sale, setSale] = useState(
    product.sale_price_cents != null ? (product.sale_price_cents / 100).toString() : ""
  );
  const [qty, setQty] = useState((product.inventory?.stock_qty ?? 0).toString());
  const [msg, setMsg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  const patch = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateProduct(product.id, data),
    onSuccess: () => {
      setMsg("saved");
      onChanged();
      setTimeout(() => setMsg(null), 1500);
    },
    onError: (e) => setMsg((e as Error).message),
  });

  const invMut = useMutation({
    mutationFn: (stock_qty: number) =>
      adminApi.setInventory(product.id, {
        stock_qty,
        backorder: product.inventory?.backorder ?? "notify",
        lead_time_days: product.inventory?.lead_time_days ?? 3,
        warehouse: product.inventory?.warehouse ?? "DE",
      }),
    onSuccess: () => {
      setMsg("saved");
      onChanged();
      setTimeout(() => setMsg(null), 1500);
    },
    onError: (e) => setMsg((e as Error).message),
  });

  const toCents = (v: string) => Math.round(parseFloat(v) * 100);

  function savePrice() {
    const c = toCents(price);
    if (!Number.isFinite(c) || c < 0) return setMsg("bad price");
    if (c !== product.price_cents) patch.mutate({ price_cents: c });
  }
  function saveSale() {
    if (sale.trim() === "") {
      if (product.sale_price_cents != null) patch.mutate({ sale_price_cents: null });
      return;
    }
    const c = toCents(sale);
    if (!Number.isFinite(c) || c < 0) return setMsg("bad sale");
    if (c !== product.sale_price_cents) patch.mutate({ sale_price_cents: c });
  }
  function saveQty() {
    const n = parseInt(qty, 10);
    if (!Number.isFinite(n) || n < 0) return setMsg("bad qty");
    if (n !== (product.inventory?.stock_qty ?? 0)) invMut.mutate(n);
  }

  const stockQty = product.inventory?.stock_qty ?? 0;

  return (
    <motion.tr
      layout={reduceMotion ? undefined : true}
      initial={reduceMotion ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
      transition={{ duration: reduceMotion ? 0 : 0.18 }}
    >
      <td>
        <Link to={`/admin/products/${product.id}`}>{product.name}</Link>
        {msg && <span className={s.muted}> · {msg}</span>}
      </td>
      <td className={s.muted}>{product.sku}</td>
      <td>
        <input
          className={s.cellInput}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={savePrice}
          inputMode="decimal"
        />
      </td>
      <td>
        <input
          className={s.cellInput}
          value={sale}
          placeholder="—"
          onChange={(e) => setSale(e.target.value)}
          onBlur={saveSale}
          inputMode="decimal"
        />
      </td>
      <td>
        <input
          className={s.cellInput}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onBlur={saveQty}
          inputMode="numeric"
        />
        <span className={`${s.badge} ${stockQty <= 0 ? s.badgeDanger : stockQty <= 5 ? s.badgeWarn : s.badgeOk}`}>
          {stockQty <= 0 ? "out" : stockQty <= 5 ? "low" : "ok"}
        </span>
      </td>
      <td>
        <input
          type="checkbox"
          checked={product.is_active}
          onChange={(e) => patch.mutate({ is_active: e.target.checked })}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={product.is_rfq_only}
          onChange={(e) => patch.mutate({ is_rfq_only: e.target.checked })}
        />
      </td>
      <td className={s.actions}>
        <span className={s.muted} title={`current: ${formatPrice(product.price_cents, product.currency)}`}>
          {product.currency}
        </span>
        <motion.button
          className={`${s.btn} ${s.btnDanger}`}
          onClick={() => setConfirming(true)}
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        >
          Del
        </motion.button>
      </td>
      {confirming && (
        <ConfirmModal
          title="Delete product"
          message={`Delete "${product.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            setConfirming(false);
            onDelete();
          }}
          onClose={() => setConfirming(false)}
        />
      )}
    </motion.tr>
  );
}
