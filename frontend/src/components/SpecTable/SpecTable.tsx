import styles from "./SpecTable.module.css";

export function SpecTable({ rows }: { rows: [string, string | number | null | undefined][] }) {
  const visible = rows.filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (visible.length === 0) return null;
  return (
    <table className={styles.table}>
      <tbody>
        {visible.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
