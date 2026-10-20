import { useParams } from "react-router-dom";
import type { SegmentSlug } from "../../lib/catalog";
import { NotFound } from "../NotFound/NotFound";
import { BrandPage } from "./BrandPage";
import { SegmentPage } from "./SegmentPage";

const SEGMENTS = new Set<string>(["replacement", "aftermarket"]);

/** /product-category/<segment>/ and /product-category/<segment>/<brand>/ */
export function Category() {
  const { segment = "", brand } = useParams<{ segment: string; brand?: string }>();
  if (!SEGMENTS.has(segment)) return <NotFound />;
  if (brand) return <BrandPage segment={segment as SegmentSlug} brandSlug={brand} />;
  return <SegmentPage slug={segment} />;
}
