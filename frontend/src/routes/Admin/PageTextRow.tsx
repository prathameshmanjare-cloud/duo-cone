import { useState } from "react";
import s from "./Admin.module.css";

/** Full-width table row under a brand / category row for the text shown on
 *  its storefront page, below the products. Plain paragraphs (blank line
 *  between them) or simple HTML; the API strips anything unsafe. */
export function PageTextRow({
  colSpan,
  label,
  value,
  saving,
  onSave,
  onClose,
}: {
  colSpan: number;
  label: string;
  value: string | null;
  saving: boolean;
  onSave: (text: string | null) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value ?? "");
  const id = `page-text-${label.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <tr>
      <td colSpan={colSpan}>
        <div className={s.field}>
          <label htmlFor={id}>Page text for {label}</label>
          <textarea
            id={id}
            className={s.textarea}
            style={{ minHeight: 160 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Shown on the storefront page below the products. Separate paragraphs with a blank line; <strong>, <a href>, lists and <h2>/<h3> are allowed."
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button type="button" className={s.btn} disabled={saving} onClick={() => onSave(text.trim() || null)}>
            {saving ? "Saving…" : "Save text"}
          </button>
          <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={onClose}>
            Close
          </button>
        </div>
      </td>
    </tr>
  );
}
