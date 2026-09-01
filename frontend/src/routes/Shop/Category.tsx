import { useParams } from "react-router-dom";
import { Shop } from "./Shop";

export function Category() {
  const { slug } = useParams<{ slug: string }>();
  return <Shop categorySlug={slug} />;
}
