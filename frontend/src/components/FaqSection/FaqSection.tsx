import { Helmet } from "react-helmet-async";
import { faqJsonLd, type FaqItem } from "../../lib/seo";
import styles from "./FaqSection.module.css";

export type FaqGroup = { title?: string; items: FaqItem[] };

/** Questions and answers as native <details> (readable without JavaScript)
 *  plus one FAQPage JSON-LD for all of them. Use once per page. */
export function FaqSection({ groups, headingLevel = 2 }: { groups: FaqGroup[]; headingLevel?: 2 | 3 }) {
  const items = groups.flatMap((g) => g.items);
  if (items.length === 0) return null;
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd(items))}</script>
      </Helmet>
      {groups.map((group, gi) => (
        <section key={group.title ?? gi} className={styles.group}>
          {group.title && <Heading>{group.title}</Heading>}
          {group.items.map((item) => (
            <details key={item.q} className={styles.item}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>
      ))}
    </>
  );
}
