import { useParams } from "react-router-dom";
import { Breadcrumbs } from "../../components/Breadcrumbs/Breadcrumbs";
import { AFTERMARKET_BRANDS, REPLACEMENT_BRANDS, segmentPath, type SegmentSlug } from "../../lib/catalog";
import { Shop } from "./Shop";
import { Seo } from "../../components/Seo/Seo";
import { localTitle } from "../../lib/seo";
import { useQuery } from "@tanstack/react-query";
import { RichText } from "../../components/RichText/RichText";
import { brandQuery, brandStatsQueries } from "../../lib/queries";
import { useLang } from "../../lib/i18n";
import { deBrandSeo, deBrandText, type BrandStats } from "../../lib/brandText";
import styles from "./Shop.module.css";

const LABELS = new Map([...REPLACEMENT_BRANDS, ...AFTERMARKET_BRANDS].map((b) => [b.value, b.label]));
const SEGMENT_LABEL: Record<SegmentSlug, string> = { replacement: "Replacement", aftermarket: "Aftermarket" };

const brandLabel = (slug: string) =>
  LABELS.get(slug) ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** /product-category/<segment>/<brand>/ — one brand's seals within a segment,
 *  at the same URL the old shop used for its brand category pages. */
export function BrandPage({ segment, brandSlug }: { segment: SegmentSlug; brandSlug: string }) {
  const name = brandLabel(brandSlug);
  const lang = useLang();
  const { page } = useParams<{ page?: string }>();
  const firstPage = !(Number(page) > 1);
  // English page text is written in the admin; German text is built from
  // live catalog numbers (lib/brandText)
  const { data: brand } = useQuery({ ...brandQuery(brandSlug), retry: false, enabled: lang === "en" });
  const stat = brandStatsQueries(segment, brandSlug);
  const all = useQuery({ ...stat.all, enabled: lang === "de" });
  const df = useQuery({ ...stat.df, enabled: lang === "de" });
  const dO = useQuery({ ...stat.do, enabled: lang === "de" });
  const stats: BrandStats | null =
    all.data && df.data && dO.data
      ? { total: all.data.total, df: df.data.total, do: dO.data.total, samples: all.data.items.map((p) => p.sku) }
      : null;
  const de = stats ? deBrandSeo(name, segment, stats) : null;

  const intro =
    lang === "de"
      ? segment === "replacement"
        ? `${name} Laufwerksdichtungen (Gleitringdichtungen, Duo-Cone-Dichtungen) Typ DF und DO, passend zur ${name}-Teilenummer.`
        : `Aftermarket-Laufwerksdichtungen (Gleitringdichtungen, Duo-Cone-Dichtungen) passend für ${name}-Maschinen, Typ DF und DO. Suchen Sie nach Ihrer ${name}-Teilenummer.`
      : segment === "replacement"
        ? `${name} mechanical face seals (floating seals, duo cone seals) in DF and DO type, matched to the ${name} part number.`
        : `Aftermarket mechanical face seals (floating seals, duo cone seals) for ${name} machines, in DF and DO type. Search by your ${name} part number.`;

  return (
    <div className={styles.page}>
      <Seo
        title={localTitle(lang, `${name} Mechanical Face Seals`, de?.title ?? `Laufwerksdichtungen ${name} | Duo Cone`, page)}
        description={de?.description ?? intro}
      />
      <Breadcrumbs
        items={[
          { label: "Shop", to: "/shop/" },
          { label: SEGMENT_LABEL[segment], to: segmentPath(segment) },
          { label: name },
        ]}
      />
      <header className={styles.head}>
        <span className={styles.kicker}>{SEGMENT_LABEL[segment]}</span>
        <h1>{lang === "de" ? (de?.h1 ?? `Laufwerksdichtungen ${name}`) : `${name} mechanical face seals`}</h1>
        <p>{intro}</p>
      </header>
      <Shop categorySlug={segment} brandSlug={brandSlug} embedded />
      {/* first page only, so pages 2, 3 ... don't repeat it */}
      {firstPage && lang === "en" && <RichText html={brand?.description_html} />}
      {firstPage && lang === "de" && stats && (
        <RichText html={deBrandText(name, segment, stats).map((p) => `<p>${escapeHtml(p)}</p>`).join("")} />
      )}
    </div>
  );
}
