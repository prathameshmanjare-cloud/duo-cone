import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../lib/api";
import { IconClose, IconSearch } from "../Icon/Icon";
import styles from "./ProductSearch.module.css";

export function ProductSearch({
  className = "",
  placeholder = "Search products, SKU, OEM ref…",
}: { className?: string; placeholder?: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 220);
    return () => clearTimeout(t);
  }, [query]);

  const { data: suggestions, isFetching: suggestLoading } = useQuery({
    queryKey: ["search-suggest", debouncedQuery],
    queryFn: () => api.search(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function runSearch(q: string) {
    const term = q.trim();
    if (!term) return;
    setSuggestOpen(false);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <div className={`${styles.searchBox} ${className}`} ref={searchBoxRef}>
      <IconSearch size={16} />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSuggestOpen(true);
        }}
        onFocus={() => query.length > 1 && setSuggestOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
        aria-label="Search products"
      />
      {query && (
        <button
          type="button"
          className={styles.searchClear}
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            setSuggestOpen(false);
          }}
        >
          <IconClose size={14} />
        </button>
      )}

      <AnimatePresence>
        {suggestOpen && debouncedQuery.length > 1 && (
          <motion.div
            className={styles.suggestDropdown}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {suggestLoading && <div className={styles.suggestEmpty}>Searching…</div>}
            {!suggestLoading && suggestions && suggestions.length === 0 && (
              <div className={styles.suggestEmpty}>No matches for "{debouncedQuery}"</div>
            )}
            {!suggestLoading &&
              suggestions &&
              suggestions.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.slug}`}
                  className={styles.suggestItem}
                  onClick={() => setSuggestOpen(false)}
                >
                  {p.image_url && <img src={p.image_url} alt="" />}
                  <div className={styles.suggestInfo}>
                    <span className={styles.suggestName}>{p.name}</span>
                    <span className={styles.suggestMeta}>
                      {p.brand?.name ? `${p.brand.name} · ` : ""}
                      {p.sku}
                    </span>
                  </div>
                </Link>
              ))}
            {!suggestLoading && suggestions && suggestions.length > 0 && (
              <button
                type="button"
                className={styles.suggestSeeAll}
                onClick={() => runSearch(debouncedQuery)}
              >
                See all results for "{debouncedQuery}"
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
