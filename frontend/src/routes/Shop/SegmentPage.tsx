import type { MouseEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { IconArrowRight } from "../../components/Icon/Icon";
import { Shop } from "./Shop";
import { AFTERMARKET_BRANDS, REPLACEMENT_BRANDS, brandPath, segmentPath } from "../../lib/catalog";
import replacementAnimation from "../../assets/replacement/replacement-animation.mp4";
import { Seo } from "../../components/Seo/Seo";
import { Breadcrumbs } from "../../components/Breadcrumbs/Breadcrumbs";
import { pageSuffix, pageTitle } from "../../lib/seo";
import styles from "./SegmentPage.module.css";

type Tile = { label: string; value: string };
type Segment = {
  slug: string;
  title: string;
  kicker: string;
  intro: string;
  metaWord: string;
  tilesLabel: string;
  tiles: Tile[];
  shipHours: number;
};

const SEGMENTS: Record<string, Segment> = {
  replacement: {
    slug: "replacement",
    title: "Replacement",
    kicker: "Catalog · Replacement",
    intro:
      "Seal-brand originals, matched to the specifications of the leading seal manufacturers. Fast delivery, shipping within 24 hours.",
    metaWord: "seal brands",
    tilesLabel: "Shop by seal brand",
    tiles: REPLACEMENT_BRANDS,
    shipHours: 24,
  },
  aftermarket: {
    slug: "aftermarket",
    title: "Aftermarket",
    kicker: "Catalog · Aftermarket",
    intro:
      "Mechanical face seals that fit the leading OEM machines. A direct aftermarket alternative for construction, mining, agriculture and earthmoving equipment. Fast delivery, shipping within 24 hours.",
    metaWord: "OEM fitments",
    tilesLabel: "Shop by OEM machine",
    tiles: AFTERMARKET_BRANDS,
    shipHours: 24,
  },
};

function TileCard({
  label,
  to,
  featured,
}: {
  label: string;
  to: string;
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
      className={`${styles.brand} ${featured ? styles.brandFeatured : ""}`}
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
  const { page } = useParams<{ page?: string }>();

  if (!seg) return <Shop categorySlug={slug} />;

  return (
    <div className={styles.wrap}>
      <Seo title={pageTitle(`${seg.title} Mechanical Face Seals${pageSuffix(page)}`)} description={seg.intro} />
      <Breadcrumbs items={[{ label: "Shop", to: "/shop/" }, { label: seg.title }]} />

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>{seg.kicker}</span>
          <h1>{seg.title} mechanical face seals</h1>
          <p>{seg.intro}</p>
          <div className={styles.heroMeta}>
            <span className={styles.badge}>
              <span className={styles.dot} /> Ships within {seg.shipHours} hours
            </span>
            <span className={styles.metaLine}>
              {seg.tiles.length} {seg.metaWord}
            </span>
          </div>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          {seg.slug === "aftermarket" || seg.slug === "replacement" ? (
            <video
              className={styles.heroArtVideo}
              src={replacementAnimation}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <>
              <span className={styles.artGrid} />
              <span className={styles.artRing} />
              <span className={styles.artRing2} />
            </>
          )}
          <span className={styles.artTag}>DF · DO · UNIVERSAL</span>
        </div>
      </header>

      <section className={styles.brands} aria-label={seg.tilesLabel}>
        <div className={styles.brandsHead}>
          <h2>{seg.tilesLabel}</h2>
          <Link to={segmentPath(seg.slug)} className={styles.allLink}>
            View all {seg.title.toLowerCase()} <IconArrowRight size={15} />
          </Link>
        </div>
        <div className={styles.brandGrid}>
          {seg.tiles.map((t, i) => (
            <TileCard
              key={t.value}
              label={t.label}
              featured={i === 0}
              to={brandPath(t.value, seg.slug)}
            />
          ))}
        </div>
      </section>

      <Shop categorySlug={seg.slug} embedded />
    </div>
  );
}
