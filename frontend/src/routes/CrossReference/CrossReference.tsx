import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { Button } from "../../components/Button/Button";
import styles from "./CrossReference.module.css";

export function CrossReference() {
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["cross-reference", query],
    queryFn: () => api.crossReference(query),
    enabled: query.length > 1,
  });

  return (
    <div className={styles.page}>
      <h1>Cross-Reference Tool</h1>
      <p className={styles.lead}>Enter your OEM part number and we'll match it to the equivalent DuoCon seal.</p>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(term.trim());
        }}
      >
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="e.g. 1210654 or CAT 9W7228"
          aria-label="OEM part number"
        />
        <Button type="submit">Search</Button>
      </form>

      {isFetching && <p>Searching…</p>}

      {query && !isFetching && data && data.length === 0 && (
        <EmptyState
          title="No exact match found"
          description="Send us the part number and drawing — our team will confirm the equivalent seal within 24 hours."
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
