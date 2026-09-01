import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { ProductGridSkeleton } from "../../components/Skeleton/Skeleton";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import styles from "./Search.module.css";

export function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => api.search(q),
    enabled: q.length > 1,
  });

  return (
    <div className={styles.page}>
      <h1>Search results for "{q}"</h1>
      {isLoading && <ProductGridSkeleton count={4} />}
      {data && data.length === 0 && (
        <EmptyState
          title="No products matched"
          description="Try a different OEM part number, or use our cross-reference tool."
          action={<Link to="/cross-reference">Open cross-reference tool</Link>}
        />
      )}
      {data && data.length > 0 && (
        <div className={styles.grid}>
          {data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
