import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminBrand } from "../../lib/adminApi";
import { ExportButtons } from "./ExportButtons";
import s from "./Admin.module.css";

const SEGMENTS = ["aftermarket", "replacement", "oem"] as const;
const BLANK = { slug: "", name: "", segment: "aftermarket", logo_url: "", description: "" };

export function BrandsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "brands"], queryFn: adminApi.listBrands });
  const [form, setForm] = useState<Record<string, string>>(BLANK);
  const [msg, setMsg] = useState<string | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "brands"] });

  const create = useMutation({
    mutationFn: () => adminApi.createBrand(form),
    onSuccess: () => {
      setForm(BLANK);
      setMsg("Brand created");
      invalidate();
    },
    onError: (e) => setMsg((e as Error).message),
  });
  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteBrand(id),
    onSuccess: invalidate,
    onError: (e) => setMsg((e as Error).message),
  });

  return (
    <>
      <div className={s.row} style={{ justifyContent: "space-between" }}>
        <h1 className={s.h1}>Brands</h1>
        <ExportButtons resource="brands" />
      </div>
      {msg && <p className={s.error}>{msg}</p>}

      <form
        className={`${s.card}`}
        style={{ padding: "var(--space-4)", marginBottom: "var(--space-5)" }}
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          create.mutate();
        }}
      >
        <div className={s.toolbar} style={{ marginBottom: 0 }}>
          <input className={s.input} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={s.input} placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          <select className={s.select} value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}>
            {SEGMENTS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <input className={s.input} placeholder="logo URL" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
          <button className={s.btn} type="submit" disabled={create.isPending}>Add brand</button>
        </div>
      </form>

      {isLoading && <p className={s.muted}>Loading…</p>}
      {error && <p className={s.error}>{(error as Error).message}</p>}
      {data && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Name</th><th>Slug</th><th>Segment</th><th>Products</th><th></th></tr>
            </thead>
            <tbody>
              {data.map((b) => <BrandRow key={b.id} brand={b} onChanged={invalidate} onDelete={() => del.mutate(b.id)} onError={setMsg} />)}
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

  const patch = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateBrand(brand.id, data),
    onSuccess: onChanged,
    onError: (e) => onError((e as Error).message),
  });

  return (
    <tr>
      <td><input className={s.input} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== brand.name && patch.mutate({ name })} /></td>
      <td><input className={s.input} value={slug} onChange={(e) => setSlug(e.target.value)} onBlur={() => slug !== brand.slug && patch.mutate({ slug })} /></td>
      <td>
        <select className={s.select} value={segment} onChange={(e) => { setSegment(e.target.value as AdminBrand["segment"]); patch.mutate({ segment: e.target.value }); }}>
          {SEGMENTS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </td>
      <td className={s.muted}>{brand.product_count}</td>
      <td>
        <button
          className={`${s.btn} ${s.btnDanger}`}
          onClick={() => { if (confirm(`Delete brand "${brand.name}"?`)) onDelete(); }}
        >
          Del
        </button>
      </td>
    </tr>
  );
}
