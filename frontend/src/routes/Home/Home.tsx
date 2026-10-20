import { Link } from "react-router-dom";
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
import styles from "./Home.module.css";

// bump when the home page copy changes; shown on the page and in the WebPage schema
const CONTENT_UPDATED = "2026-10-20";

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}/#webpage`,
  url: `${SITE_URL}/`,
  name: "Mechanical Face Seals, DF & DO Type",
  inLanguage: "en",
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#organization` },
  dateModified: CONTENT_UPDATED,
};

export function Home() {
  const { data } = useQuery(featuredQuery());

  return (
    <>
      <Seo
        title={"Mechanical Face Seals, DF & DO Type | Duo Cone Germany"}
        description={"German-made DF and DO mechanical face seals for mining, construction and farm machinery. Quotes and dispatch within 24 hours."}
        jsonLd={[webPageJsonLd]}
      />

      <SealTypes />

      <Hero />

      <HeroSlider />

      <StatBadges />

      <AboutBlock />

      <Reveal as="section" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Shop by segment</h2>
        </div>
        <div className={styles.segmentGrid}>
          <Link to="/product-category/replacement/" className={styles.segmentCard}>
            <h3>Replacement</h3>
            <p>Seal-brand originals: Goetze, Trelleborg, SKF, Eagle Burgmann and more.</p>
          </Link>
          <Link to="/product-category/aftermarket/" className={styles.segmentCard}>
            <h3>Aftermarket</h3>
            <p>Fits Caterpillar, Komatsu, Liebherr, John Deere and other OEM machines.</p>
          </Link>
        </div>
      </Reveal>

      {data && data.items.length > 0 && (
        <Reveal as="section" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Latest products</h2>
            <Link to="/shop/">View all <IconArrowRight size={15} /></Link>
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
          <h2>Mechanical face seals, explained</h2>
        </div>
        <p className={styles.guideLead}>
          A mechanical face seal keeps oil in and dirt out where a shaft turns slowly under heavy load.
          Typical places are track rollers, idlers, final drives, axles or gearboxes. Inside are two
          matched rings of hardened steel. Their lapped surfaces press together, running on a thin film
          of oil. Rubber rings hold the steel parts in place to keep contact pressure even.
        </p>
        <div className={styles.guideGrid}>
          <div>
            <h3>DO type</h3>
            <p>
              Each steel ring sits on a round toric O-ring. It is the most common design on crawler
              machines, axles or final drives, built for high pressure on harsh ground.
            </p>
          </div>
          <div>
            <h3>DF type</h3>
            <p>
              A single rubber loading ring holds each steel ring. You see it on older tractors or
              loaders. Its press-in fit makes field repairs quick.
            </p>
          </div>
          <div>
            <h3>How to order</h3>
            <p>
              Send us the OEM part number or the size you need. We match it, quote within 24 hours,
              then ship from our German stock.
            </p>
          </div>
        </div>
        <p className={styles.updated}>
          Last updated <time dateTime={CONTENT_UPDATED}>20 October 2026</time>
        </p>
      </Reveal>
    </>
  );
}
