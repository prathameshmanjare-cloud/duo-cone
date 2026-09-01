import { Link } from "react-router-dom";
import styles from "./Breadcrumbs.module.css";

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <ol>
        {items.map((item, i) => (
          <li key={i}>
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            {i < items.length - 1 && <span className={styles.sep}>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
