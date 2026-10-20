import { useParams } from "react-router-dom";
import { Breadcrumbs } from "../../components/Breadcrumbs/Breadcrumbs";
import { AFTERMARKET_BRANDS, REPLACEMENT_BRANDS, segmentPath, type SegmentSlug } from "../../lib/catalog";
import { Shop } from "./Shop";
import { Seo } from "../../components/Seo/Seo";
import { pageSuffix, pageTitle } from "../../lib/seo";
import styles from "./Shop.module.css";

const LABELS = new Map([...REPLACEMENT_BRANDS, ...AFTERMARKET_BRANDS].map((b) => [b.value, b.label]));
const SEGMENT_LABEL: Record<SegmentSlug, string> = { replacement: "Replacement", aftermarket: "Aftermarket" };

const brandLabel = (slug: string) =>
  LABELS.get(slug) ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** /product-category/<segment>/<brand>/ — one brand's seals within a segment,
 *  at the same URL the old shop used for its brand category pages. */
export function BrandPage({ segment, brandSlug }: { segment: SegmentSlug; brandSlug: string }) {
  const name = brandLabel(brandSlug);
  const { page } = useParams<{ page?: string }>();
  const intro =
    segment === "replacement"
      ? `${name} mechanical face seals (floating seals, duo cone seals) in DF and DO type, matched to the ${name} part number.`
      : `Aftermarket mechanical face seals (floating seals, duo cone seals) for ${name} machines, in DF and DO type. Search by your ${name} part number.`;

  return (
    <div className={styles.page}>
      <Seo title={pageTitle(`${name} Mechanical Face Seals${pageSuffix(page)}`)} description={intro} />
      <Breadcrumbs
        items={[
          { label: "Shop", to: "/shop/" },
          { label: SEGMENT_LABEL[segment], to: segmentPath(segment) },
          { label: name },
        ]}
      />
      <header className={styles.head}>
        <span className={styles.kicker}>{SEGMENT_LABEL[segment]}</span>
        <h1>{name} mechanical face seals</h1>
        <p>{intro}</p>
      </header>
      <Shop categorySlug={segment} brandSlug={brandSlug} embedded />
    </div>
  );
}
