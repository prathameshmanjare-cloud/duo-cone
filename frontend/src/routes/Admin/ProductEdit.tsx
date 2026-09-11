import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { adminApi, type ProductImageRow } from "../../lib/adminApi";
import { ConfirmModal } from "./ConfirmModal";
import { usePrefersReducedMotion } from "./motionPrefs";
import s from "./Admin.module.css";

type Form = Record<string, string | boolean>;

const NUMERIC_CENTS = new Set(["price_cents", "sale_price_cents"]);
const NUMERIC = new Set([
  "brand_id",
  "weight_g",
  "warranty_months",
  "inner_diameter_mm",
  "outer_diameter_mm",
  "height_mm",
  "stock_qty",
]);

const TEXT_FIELDS: { key: string; label: string; full?: boolean; textarea?: boolean }[] = [
  { key: "name", label: "Name", full: true },
  { key: "sku", label: "SKU (OEM ref no.)" },
  { key: "slug", label: "Slug (blank = auto)" },
  { key: "internal_code", label: "Internal code" },
  { key: "material", label: "Material" },
  { key: "oring_material", label: "O-ring material" },
  { key: "hardness_hrc", label: "Hardness HRC" },
  { key: "lifetime_hours", label: "Lifetime hours" },
  { key: "inner_diameter_mm", label: "Inner Ø mm" },
  { key: "outer_diameter_mm", label: "Outer Ø mm" },
  { key: "height_mm", label: "Height mm" },
  { key: "weight_g", label: "Weight g" },
  { key: "warranty_months", label: "Warranty months" },
  { key: "seo_title", label: "SEO title", full: true },
  { key: "seo_description", label: "SEO description", full: true, textarea: true },
  { key: "short_description", label: "Short description", full: true, textarea: true },
  { key: "description_html", label: "Description HTML", full: true, textarea: true },
];

