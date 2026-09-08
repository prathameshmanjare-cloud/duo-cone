import { useParams } from "react-router-dom";
import { Shop } from "./Shop";
import { SegmentPage } from "./SegmentPage";
import { DuoCone } from "../Content/DuoCone";

const SEGMENTS = new Set(["replacement", "aftermarket"]);

export function Category() {
  const { slug } = useParams<{ slug: string }>();
  if (slug === "duo-cone") return <DuoCone />;
  if (slug && SEGMENTS.has(slug)) return <SegmentPage slug={slug} />;
  return <Shop categorySlug={slug} />;
}
