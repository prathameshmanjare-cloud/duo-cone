import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { adminApi, type AdminProduct } from "../../lib/adminApi";
import { formatPrice } from "../../lib/format";
import { ExportButtons } from "./ExportButtons";
import { ConfirmModal } from "./ConfirmModal";
import { usePrefersReducedMotion } from "./motionPrefs";
import { DeleteButton, EmptyRow, Icon, PageHeader, Pager, SearchField, TableSkeleton } from "./ui";
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

  return (
    <>
      <PageHeader
        title="Products & stock"
        subtitle="Prices and stock save as soon as you leave a field."
        actions={
          <>
            <ExportButtons
              resource="products"
              params={{
                q: params.q,
                is_active: params.is_active,
                is_rfq_only: params.is_rfq_only,
                stock: params.stock,
              }}
            />
            <Link className={s.btn} to="/admin/products/new">
              <Icon name="plus" /> New product
            </Link>
          </>
        }
      />

      <form
        className={s.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
      >
        <SearchField value={q} onChange={setQ} placeholder="Search name, SKU or slug" />
        <select
          className={s.select}
          aria-label="Filter by status"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="rfq">Quote-only</option>
        </select>
        <select
          className={s.select}
          aria-label="Filter by stock"
          value={stock}
          onChange={(e) => { setStock(e.target.value); setPage(1); }}
        >
          <option value="">Any stock</option>
          <option value="out">Out of stock</option>
          <option value="low">Low (≤5)</option>
        </select>
        <button className={`${s.btn} ${s.btnGhost}`} type="submit">Search</button>
      </form>

      {isLoading && <TableSkeleton cols={7} />}
      {error && <p className={s.error}>{(error as Error).message}</p>}
      {del.error && <p className={s.error}>{(del.error as Error).message}</p>}

      {data && (
        <>
          <div className={s.tableWrap}>
            <table className={`${s.table} ${s.tableStack}`}>
              <thead>
                <tr>
                  <th>Product</th>
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
                  <EmptyRow colSpan={7} title="No products match" hint="Clear the filters or add a new product." />
                )}
              </tbody>
            </table>
          </div>
          <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
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
      <td data-primary>
        <span className={s.cellStack}>
          <span>
            <Link to={`/admin/products/${product.id}`}>{product.name}</Link>
            {msg && <span className={s.savedTag}>{msg}</span>}
          </span>
          <small className={s.code}>{product.sku}</small>
        </span>
      </td>
      <td data-label={`Price (${product.currency})`}>
        <input
          className={s.cellInput}
          aria-label={`Price for ${product.name}`}
          title={`Current: ${formatPrice(product.price_cents, product.currency)}`}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={savePrice}
          inputMode="decimal"
        />
      </td>
      <td data-label="Sale price">
        <input
          className={s.cellInput}
          aria-label={`Sale price for ${product.name}`}
          value={sale}
          placeholder="—"
          onChange={(e) => setSale(e.target.value)}
          onBlur={saveSale}
          inputMode="decimal"
        />
      </td>
      <td data-label="Stock">
        <span className={s.cellInline}>
          <input
            className={s.cellInput}
            style={{ width: 68 }}
            aria-label={`Stock for ${product.name}`}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onBlur={saveQty}
            inputMode="numeric"
          />
          <span className={s.badge} data-tone={stockQty <= 0 ? "danger" : stockQty <= 5 ? "warn" : "ok"}>
            {stockQty <= 0 ? "Out" : stockQty <= 5 ? "Low" : "In stock"}
          </span>
        </span>
      </td>
      <td data-label="Active">
        <input
          type="checkbox"
          className={s.switch}
          aria-label={`${product.name} active`}
          checked={product.is_active}
          onChange={(e) => patch.mutate({ is_active: e.target.checked })}
        />
      </td>
      <td data-label="Quote-only">
        <input
          type="checkbox"
          className={s.switch}
          aria-label={`${product.name} quote-only`}
          checked={product.is_rfq_only}
          onChange={(e) => patch.mutate({ is_rfq_only: e.target.checked })}
        />
      </td>
      <td className={s.cellActions}>
        <Link className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} to={`/admin/products/${product.id}`}>
          Edit
        </Link>
        <DeleteButton label={`Delete ${product.name}`} onClick={() => setConfirming(true)} />
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
