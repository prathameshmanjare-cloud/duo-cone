import { useParams } from "react-router-dom";
import { Shop } from "./Shop";
import { SegmentPage } from "./SegmentPage";

const SEGMENTS = new Set(["replacement", "aftermarket", "duo-cone"]);

export function Category() {
  const { slug } = useParams<{ slug: string }>();
  if (slug && SEGMENTS.has(slug)) return <SegmentPage slug={slug} />;
  return <Shop categorySlug={slug} />;
}
