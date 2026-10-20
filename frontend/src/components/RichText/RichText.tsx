import styles from "./RichText.module.css";

/** Admin-written page text (already sanitized by the API) under a listing. */
export function RichText({ html }: { html: string | null | undefined }) {
  if (!html) return null;
  return <section className={styles.text} dangerouslySetInnerHTML={{ __html: html }} />;
}
