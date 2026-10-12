import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminBrand } from "../../lib/adminApi";
import { ExportButtons } from "./ExportButtons";
import { ConfirmModal } from "./ConfirmModal";
import { DeleteButton, EmptyRow, Icon, PageHeader, TableSkeleton } from "./ui";
import s from "./Admin.module.css";

const SEGMENTS = ["aftermarket", "replacement", "oem"] as const;
const BLANK = { slug: "", name: "", segment: "aftermarket", logo_url: "", description: "" };

export function BrandsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "brands"], queryFn: adminApi.listBrands });
  const [form, setForm] = useState<Record<string, string>>(BLANK);
  const [msg, setMsg] = useState<{ kind: "ok" | "danger"; text: string } | null>(null);
  const fail = (text: string) => setMsg({ kind: "danger", text });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "brands"] });

  const create = useMutation({
    mutationFn: () => adminApi.createBrand(form),
    onSuccess: () => {
      setForm(BLANK);
      setMsg({ kind: "ok", text: "Brand created" });
      invalidate();
    },
    onError: (e) => fail((e as Error).message),
  });
  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteBrand(id),
    onSuccess: invalidate,
    onError: (e) => fail((e as Error).message),
  });

  return (
    <>
      <PageHeader
        title="Brands"
        subtitle="Edits to a row save as soon as you leave the field."
        actions={<ExportButtons resource="brands" />}
      />
      {msg && <p className={msg.kind === "ok" ? s.notice : s.error} data-tone={msg.kind}>{msg.text}</p>}

      <form
        className={`${s.card} ${s.cardPad}`}
        style={{ marginBottom: 20 }}
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          create.mutate();
        }}
      >
        <h2 className={s.cardTitle}>Add a brand</h2>
        <p className={s.cardSub}>The slug is used in storefront URLs.</p>
        <div className={s.inlineForm}>
          <div className={s.field}>
            <label htmlFor="brand-name">Name</label>
            <input id="brand-name" className={s.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className={s.field}>
            <label htmlFor="brand-slug">Slug</label>
            <input id="brand-slug" className={s.input} placeholder="e.g. caterpillar" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </div>
          <div className={s.field}>
            <label htmlFor="brand-segment">Segment</label>
            <select id="brand-segment" className={s.select} value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}>
              {SEGMENTS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className={s.field}>
            <label htmlFor="brand-logo">Logo URL</label>
            <input id="brand-logo" className={s.input} placeholder="Optional" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
          </div>
          <button className={s.btn} type="submit" disabled={create.isPending}>
            <Icon name="plus" /> {create.isPending ? "Adding…" : "Add brand"}
          </button>
        </div>
      </form>

      {isLoading && <TableSkeleton cols={5} />}
      {error && <p className={s.error}>{(error as Error).message}</p>}
      {data && (
        <div className={s.tableWrap}>
          <table className={`${s.table} ${s.tableStack}`}>
            <thead>
              <tr><th>Name</th><th>Slug</th><th>Segment</th><th className={s.right}>Products</th><th></th></tr>
            </thead>
            <tbody>
              {data.map((b) => <BrandRow key={b.id} brand={b} onChanged={invalidate} onDelete={() => del.mutate(b.id)} onError={fail} />)}
              {data.length === 0 && <EmptyRow colSpan={5} title="No brands yet" hint="Add your first brand above." />}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function BrandRow({
  brand,
  onChanged,
  onDelete,
  onError,
}: {
  brand: AdminBrand;
  onChanged: () => void;
  onDelete: () => void;
  onError: (m: string) => void;
}) {
  const [name, setName] = useState(brand.name);
  const [slug, setSlug] = useState(brand.slug);
  const [segment, setSegment] = useState(brand.segment);
  const [confirming, setConfirming] = useState(false);

  const patch = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateBrand(brand.id, data),
    onSuccess: onChanged,
    onError: (e) => onError((e as Error).message),
  });

  return (
    <tr>
      <td data-label="Name"><input className={s.input} aria-label="Brand name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== brand.name && patch.mutate({ name })} /></td>
      <td data-label="Slug"><input className={`${s.input} ${s.mono}`} aria-label="Brand slug" value={slug} onChange={(e) => setSlug(e.target.value)} onBlur={() => slug !== brand.slug && patch.mutate({ slug })} /></td>
      <td data-label="Segment">
        <select className={s.select} aria-label="Brand segment" value={segment} onChange={(e) => { setSegment(e.target.value as AdminBrand["segment"]); patch.mutate({ segment: e.target.value }); }}>
          {SEGMENTS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </td>
      <td data-label="Products" className={`${s.right} ${s.num}`}>{brand.product_count}</td>
      <td className={s.cellActions}>
        <DeleteButton label={`Delete ${brand.name}`} onClick={() => setConfirming(true)} />
        {confirming && (
          <ConfirmModal
            title="Delete brand"
            message={`Delete brand "${brand.name}"? This cannot be undone.`}
            onConfirm={() => { setConfirming(false); onDelete(); }}
            onClose={() => setConfirming(false)}
          />
        )}
      </td>
    </tr>
  );
}