export function ProductEdit() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>({
    name: "",
    sku: "",
    slug: "",
    seal_type: "other",
    currency: "EUR",
    tax_class: "standard",
    price_cents: "0",
    sale_price_cents: "",
    brand_id: "",
    is_active: true,
    is_rfq_only: false,
    stock_qty: "0",
  });
  const [error, setError] = useState<string | null>(null);

  const brands = useQuery({ queryKey: ["admin", "brands"], queryFn: adminApi.listBrands });

  const existing = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => adminApi.getProduct(id as string),
    enabled: !isNew,
  });

  useEffect(() => {
    const p = existing.data;
    if (!p) return;
    setForm({
      name: p.name,
      sku: p.sku,
      slug: p.slug,
      seal_type: p.seal_type,
      currency: p.currency,
      tax_class: p.tax_class,
      price_cents: (p.price_cents / 100).toString(),
      sale_price_cents: p.sale_price_cents != null ? (p.sale_price_cents / 100).toString() : "",
      brand_id: p.brand_id != null ? String(p.brand_id) : "",
      internal_code: p.internal_code ?? "",
      material: p.material ?? "",
      oring_material: p.oring_material ?? "",
      hardness_hrc: p.hardness_hrc ?? "",
      lifetime_hours: p.lifetime_hours ?? "",
      inner_diameter_mm: p.inner_diameter_mm != null ? String(p.inner_diameter_mm) : "",
      outer_diameter_mm: p.outer_diameter_mm != null ? String(p.outer_diameter_mm) : "",
      height_mm: p.height_mm != null ? String(p.height_mm) : "",
      weight_g: p.weight_g != null ? String(p.weight_g) : "",
      warranty_months: p.warranty_months != null ? String(p.warranty_months) : "",
      seo_title: p.seo_title ?? "",
      seo_description: p.seo_description ?? "",
      short_description: p.short_description ?? "",
      description_html: p.description_html ?? "",
      is_active: p.is_active,
      is_rfq_only: p.is_rfq_only,
    });
  }, [existing.data]);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  function buildPayload(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (typeof v === "boolean") {
        out[k] = v;
      } else if (NUMERIC_CENTS.has(k)) {
        out[k] = v.trim() === "" ? null : Math.round(parseFloat(v) * 100);
      } else if (NUMERIC.has(k)) {
        out[k] = v.trim() === "" ? null : Number(v);
      } else {
        out[k] = v.trim() === "" ? (isNew ? undefined : null) : v;
      }
    }
    if (out.slug === "" || out.slug == null) delete out.slug;
    if (isNew && out.stock_qty == null) delete out.stock_qty;
    if (!isNew) delete out.stock_qty; // stock handled on the products table / inventory endpoint
    return out;
  }

  const save = useMutation({
    mutationFn: () =>
      isNew
        ? adminApi.createProduct(buildPayload())
        : adminApi.updateProduct(id as string, buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      navigate("/admin/products");
    },
    onError: (e) => setError((e as Error).message),
  });

  if (!isNew && existing.isLoading) return <p className={s.muted}>Loading…</p>;

  return (
    <>
      <h1 className={s.h1}>{isNew ? "New product" : `Edit — ${existing.data?.name ?? ""}`}</h1>
      {error && <p className={s.error}>{error}</p>}

      <form
        className={`${s.card}`}
        style={{ padding: "var(--space-5)" }}
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          save.mutate();
        }}
      >
        <div className={s.formGrid}>
          <div className={s.field}>
            <label>Seal type</label>
            <select className={s.select} value={String(form.seal_type)} onChange={(e) => set("seal_type", e.target.value)}>
              <option value="DF">DF</option>
              <option value="DO">DO</option>
              <option value="other">other</option>
            </select>
          </div>
          <div className={s.field}>
            <label>Brand</label>
            <select className={s.select} value={String(form.brand_id)} onChange={(e) => set("brand_id", e.target.value)}>
              <option value="">— none —</option>
              {brands.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className={s.field}>
            <label>Price ({String(form.currency)})</label>
            <input className={s.input} value={String(form.price_cents)} onChange={(e) => set("price_cents", e.target.value)} inputMode="decimal" />
          </div>
          <div className={s.field}>
            <label>Sale price (blank = none)</label>
            <input className={s.input} value={String(form.sale_price_cents)} onChange={(e) => set("sale_price_cents", e.target.value)} inputMode="decimal" />
          </div>
          <div className={s.field}>
            <label>Currency</label>
            <input className={s.input} value={String(form.currency)} onChange={(e) => set("currency", e.target.value)} maxLength={3} />
          </div>
          <div className={s.field}>
            <label>Tax class</label>
            <input className={s.input} value={String(form.tax_class)} onChange={(e) => set("tax_class", e.target.value)} />
          </div>
          {isNew && (
            <div className={s.field}>
              <label>Initial stock qty</label>
              <input className={s.input} value={String(form.stock_qty)} onChange={(e) => set("stock_qty", e.target.value)} inputMode="numeric" />
            </div>
          )}

          {TEXT_FIELDS.map((f) => (
            <div key={f.key} className={`${s.field} ${f.full ? s.full : ""}`}>
              <label>{f.label}</label>
              {f.textarea ? (
                <textarea
                  className={s.textarea}
                  value={String(form[f.key] ?? "")}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : (
                <input
                  className={s.input}
                  value={String(form[f.key] ?? "")}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className={`${s.field} ${s.full} ${s.row}`}>
            <label className={s.row}>
              <input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => set("is_active", e.target.checked)} /> Active
            </label>
            <label className={s.row}>
              <input type="checkbox" checked={Boolean(form.is_rfq_only)} onChange={(e) => set("is_rfq_only", e.target.checked)} /> Quote-only (RFQ)
            </label>
          </div>
        </div>

        <div className={s.row} style={{ marginTop: "var(--space-5)" }}>
          <button className={s.btn} type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
          <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={() => navigate("/admin/products")}>
            Cancel
          </button>
        </div>
      </form>

      {!isNew && id && (
        <>
          <CrossRefEditor productId={id} />
          <ImageEditor productId={id} />
        </>
      )}
    </>
  );
}

function CrossRefEditor({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const key = ["admin", "crossrefs", productId];
  const { data } = useQuery({ queryKey: key, queryFn: () => adminApi.listCrossRefs(productId) });
  const [ref, setRef] = useState("");
  const [brand, setBrand] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const add = useMutation({
    mutationFn: () => adminApi.addCrossRef(productId, { ref_number: ref, ref_brand: brand || null, note: note || null }),
    onSuccess: () => { setRef(""); setBrand(""); setNote(""); invalidate(); },
    onError: (e) => setMsg((e as Error).message),
  });
  const del = useMutation({
    mutationFn: (rid: number) => adminApi.deleteCrossRef(productId, rid),
    onSuccess: invalidate,
  });

  return (
    <div className={s.card} style={{ padding: "var(--space-5)", marginTop: "var(--space-5)" }}>
      <h2 style={{ marginTop: 0 }}>Cross-references (OEM / competitor part numbers)</h2>
      {msg && <p className={s.error}>{msg}</p>}
      <div className={s.toolbar}>
        <input className={s.input} placeholder="Reference no." value={ref} onChange={(e) => setRef(e.target.value)} />
        <input className={s.input} placeholder="Ref brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <input className={s.input} placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className={s.btn} disabled={!ref || add.isPending} onClick={() => { setMsg(null); add.mutate(); }}>
          Add
        </button>
      </div>
      <table className={s.table}>
        <thead><tr><th>Reference</th><th>Brand</th><th>Note</th><th></th></tr></thead>
        <tbody>
          {data?.map((r) => (
            <tr key={r.id}>
              <td>{r.ref_number}</td>
              <td>{r.ref_brand ?? "—"}</td>
              <td>{r.note ?? "—"}</td>
              <td><button className={`${s.btn} ${s.btnDanger}`} onClick={() => del.mutate(r.id)}>Del</button></td>
            </tr>
          ))}
          {data?.length === 0 && <tr><td colSpan={4} className={s.muted}>None yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function ImageEditor({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const key = ["admin", "images", productId];
  const { data } = useQuery({ queryKey: key, queryFn: () => adminApi.listImages(productId) });
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [pos, setPos] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ProductImageRow | null>(null);
  const reduceMotion = usePrefersReducedMotion();
  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const add = useMutation({
    mutationFn: () => adminApi.addImage(productId, { url, alt: alt || null, position: Number(pos) || 0 }),
    onSuccess: () => { setUrl(""); setAlt(""); setPos("0"); invalidate(); },
    onError: (e) => setMsg((e as Error).message),
  });
  const upload = useMutation({
    mutationFn: () =>
      adminApi.uploadImage(productId, file as File, { alt: alt || undefined, position: Number(pos) || 0 }),
    onSuccess: () => { setFile(null); setAlt(""); setPos("0"); invalidate(); },
    onError: (e) => setMsg((e as Error).message),
  });
  const del = useMutation({
    mutationFn: (iid: number) => adminApi.deleteImage(productId, iid),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: (args: { id: number; position: number }) =>
      adminApi.updateImage(productId, args.id, { position: args.position }),
    onSuccess: invalidate,
    onError: (e) => setMsg((e as Error).message),
  });

  const images = [...(data ?? [])].sort((a, b) => a.position - b.position || a.id - b.id);

  function move(index: number, dir: -1 | 1) {
    const other = images[index + dir];
    const self = images[index];
    if (!other) return;
    // swap positions so ordering (and any tie-break on id) moves as expected
    reorder.mutate({ id: self.id, position: other.position });
    reorder.mutate({ id: other.id, position: self.position });
  }

  return (
    <div className={s.card} style={{ padding: "var(--space-5)", marginTop: "var(--space-5)" }}>
      <h2 style={{ marginTop: 0 }}>Images</h2>
      {msg && <p className={s.error}>{msg}</p>}

      <div className={s.toolbar} style={{ alignItems: "center" }}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          onChange={(e) => { setMsg(null); setFile(e.target.files?.[0] ?? null); }}
        />
        {file && (
          <img
            src={URL.createObjectURL(file)}
            alt=""
            style={{ height: 40, width: 40, objectFit: "cover", borderRadius: 6 }}
          />
        )}
        <motion.button
          className={s.btn}
          disabled={!file || upload.isPending}
          onClick={() => { setMsg(null); upload.mutate(); }}
          whileHover={reduceMotion || !file ? undefined : { scale: 1.03 }}
          whileTap={reduceMotion || !file ? undefined : { scale: 0.97 }}
        >
          {upload.isPending ? "Uploading…" : "Upload photo"}
        </motion.button>
      </div>

      <p className={s.muted} style={{ margin: "6px 0 10px" }}>
        …or add an image already hosted somewhere:
      </p>
      <div className={s.toolbar}>
        <input className={s.input} placeholder="Image URL or /path" value={url} onChange={(e) => setUrl(e.target.value)} />
        <input className={s.input} placeholder="Alt text" value={alt} onChange={(e) => setAlt(e.target.value)} />
        <input className={s.input} style={{ width: 70 }} placeholder="pos" value={pos} onChange={(e) => setPos(e.target.value)} inputMode="numeric" />
        <button className={s.btn} disabled={!url || add.isPending} onClick={() => { setMsg(null); add.mutate(); }}>Add</button>
      </div>
      <table className={s.table}>
        <thead><tr><th>Preview</th><th>URL</th><th>Alt</th><th>Pos</th><th>Order</th><th></th></tr></thead>
        <tbody>
          <AnimatePresence initial={false}>
            {images.map((img, i) => (
              <motion.tr
                key={img.id}
                layout={reduceMotion ? undefined : true}
                initial={reduceMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
              >
                <td><img src={img.url} alt={img.alt ?? ""} style={{ height: 40, width: 40, objectFit: "cover" }} /></td>
                <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>{img.url}</td>
                <td>{img.alt ?? "—"}</td>
                <td>{img.position}</td>
                <td className={s.row}>
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnGhost}`}
                    disabled={i === 0 || reorder.isPending}
                    onClick={() => move(i, -1)}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnGhost}`}
                    disabled={i === images.length - 1 || reorder.isPending}
                    onClick={() => move(i, 1)}
                    title="Move down"
                  >
                    ↓
                  </button>
                </td>
                <td>
                  <button className={`${s.btn} ${s.btnDanger}`} onClick={() => setDeleting(img)}>Del</button>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
          {images.length === 0 && <tr><td colSpan={6} className={s.muted}>No images.</td></tr>}
        </tbody>
      </table>

      {deleting && (
        <ConfirmModal
          title="Delete image"
          message="Remove this image from the product? This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => { del.mutate(deleting.id); setDeleting(null); }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
