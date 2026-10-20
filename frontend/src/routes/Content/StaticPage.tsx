import { Seo } from "../../components/Seo/Seo";
import { pageTitle } from "../../lib/seo";
import styles from "./Content.module.css";

export function StaticPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro?: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <div className={styles.page}>
      <Seo title={pageTitle(title)} description={intro ?? `${title}: ${sections.map((s) => s.body).join(" ")}`} />
      <h1>{title}</h1>
      {intro && <p className={styles.intro}>{intro}</p>}
      {sections.map((s) => (
        <section key={s.heading} className={styles.section}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </div>
  );
}
