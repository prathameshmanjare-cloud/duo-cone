import { Seo } from "../../components/Seo/Seo";
import { pageTitle, type FaqItem } from "../../lib/seo";
import { FaqSection } from "../../components/FaqSection/FaqSection";
import styles from "./Content.module.css";

const FAQS: { category: string; items: FaqItem[] }[] = [
  {
    category: "Orders",
    items: [
      { q: "How do I place an order?", a: "Add products to your cart and check out directly, or submit an RFQ for volume pricing." },
      { q: "Can I order by OEM part number?", a: "Yes. Search by your OEM reference number in the shop." },
    ],
  },
  {
    category: "Shipping",
    items: [
      { q: "How fast do you ship?", a: "Orders ship within 24 hours from our German warehouse." },
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
      <Seo title={pageTitle("FAQ – Mechanical Face Seals (Floating Seals)")} description={"Answers about DF and DO type mechanical face seals (floating seals): ordering, cross-references by OEM part number, delivery from Germany, warranty and returns."} />
      <h1>Frequently Asked Questions</h1>
      <FaqSection groups={FAQS.map((cat) => ({ title: cat.category, items: cat.items }))} />
    </div>
  );
}
