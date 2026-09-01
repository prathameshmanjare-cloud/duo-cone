import { formatPrice } from "../../lib/format";
import styles from "./Price.module.css";

export function Price({
  cents,
  salePriceCents,
  currency = "EUR",
}: {
  cents: number;
  salePriceCents?: number | null;
  currency?: string;
}) {
  const hasSale = salePriceCents != null && salePriceCents < cents;
  return (
    <span className={styles.wrap}>
      <span className={styles.current}>{formatPrice(hasSale ? salePriceCents! : cents, currency)}</span>
      {hasSale && <span className={styles.was}>{formatPrice(cents, currency)}</span>}
      <span className={styles.note}>excl. VAT · plus shipping</span>
    </span>
  );
}
