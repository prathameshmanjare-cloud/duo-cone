import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { Button } from "../../components/Button/Button";
import { IconArrowRight } from "../../components/Icon/Icon";
import styles from "./CrossReference.module.css";

const CATALOGS = [
  {
    to: "/category/aftermarket",
    title: "Aftermarket",
    desc: "Seals that fit Caterpillar, Komatsu, Liebherr, John Deere and other OEM machines.",
  },
  {
    to: "/category/replacement",
    title: "Replacement",
    desc: "Seal-brand originals: Goetze, Trelleborg, SKF, Eagle Burgmann, GNL and more.",
  },
];

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
      <p className={styles.lead}>Enter your OEM part number and we'll match it to the equivalent DuoCone seal.</p>
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
          description="Send us the part number and drawing. Our team will confirm the equivalent seal within 24 hours."
        />
      )}

      {data && data.length > 0 && (
        <div className={styles.grid}>
          {data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <section className={styles.catalogs}>
        <h2 className={styles.catalogsHead}>Browse the full catalog</h2>
        <div className={styles.catalogGrid}>
          {CATALOGS.map((c) => (
            <Link key={c.to} to={c.to} className={styles.catalogCard}>
              <span className={styles.catalogName}>{c.title}</span>
              <span className={styles.catalogDesc}>{c.desc}</span>
              <span className={styles.catalogGo}>
                Open {c.title} <IconArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
