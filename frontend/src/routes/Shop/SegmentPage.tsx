import type { MouseEvent } from "react";
import { useParams } from "react-router-dom";
import { Link, useLang, useT } from "../../lib/i18n";
import { IconArrowRight } from "../../components/Icon/Icon";
import { Shop } from "./Shop";
import { AFTERMARKET_BRANDS, REPLACEMENT_BRANDS, brandPath, segmentPath } from "../../lib/catalog";
import replacementAnimation from "../../assets/replacement/replacement-animation.mp4";
import { Seo } from "../../components/Seo/Seo";
import { Breadcrumbs } from "../../components/Breadcrumbs/Breadcrumbs";
import { localTitle } from "../../lib/seo";
import { DE_SEO } from "../../content/de";
import { useQuery } from "@tanstack/react-query";
import { RichText } from "../../components/RichText/RichText";
import { categoryQuery } from "../../lib/queries";
import styles from "./SegmentPage.module.css";

type Tile = { label: string; value: string };
type L = { en: string; de: string };
type Segment = {
  slug: "replacement" | "aftermarket";
  title: string;
  kicker: L;
  heading: L;
  intro: L;
  metaWord: L;
  tilesLabel: L;
  tiles: Tile[];
  shipHours: number;
};

const SEGMENTS: Record<string, Segment> = {
  replacement: {
    slug: "replacement",
    title: "Replacement",
    kicker: { en: "Catalog · Replacement", de: "Katalog · Replacement" },
    heading: { en: "Replacement mechanical face seals", de: DE_SEO.replacement.h1 },
    intro: {
      en: "Seal-brand originals, matched to the specifications of the leading seal manufacturers. Fast delivery, shipping within 24 hours.",
      de: "Originale der Dichtungsmarken, abgestimmt auf die Spezifikationen der führenden Dichtungshersteller. Schnelle Lieferung, Versand innerhalb von 24 Stunden.",
    },
    metaWord: { en: "seal brands", de: "Dichtungsmarken" },
    tilesLabel: { en: "Shop by seal brand", de: "Nach Dichtungsmarke einkaufen" },
    tiles: REPLACEMENT_BRANDS,
    shipHours: 24,
  },
  aftermarket: {
    slug: "aftermarket",
    title: "Aftermarket",
    kicker: { en: "Catalog · Aftermarket", de: "Katalog · Aftermarket" },
    heading: { en: "Aftermarket mechanical face seals", de: DE_SEO.aftermarket.h1 },
    intro: {
      en: "Mechanical face seals that fit the leading OEM machines. A direct aftermarket alternative for construction, mining, agriculture and earthmoving equipment. Fast delivery, shipping within 24 hours.",
      de: "Laufwerksdichtungen passend für die führenden OEM-Maschinen. Eine direkte Aftermarket-Alternative für Bau-, Bergbau-, Land- und Erdbewegungsmaschinen. Schnelle Lieferung, Versand innerhalb von 24 Stunden.",
    },
    metaWord: { en: "OEM fitments", de: "OEM-Marken" },
    tilesLabel: { en: "Shop by OEM machine", de: "Nach OEM-Maschine einkaufen" },
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
  const t = useT();
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
        {featured && <span className={styles.brandSub}>{t({ en: "Browse the full range", de: "Gesamtes Sortiment ansehen" })}</span>}
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
  const { data: category } = useQuery({ ...categoryQuery(slug), retry: false });
  const t = useT();
  const lang = useLang();

  if (!seg) return <Shop categorySlug={slug} />;

  return (
    <div className={styles.wrap}>
      <Seo
        title={localTitle(lang, `${seg.title} Mechanical Face Seals`, DE_SEO[seg.slug].title, page)}
        description={lang === "de" ? DE_SEO[seg.slug].description : seg.intro.en}
      />
      <Breadcrumbs items={[{ label: "Shop", to: "/shop/" }, { label: seg.title }]} />

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>{t(seg.kicker)}</span>
          <h1>{t(seg.heading)}</h1>
          <p>{t(seg.intro)}</p>
          <div className={styles.heroMeta}>
            <span className={styles.badge}>
              <span className={styles.dot} />{" "}
              {t({ en: `Ships within ${seg.shipHours} hours`, de: `Versand innerhalb von ${seg.shipHours} Stunden` })}
            </span>
            <span className={styles.metaLine}>
              {seg.tiles.length} {t(seg.metaWord)}
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

      <section className={styles.brands} aria-label={t(seg.tilesLabel)}>
        <div className={styles.brandsHead}>
          <h2>{t(seg.tilesLabel)}</h2>
          <Link to={segmentPath(seg.slug)} className={styles.allLink}>
            {t({ en: `View all ${seg.title.toLowerCase()}`, de: `Alle ${seg.title}-Dichtungen` })} <IconArrowRight size={15} />
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
      {/* first page only, so pages 2, 3 ... don't repeat it */}
      {!(Number(page) > 1) && <RichText html={category?.description} />}
    </div>
  );
}
