import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { Hero } from "../../components/Hero/Hero";
import { StatBadges } from "../../components/StatBadges/StatBadges";
import { SealTypes } from "../../components/SealTypes/SealTypes";
import { Industries } from "../../components/Industries/Industries";
import { AboutBlock } from "../../components/AboutBlock/AboutBlock";
import { Reveal } from "../../components/Reveal/Reveal";
import { IconArrowRight } from "../../components/Icon/Icon";
import styles from "./Home.module.css";

export function Home() {
  const { data } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => api.listProducts({ page: 1, page_size: 8, sort: "latest" }),
  });

  return (
    <>
      <Helmet>
        <title>DuoCon — Mechanical Face Seals (DF &amp; DO Type) | German Manufacturer</title>
        <meta
          name="description"
          content="DuoCon manufactures high-pressure mechanical face seals (Duo Cone DF & DO type) for mining, construction, agriculture and defense equipment. RFQ within 24h, shipping within 72h."
        />
      </Helmet>

      <Hero />

      <StatBadges />

      <AboutBlock />

      <SealTypes />

      <Reveal as="section" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Shop by segment</h2>
        </div>
        <div className={styles.segmentGrid}>
          <Link to="/category/replacement" className={styles.segmentCard}>
            <h3>Replacement</h3>
            <p>Seal-brand originals: Goetze, Trelleborg, SKF, Eagle Burgmann and more.</p>
          </Link>
          <Link to="/category/aftermarket" className={styles.segmentCard}>
            <h3>Aftermarket</h3>
            <p>Fits Caterpillar, Komatsu, Liebherr, John Deere and other OEM machines.</p>
          </Link>
          <Link to="/cross-reference" className={styles.segmentCard}>
            <h3>Cross-Reference Tool</h3>
            <p>Enter your OEM part number to find the exact matching seal instantly.</p>
          </Link>
        </div>
      </Reveal>

      {data && data.items.length > 0 && (
        <Reveal as="section" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Latest products</h2>
            <Link to="/shop">View all <IconArrowRight size={15} /></Link>
          </div>
          <div className={styles.grid}>
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Reveal>
      )}

      <Industries />
    </>
  );
}
