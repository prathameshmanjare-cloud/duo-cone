import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link, useT, useLang } from "../../lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../lib/api";
import { IconClose, IconSearch } from "../Icon/Icon";
import { productName } from "../../lib/productText";
import styles from "./ProductSearch.module.css";

export function ProductSearch({
  className = "",
  placeholder,
}: { className?: string; placeholder?: string }) {
  const t = useT();
  const lang = useLang();
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
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSuggestOpen(true);
        }}
        onFocus={() => query.length > 1 && setSuggestOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
        placeholder={placeholder ?? t({ en: "Search products, SKU, OEM ref…", de: "Produkte, Artikelnr., OEM-Nr. suchen…" })}
        aria-label={t({ en: "Search products", de: "Produkte suchen" })}
      />
      {query && (
        <button
          type="button"
          className={styles.searchClear}
          aria-label={t({ en: "Clear search", de: "Suche löschen" })}
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
            {suggestLoading && <div className={styles.suggestEmpty}>{t({ en: "Searching…", de: "Suche läuft…" })}</div>}
            {!suggestLoading && suggestions && suggestions.length === 0 && (
              <div className={styles.suggestEmpty}>{t({ en: `No matches for "${debouncedQuery}"`, de: `Keine Treffer für „${debouncedQuery}“` })}</div>
            )}
            {!suggestLoading &&
              suggestions &&
              suggestions.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.slug}/`}
                  className={styles.suggestItem}
                  onClick={() => setSuggestOpen(false)}
                >
                  {p.image_url && <img src={p.image_url} alt="" width={40} height={40} />}
                  <div className={styles.suggestInfo}>
                    <span className={styles.suggestName}>{productName(p.name, lang)}</span>
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
                {t({ en: `See all results for "${debouncedQuery}"`, de: `Alle Ergebnisse für „${debouncedQuery}“` })}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
