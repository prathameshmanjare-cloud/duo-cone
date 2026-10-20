import { formatPrice } from "../../lib/format";
import { useLang } from "../../lib/i18n";
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
  const lang = useLang();
  const hasSale = salePriceCents != null && salePriceCents < cents;
  return (
    <span className={styles.wrap}>
      <span className={styles.current}>{formatPrice(hasSale ? salePriceCents! : cents, currency, lang)}</span>
      {hasSale && <span className={styles.was}>{formatPrice(cents, currency, lang)}</span>}
      <span className={styles.note}>{lang === "de" ? "zzgl. MwSt. · zzgl. Versand" : "excl. VAT · plus shipping"}</span>
    </span>
  );
}
