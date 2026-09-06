import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminCategory } from "../../lib/adminApi";
import { ExportButtons } from "./ExportButtons";
import s from "./Admin.module.css";

const BLANK = { slug: "", name: "", image_url: "", description: "", sort: "0" };

export function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminApi.listCategories,
  });
  const [form, setForm] = useState<Record<string, string>>(BLANK);
  const [msg, setMsg] = useState<string | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "categories"] });

  const create = useMutation({
    mutationFn: () => adminApi.createCategory({ ...form, sort: Number(form.sort) || 0 }),
    onSuccess: () => {
      setForm(BLANK);
      setMsg("Category created");
      invalidate();
    },
    onError: (e) => setMsg((e as Error).message),
  });
  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteCategory(id),
    onSuccess: invalidate,
    onError: (e) => setMsg((e as Error).message),
  });

  return (
    <>
      <div className={s.row} style={{ justifyContent: "space-between" }}>
        <h1 className={s.h1}>Categories</h1>
        <ExportButtons resource="categories" />
      </div>
      {msg && <p className={s.error}>{msg}</p>}

      <form
        className={s.card}
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
          <input className={s.input} placeholder="image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <input className={s.input} style={{ width: 80 }} placeholder="sort" value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })} inputMode="numeric" />
          <button className={s.btn} type="submit" disabled={create.isPending}>Add category</button>
        </div>
      </form>

      {isLoading && <p className={s.muted}>Loading…</p>}
      {error && <p className={s.error}>{(error as Error).message}</p>}
      {data && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Name</th><th>Slug</th><th>Parent</th><th>Sort</th><th></th></tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <CategoryRow key={c.id} cat={c} all={data} onChanged={invalidate} onDelete={() => del.mutate(c.id)} onError={setMsg} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function CategoryRow({
  cat,
  all,
  onChanged,
  onDelete,
  onError,
}: {
  cat: AdminCategory;
  all: AdminCategory[];
  onChanged: () => void;
  onDelete: () => void;
  onError: (m: string) => void;
}) {
  const [name, setName] = useState(cat.name);
  const [slug, setSlug] = useState(cat.slug);
  const [sort, setSort] = useState(String(cat.sort));

  const patch = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateCategory(cat.id, data),
    onSuccess: onChanged,
    onError: (e) => onError((e as Error).message),
  });

  return (
    <tr>
      <td><input className={s.input} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== cat.name && patch.mutate({ name })} /></td>
      <td><input className={s.input} value={slug} onChange={(e) => setSlug(e.target.value)} onBlur={() => slug !== cat.slug && patch.mutate({ slug })} /></td>
      <td>
        <select
          className={s.select}
          value={cat.parent_id ?? ""}
          onChange={(e) => patch.mutate({ parent_id: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">—</option>
          {all.filter((c) => c.id !== cat.id).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </td>
      <td>
        <input
          className={s.cellInput}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          onBlur={() => Number(sort) !== cat.sort && patch.mutate({ sort: Number(sort) || 0 })}
          inputMode="numeric"
        />
      </td>
      <td>
        <button className={`${s.btn} ${s.btnDanger}`} onClick={() => { if (confirm(`Delete category "${cat.name}"?`)) onDelete(); }}>
          Del
        </button>
      </td>
    </tr>
  );
}
