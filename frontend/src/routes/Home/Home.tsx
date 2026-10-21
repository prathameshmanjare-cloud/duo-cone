import { Link, useLang, useT } from "../../lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { featuredQuery } from "../../lib/queries";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { Hero } from "../../components/Hero/Hero";
import { HeroSlider } from "../../components/HeroSlider/HeroSlider";
import { StatBadges } from "../../components/StatBadges/StatBadges";
import { SealTypes } from "../../components/SealTypes/SealTypes";
import { Industries } from "../../components/Industries/Industries";
import { AboutBlock } from "../../components/AboutBlock/AboutBlock";
import { Reveal } from "../../components/Reveal/Reveal";
import { IconArrowRight } from "../../components/Icon/Icon";
import { Seo } from "../../components/Seo/Seo";
import { SITE_URL } from "../../lib/seo";
import { DE_SEO } from "../../content/de";
import styles from "./Home.module.css";

// bump when the home page copy changes; shown on the page and in the WebPage schema
const CONTENT_UPDATED = "2026-10-20";

const webPageJsonLd = (lang: "en" | "de") => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}${lang === "de" ? "/de/" : "/"}#webpage`,
  url: `${SITE_URL}${lang === "de" ? "/de/" : "/"}`,
  name: lang === "de" ? DE_SEO.home.h1 : "Mechanical Face Seals, DF & DO Type",
  inLanguage: lang,
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#organization` },
  dateModified: CONTENT_UPDATED,
});

export function Home() {
  const { data } = useQuery(featuredQuery());
  const t = useT();
  const lang = useLang();

  return (
    <>
      <Seo
        title={t({ en: "Mechanical Face Seals, DF & DO Type | Duo Cone Germany", de: DE_SEO.home.title })}
        description={t({
          en: "DF and DO mechanical face seals for mining, construction and farm machinery, stocked and shipped from Germany. Quotes and dispatch within 24 hours.",
          de: DE_SEO.home.description,
        })}
        jsonLd={[webPageJsonLd(lang)]}
      />

      <SealTypes />

      <Hero />

      <HeroSlider />

      <StatBadges />

      <AboutBlock />

      <Reveal as="section" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>{t({ en: "Shop by segment", de: "Nach Segment einkaufen" })}</h2>
        </div>
        <div className={styles.segmentGrid}>
          <Link to="/product-category/replacement/" className={styles.segmentCard}>
            <h3>Replacement</h3>
            <p>{t({ en: "Seal-brand originals: Goetze, Trelleborg, SKF, Eagle Burgmann and more.", de: "Originale der Dichtungsmarken: Goetze, Trelleborg, SKF, Eagle Burgmann und weitere." })}</p>
          </Link>
          <Link to="/product-category/aftermarket/" className={styles.segmentCard}>
            <h3>Aftermarket</h3>
            <p>{t({ en: "Fits Caterpillar, Komatsu, Liebherr, John Deere and other OEM machines.", de: "Passend für Caterpillar, Komatsu, Liebherr, John Deere und weitere OEM-Maschinen." })}</p>
          </Link>
        </div>
      </Reveal>

      {data && data.items.length > 0 && (
        <Reveal as="section" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{t({ en: "Latest products", de: "Neueste Produkte" })}</h2>
            <Link to="/shop/">{t({ en: "View all", de: "Alle ansehen" })} <IconArrowRight size={15} /></Link>
          </div>
          <div className={styles.grid}>
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Reveal>
      )}

      <Industries />

      {/* plain-language explainer: the page's main readable text for search engines and AI answers */}
      <Reveal as="section" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>{t({ en: "Mechanical face seals, explained", de: "Laufwerksdichtungen einfach erklärt" })}</h2>
        </div>
        <p className={styles.guideLead}>
          {t({
            en: "A mechanical face seal keeps oil in and dirt out where a shaft turns slowly under heavy load. Typical places are track rollers, idlers, final drives, axles or gearboxes. Inside are two matched rings of hardened steel. Their lapped surfaces press together, running on a thin film of oil. Rubber rings hold the steel parts in place to keep contact pressure even.",
            de: "Eine Laufwerksdichtung (Gleitringdichtung, Duo-Cone-Dichtung) hält das Öl drin und den Schmutz draußen – dort, wo sich eine Welle langsam unter hoher Last dreht. Typische Einbauorte sind Laufrollen, Leiträder, Endantriebe, Achsen und Getriebe. Im Inneren arbeiten zwei aufeinander abgestimmte Ringe aus gehärtetem Stahl. Ihre geläppten Flächen werden aneinandergepresst und laufen auf einem dünnen Ölfilm. Gummiringe halten die Stahlteile in Position und sorgen für gleichmäßigen Anpressdruck.",
          })}
        </p>
        <div className={styles.guideGrid}>
          <div>
            <h3>{t({ en: "DO type", de: "Typ DO" })}</h3>
            <p>
              {t({
                en: "Each steel ring sits on a round toric O-ring. It is the most common design on crawler machines, axles or final drives, built for high pressure on harsh ground.",
                de: "Jeder Stahlring sitzt auf einem runden, torischen O-Ring. Die häufigste Bauform an Kettenfahrzeugen, Achsen und Endantrieben – gebaut für hohen Druck auf rauem Untergrund.",
              })}
            </p>
          </div>
          <div>
            <h3>{t({ en: "DF type", de: "Typ DF" })}</h3>
            <p>
              {t({
                en: "A single rubber loading ring holds each steel ring. You see it on older tractors or loaders. Its press-in fit makes field repairs quick.",
                de: "Ein einzelner Gummi-Anpressring hält jeden Stahlring. Zu finden an älteren Traktoren und Ladern. Der Einpresssitz macht Reparaturen im Feld schnell.",
              })}
            </p>
          </div>
          <div>
            <h3>{t({ en: "How to order", de: "So bestellen Sie" })}</h3>
            <p>
              {t({
                en: "Send us the OEM part number or the size you need. We match it, quote within 24 hours, then ship from our German stock.",
                de: "Senden Sie uns die OEM-Teilenummer oder die benötigte Größe. Wir ordnen sie zu, erstellen innerhalb von 24 Stunden ein Angebot und versenden ab Lager in Deutschland.",
              })}
            </p>
          </div>
        </div>
        <p className={styles.updated}>
          {t({ en: "Last updated", de: "Zuletzt aktualisiert" })}{" "}
          <time dateTime={CONTENT_UPDATED}>{t({ en: "20 October 2026", de: "20. Oktober 2026" })}</time>
        </p>
      </Reveal>
    </>
  );
}
