import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminCategory } from "../../lib/adminApi";
import { ExportButtons } from "./ExportButtons";
import { ConfirmModal } from "./ConfirmModal";
import { PageTextRow } from "./PageTextRow";
import { DeleteButton, EmptyRow, Icon, PageHeader, TableSkeleton } from "./ui";
import s from "./Admin.module.css";

const BLANK = { slug: "", name: "", image_url: "", description: "", sort: "0" };

export function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminApi.listCategories,
  });
  const [form, setForm] = useState<Record<string, string>>(BLANK);
  const [msg, setMsg] = useState<{ kind: "ok" | "danger"; text: string } | null>(null);
  const fail = (text: string) => setMsg({ kind: "danger", text });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "categories"] });

  const create = useMutation({
    mutationFn: () => adminApi.createCategory({ ...form, sort: Number(form.sort) || 0 }),
    onSuccess: () => {
      setForm(BLANK);
      setMsg({ kind: "ok", text: "Category created" });
      invalidate();
    },
    onError: (e) => fail((e as Error).message),
  });
  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteCategory(id),
    onSuccess: invalidate,
    onError: (e) => fail((e as Error).message),
  });

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Edits to a row save as soon as you leave the field."
        actions={<ExportButtons resource="categories" />}
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
        <h2 className={s.cardTitle}>Add a category</h2>
        <p className={s.cardSub}>Lower sort numbers appear first on the storefront.</p>
        <div className={s.inlineForm}>
          <div className={s.field}>
            <label htmlFor="cat-name">Name</label>
            <input id="cat-name" className={s.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className={s.field}>
            <label htmlFor="cat-slug">Slug</label>
            <input id="cat-slug" className={s.input} placeholder="e.g. floating-seals" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </div>
          <div className={s.field}>
            <label htmlFor="cat-image">Image URL</label>
            <input id="cat-image" className={s.input} placeholder="Optional" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <div className={s.field}>
            <label htmlFor="cat-sort">Sort</label>
            <input id="cat-sort" className={s.input} value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })} inputMode="numeric" />
          </div>
          <button className={s.btn} type="submit" disabled={create.isPending}>
            <Icon name="plus" /> {create.isPending ? "Adding…" : "Add category"}
          </button>
        </div>
      </form>

      {isLoading && <TableSkeleton cols={5} />}
      {error && <p className={s.error}>{(error as Error).message}</p>}
      {data && (
        <div className={s.tableWrap}>
          <table className={`${s.table} ${s.tableStack}`}>
            <thead>
              <tr><th>Name</th><th>Slug</th><th>Parent</th><th>Sort</th><th></th></tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <CategoryRow key={c.id} cat={c} all={data} onChanged={invalidate} onDelete={() => del.mutate(c.id)} onError={fail} />
              ))}
              {data.length === 0 && <EmptyRow colSpan={5} title="No categories yet" hint="Add your first category above." />}
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
  const [confirming, setConfirming] = useState(false);
  const [editingText, setEditingText] = useState(false);

  const patch = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateCategory(cat.id, data),
    onSuccess: onChanged,
    onError: (e) => onError((e as Error).message),
  });

  return (
    <>
    <tr>
      <td data-label="Name"><input className={s.input} aria-label="Category name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== cat.name && patch.mutate({ name })} /></td>
      <td data-label="Slug"><input className={`${s.input} ${s.mono}`} aria-label="Category slug" value={slug} onChange={(e) => setSlug(e.target.value)} onBlur={() => slug !== cat.slug && patch.mutate({ slug })} /></td>
      <td data-label="Parent">
        <select
          className={s.select}
          aria-label="Parent category"
          value={cat.parent_id ?? ""}
          onChange={(e) => patch.mutate({ parent_id: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">None</option>
          {all.filter((c) => c.id !== cat.id).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </td>
      <td data-label="Sort">
        <input
          className={s.cellInput}
          style={{ width: 68 }}
          aria-label="Sort order"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          onBlur={() => Number(sort) !== cat.sort && patch.mutate({ sort: Number(sort) || 0 })}
          inputMode="numeric"
        />
      </td>
      <td className={s.cellActions}>
        <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => setEditingText((v) => !v)} aria-expanded={editingText}>
          Page text{cat.description ? " ✓" : ""}
        </button>
        <DeleteButton label={`Delete ${cat.name}`} onClick={() => setConfirming(true)} />
        {confirming && (
          <ConfirmModal
            title="Delete category"
            message={`Delete category "${cat.name}"? This cannot be undone.`}
            onConfirm={() => { setConfirming(false); onDelete(); }}
            onClose={() => setConfirming(false)}
          />
        )}
      </td>
    </tr>
    {editingText && (
      <PageTextRow
        colSpan={5}
        label={cat.name}
        value={cat.description}
        saving={patch.isPending}
        onSave={(description) => patch.mutate({ description }, { onSuccess: () => setEditingText(false) })}
        onClose={() => setEditingText(false)}
      />
    )}
    </>
  );
}
