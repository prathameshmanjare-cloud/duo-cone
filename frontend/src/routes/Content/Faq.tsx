import { Seo } from "../../components/Seo/Seo";
import { pageTitle, type FaqItem } from "../../lib/seo";
import { FaqSection } from "../../components/FaqSection/FaqSection";
import { useLang } from "../../lib/i18n";
import { DE_SEO } from "../../content/de";
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

const FAQS_DE: { category: string; items: FaqItem[] }[] = [
  {
    category: "Bestellung",
    items: [
      { q: "Wie bestelle ich?", a: "Legen Sie Produkte in den Warenkorb und bestellen Sie direkt, oder senden Sie eine Angebotsanfrage für Mengenpreise." },
      { q: "Kann ich nach OEM-Teilenummer bestellen?", a: "Ja. Suchen Sie im Shop nach Ihrer OEM-Referenznummer." },
    ],
  },
  {
    category: "Versand",
    items: [{ q: "Wie schnell liefern Sie?", a: "Bestellungen werden innerhalb von 24 Stunden aus unserem Lager in Deutschland versendet." }],
  },
  {
    category: "Rückgabe",
    items: [{ q: "Wie ist Ihre Rückgaberegelung?", a: "Unbenutzte Dichtungen in Originalverpackung können innerhalb von 14 Tagen zurückgegeben werden." }],
  },
];

export function Faq() {
  const de = useLang() === "de";
  return (
    <div className={styles.page}>
      <Seo
        title={de ? DE_SEO.faq.title : pageTitle("FAQ – Mechanical Face Seals (Floating Seals)")}
        description={
          de
            ? DE_SEO.faq.description
            : "Answers about DF and DO type mechanical face seals (floating seals): ordering, cross-references by OEM part number, delivery from Germany, warranty and returns."
        }
      />
      <h1>{de ? DE_SEO.faq.h1 : "Frequently Asked Questions"}</h1>
      <FaqSection groups={(de ? FAQS_DE : FAQS).map((cat) => ({ title: cat.category, items: cat.items }))} />
    </div>
  );
}
