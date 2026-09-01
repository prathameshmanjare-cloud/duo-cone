import { Helmet } from "react-helmet-async";
import styles from "./Content.module.css";

const FAQS: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Orders",
    items: [
      { q: "How do I place an order?", a: "Add products to your cart and check out directly, or submit an RFQ for volume pricing." },
      { q: "Can I order by OEM part number?", a: "Yes — use the cross-reference tool or search by your OEM reference number." },
    ],
  },
  {
    category: "Shipping",
    items: [
      { q: "How fast do you ship?", a: "Orders ship within 72 hours from our German warehouse." },
    ],
  },
  {
    category: "Returns",
    items: [
      { q: "What is your return policy?", a: "Unused seals in original packaging can be returned within 14 days." },
    ],
  },
];

export function Faq() {
  return (
    <div className={styles.page}>
      <Helmet><title>FAQ | DuoCon</title></Helmet>
      <h1>Frequently Asked Questions</h1>
      {FAQS.map((cat) => (
        <section key={cat.category} className={styles.section}>
          <h2>{cat.category}</h2>
          {cat.items.map((item) => (
            <details key={item.q} style={{ marginBottom: 8 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}
