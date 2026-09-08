import type { MouseEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { IconArrowRight } from "../../components/Icon/Icon";
import { Shop } from "./Shop";
import styles from "./SegmentPage.module.css";

type Tile = { label: string; value: string };
type Segment = {
  slug: string;
  title: string;
  kicker: string;
  intro: string;
  metaWord: string;
  facet: "brand" | "seal_type";
  tilesLabel: string;
  tiles: Tile[];
};

const brand = (name: string): Tile => ({
  label: name,
  value: name.toLowerCase().replace(/\s+/g, "-"),
});

const SEGMENTS: Record<string, Segment> = {
  replacement: {
    slug: "replacement",
    title: "Replacement",
    kicker: "Catalog · Replacement",
    intro:
      "Seal-brand originals, matched to the specifications of the leading seal manufacturers. Fast delivery, shipping within 72 hours.",
    metaWord: "seal brands",
    facet: "brand",
    tilesLabel: "Shop by seal brand",
    tiles: ["Goetze", "Trelleborg", "Nuova Sjat", "GNL", "SKF", "Eagle Burgmann"].map(brand),
  },
  aftermarket: {
    slug: "aftermarket",
    title: "Aftermarket",
    kicker: "Catalog · Aftermarket",
    intro:
      "Mechanical face seals that fit the leading OEM machines. A direct aftermarket alternative for construction, mining, agriculture and earthmoving equipment. Fast delivery, shipping within 72 hours.",
    metaWord: "OEM fitments",
    facet: "brand",
    tilesLabel: "Shop by OEM machine",
    tiles: [
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
    ].map(brand),
  },
  "duo-cone": {
    slug: "duo-cone",
    title: "Duo Cone",
    kicker: "Catalog · Duo Cone",
    intro:
      "Our Duo Cone mechanical face seals by outer-diameter type: DF and DO, plus universal fitments. Made from wear- and corrosion-resistant materials. Fast delivery, shipping within 72 hours.",
    metaWord: "seal types",
    facet: "seal_type",
    tilesLabel: "Shop by seal type",
    tiles: [
      { label: "DF Type", value: "DF" },
      { label: "DO Type", value: "DO" },
      { label: "Universal", value: "other" },
    ],
  },
};

function TileCard({
  label,
  to,
  active,
  featured,
}: {
  label: string;
  to: string;
  active: boolean;
  featured?: boolean;
}) {
  function onMove(e: MouseEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }
  const abbr = label.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();

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
        <span className={styles.brandName}>{label}</span>
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

  if (!seg) return <Shop categorySlug={slug} />;

  const activeValue = params.get(seg.facet) ?? undefined;

  return (
    <div className={styles.wrap}>
      <Helmet>
        <title>{seg.title} Seals | DuoCone Mechanical Face Seals</title>
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
              {seg.tiles.length} {seg.metaWord}
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

      <section className={styles.brands} aria-label={seg.tilesLabel}>
        <div className={styles.brandsHead}>
          <h2>{seg.tilesLabel}</h2>
          <Link to={`/category/${seg.slug}`} className={styles.allLink}>
            View all {seg.title.toLowerCase()} <IconArrowRight size={15} />
          </Link>
        </div>
        <div className={styles.brandGrid}>
          {seg.tiles.map((t, i) => (
            <TileCard
              key={t.value}
              label={t.label}
              featured={i === 0}
              active={activeValue === t.value}
              to={`/category/${seg.slug}?${seg.facet}=${t.value}#products`}
            />
          ))}
        </div>
      </section>

      <Shop categorySlug={seg.slug} embedded />
    </div>
  );
}
