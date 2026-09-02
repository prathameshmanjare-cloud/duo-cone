import type { MouseEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { IconArrowRight } from "../../components/Icon/Icon";
import { Shop } from "./Shop";
import styles from "./SegmentPage.module.css";

type Segment = {
  slug: string;
  title: string;
  kicker: string;
  intro: string;
  brandsLabel: string;
  brands: string[];
};

const SEGMENTS: Record<string, Segment> = {
  replacement: {
    slug: "replacement",
    title: "Replacement",
    kicker: "Catalog · Replacement",
    intro:
      "Seal-brand originals — mechanical face seals matched to the specifications of the leading seal manufacturers. Fast delivery, shipping within 72 hours.",
    brandsLabel: "Shop by seal brand",
    brands: ["Goetze", "Trelleborg", "Nuova Sjat", "GNL", "SKF", "Eagle Burgmann"],
  },
  aftermarket: {
    slug: "aftermarket",
    title: "Aftermarket",
    kicker: "Catalog · Aftermarket",
    intro:
      "Mechanical face seals that fit the leading OEM machines — a direct aftermarket alternative for construction, mining, agriculture and earthmoving equipment. Fast delivery, shipping within 72 hours.",
    brandsLabel: "Shop by OEM machine",
    brands: [
      "Caterpillar",
      "CNHI",
      "Hitachi",
      "Fiat Hitachi",
      "John Deere",
      "Komatsu",
      "Liebherr",
      "FIAT Allis",
      "Poclain",
      "Busak Luyken",
      "Massey Ferguson",
      "Laltesi",
      "Lamborghini",
      "International",
      "Hanomag",
      "Hydromac",
      "Benati",
    ],
  },
};

function BrandTile({
  name,
  to,
  active,
  featured,
}: {
  name: string;
  to: string;
  active: boolean;
  featured?: boolean;
}) {
  function onMove(e: MouseEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }
  const abbr = name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();

  return (
    <Link
      to={to}
      onMouseMove={onMove}
      className={`${styles.brand} ${active ? styles.brandOn : ""} ${featured ? styles.brandFeatured : ""}`}
    >
      <span className={styles.ghost} aria-hidden="true">
        {abbr}
      </span>
      <span className={styles.mono} aria-hidden="true">
        {abbr}
      </span>
      <span className={styles.brandBody}>
        <span className={styles.brandName}>{name}</span>
        {featured && <span className={styles.brandSub}>Browse the full range</span>}
      </span>
      <span className={styles.brandArrow} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}

export function SegmentPage({ slug }: { slug: string }) {
  const seg = SEGMENTS[slug];
  const [params] = useSearchParams();
  const activeBrand = params.get("brand") ?? undefined;

  if (!seg) return <Shop categorySlug={slug} />;

  return (
    <div className={styles.wrap}>
      <Helmet>
        <title>{seg.title} Seals — DuoCon Mechanical Face Seals</title>
        <meta name="description" content={seg.intro} />
      </Helmet>

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>{seg.kicker}</span>
          <h1>{seg.title} mechanical face seals</h1>
          <p>{seg.intro}</p>
          <div className={styles.heroMeta}>
            <span className={styles.badge}>
              <span className={styles.dot} /> Ships within 72 hours
            </span>
            <span className={styles.metaLine}>
              {seg.brands.length} {seg.slug === "replacement" ? "seal brands" : "OEM fitments"}
            </span>
          </div>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <span className={styles.artGrid} />
          <span className={styles.artRing} />
          <span className={styles.artRing2} />
          <span className={styles.artTag}>DF · DO · UNIVERSAL</span>
        </div>
      </header>

      <section className={styles.brands} aria-label={seg.brandsLabel}>
        <div className={styles.brandsHead}>
          <h2>{seg.brandsLabel}</h2>
          <Link to={`/category/${seg.slug}`} className={styles.allLink}>
            View all {seg.title.toLowerCase()} <IconArrowRight size={15} />
          </Link>
        </div>
        <div className={styles.brandGrid}>
          {seg.brands.map((b, i) => (
            <BrandTile
              key={b}
              name={b}
              featured={i === 0}
              active={activeBrand?.toLowerCase() === b.toLowerCase()}
              to={`/category/${seg.slug}?brand=${encodeURIComponent(b)}#products`}
            />
          ))}
        </div>
      </section>

      <Shop categorySlug={seg.slug} embedded />
    </div>
  );
}
