import { clean } from "../../lib/seo";
import { useT } from "../../lib/i18n";
import styles from "./CrossRefTable.module.css";

type Row = { brand: string; part: string; models?: string | null };

/** OEM part-number cross-reference: the product's own OEM number first, then
 *  the equivalents entered in the admin. Plain text, so search engines read
 *  every brand, part number and machine model. */
export function CrossRefTable({
  brand,
  sku,
  refs,
}: {
  brand?: string | null;
  sku: string;
  refs: { ref_number: string; ref_brand?: string | null; machine_models?: string | null }[];
}) {
  const t = useT();
  const rows: Row[] = [
    { brand: brand ?? "", part: clean(sku) },
    ...refs.map((r) => ({ brand: r.ref_brand ?? "", part: clean(r.ref_number), models: r.machine_models })),
  ];
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{t({ en: "OEM brand", de: "OEM-Marke" })}</th>
            <th scope="col">{t({ en: "Part number", de: "Teilenummer" })}</th>
            <th scope="col">{t({ en: "Machine models", de: "Maschinenmodelle" })}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.brand || "—"}</td>
              <td className={styles.part}>{r.part}</td>
              <td>{r.models ? clean(r.models) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
