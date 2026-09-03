import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { api } from "../../lib/api";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { ProductGridSkeleton } from "../../components/Skeleton/Skeleton";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { Button } from "../../components/Button/Button";
import {
  IconChevronDown,
  IconChevronUp,
  IconClose,
  IconArrowRight,
} from "../../components/Icon/Icon";
import styles from "./Shop.module.css";

const SEAL_TYPES: { value: string; label: string }[] = [
  { value: "DF", label: "DF" },
  { value: "DO", label: "DO" },
  { value: "other", label: "Universal" },
];
const SEAL_TYPE_LABEL: Record<string, string> = {
  DF: "DF Type",
  DO: "DO Type",
  other: "Universal",
};
const PAGE_SIZE = 24;
const ease = [0.22, 1, 0.36, 1] as const;

export function Shop({
  categorySlug,
  embedded = false,
}: { categorySlug?: string; embedded?: boolean } = {}) {
  const reduce = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const page = Number(params.get("page") ?? 1);
  const sort = params.get("sort") ?? "relevance";
  const sealType = params.get("seal_type") ?? undefined;
  const brand = params.get("brand") ?? undefined;
  const priceMin = params.get("price_min") ?? undefined;
  const priceMax = params.get("price_max") ?? undefined;

  const [minLocal, setMinLocal] = useState(priceMin ?? "");
  const [maxLocal, setMaxLocal] = useState(priceMax ?? "");
  useEffect(() => setMinLocal(priceMin ?? ""), [priceMin]);
  useEffect(() => setMaxLocal(priceMax ?? ""), [priceMax]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["products", { categorySlug, page, sort, sealType, brand, priceMin, priceMax }],
    queryFn: () =>
      api.listProducts({
        category: categorySlug,
        page,
        page_size: PAGE_SIZE,
        sort,
        seal_type: sealType,
        brand,
        price_min: priceMin ? Number(priceMin) * 100 : undefined,
        price_max: priceMax ? Number(priceMax) * 100 : undefined,
      }),
  });

  function updateParam(key: string, value?: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  }

  function clearAll() {
    const next = new URLSearchParams(params);
    ["seal_type", "brand", "price_min", "price_max", "page"].forEach((k) => next.delete(k));
    setParams(next);
  }

  function applyPrice() {
    const next = new URLSearchParams(params);
    minLocal ? next.set("price_min", minLocal) : next.delete("price_min");
    maxLocal ? next.set("price_max", maxLocal) : next.delete("price_max");
    next.delete("page");
    setParams(next);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const title = categorySlug ? categorySlug.replace(/-/g, " ") : "All products";

  const activeChips: { label: string; onClear: () => void }[] = [];
  if (brand)
    activeChips.push({
      label: brand.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      onClear: () => updateParam("brand", undefined),
    });
  if (sealType)
    activeChips.push({
      label: SEAL_TYPE_LABEL[sealType] ?? sealType,
      onClear: () => updateParam("seal_type", undefined),
    });
  if (priceMin) activeChips.push({ label: `Min €${priceMin}`, onClear: () => updateParam("price_min", undefined) });
  if (priceMax) activeChips.push({ label: `Max €${priceMax}`, onClear: () => updateParam("price_max", undefined) });

  const gridVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04 } },
  };
  const itemVariants = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
      };

  const FiltersBody = (
    <>
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Seal type</span>
        <div className={styles.segmented} role="group" aria-label="Seal type">
          <button
            type="button"
            className={!sealType ? styles.segOn : undefined}
            onClick={() => updateParam("seal_type", undefined)}
          >
            All
          </button>
          {SEAL_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={sealType === t.value ? styles.segOn : undefined}
              onClick={() => updateParam("seal_type", t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Price (€, excl. VAT)</span>
        <div className={styles.priceRow}>
          <div className={styles.priceField}>
            <span>€</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={minLocal}
              onChange={(e) => setMinLocal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            />
          </div>
          <span className={styles.priceDash}>–</span>
          <div className={styles.priceField}>
            <span>€</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={maxLocal}
              onChange={(e) => setMaxLocal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            />
          </div>
        </div>
        <button type="button" className={styles.applyBtn} onClick={applyPrice}>
          Apply price
        </button>
      </div>

      {activeChips.length > 0 && (
        <button type="button" className={styles.clearAll} onClick={clearAll}>
          Clear all filters
        </button>
      )}
    </>
  );

  return (
    <div className={embedded ? styles.pageEmbedded : styles.page} id="products">
      {!embedded && (
        <>
          <Helmet>
            <title>{categorySlug ? `${categorySlug} seals` : "Shop"} — DuoCon Mechanical Face Seals</title>
          </Helmet>
          <header className={styles.head}>
            <span className={styles.kicker}>Catalog</span>
            <h1>{title}</h1>
            <p>Mechanical face seals (DF &amp; DO type) — filter by type and price.</p>
          </header>
        </>
      )}

      <div className={styles.layout}>
        <aside className={`${styles.filters} ${showFilters ? styles.filtersOpen : ""}`}>
          <div className={styles.filtersInner}>
            <div className={styles.filtersHeadMobile}>
              <span>Filters</span>
              <button type="button" onClick={() => setShowFilters(false)} aria-label="Close filters">
                <IconClose size={18} />
              </button>
            </div>
            {FiltersBody}
          </div>
        </aside>

        <div className={styles.results}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <button
                type="button"
                className={styles.filterToggle}
                onClick={() => setShowFilters((v) => !v)}
              >
                Filters {showFilters ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
              </button>
              <span className={styles.count}>
                {data ? `${data.total} result${data.total === 1 ? "" : "s"}` : "Loading…"}
              </span>
              <div className={styles.chips}>
                {activeChips.map((c) => (
                  <button key={c.label} type="button" className={styles.chip} onClick={c.onClear}>
                    {c.label}
                    <IconClose size={12} />
                  </button>
                ))}
              </div>
            </div>
            <label className={styles.sort}>
              <span>Sort</span>
              <select value={sort} onChange={(e) => updateParam("sort", e.target.value)} aria-label="Sort products">
                <option value="relevance">Relevance</option>
                <option value="latest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
              <IconChevronDown size={15} />
            </label>
          </div>

          {isLoading && <ProductGridSkeleton count={12} />}

          {isError && (
            <EmptyState
              title="Couldn't load products"
              description="Something went wrong reaching the catalog. Please try again."
              action={<Button onClick={() => refetch()}>Retry</Button>}
            />
          )}

          {data && data.items.length === 0 && (
            <EmptyState
              title="No products match"
              description="Try clearing filters, or use our cross-reference tool with your OEM part number."
              action={
                activeChips.length > 0 ? (
                  <Button variant="ghost" onClick={clearAll}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          )}

          {data && data.items.length > 0 && (
            <>
              <motion.div
                key={page + sort + (sealType ?? "") + (priceMin ?? "") + (priceMax ?? "")}
                className={`${styles.grid} ${isFetching ? styles.gridBusy : ""}`}
                variants={gridVariants}
                initial="hidden"
                animate="show"
              >
                {data.items.map((p) => (
                  <motion.div key={p.id} variants={itemVariants}>
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    disabled={page <= 1}
                    onClick={() => updateParam("page", String(page - 1))}
                    aria-label="Previous page"
                  >
                    <span className={styles.flip}>
                      <IconArrowRight size={16} />
                    </span>
                    Prev
                  </button>
                  <span className={styles.pageInfo}>
                    Page <b>{page}</b> of {totalPages}
                  </span>
                  <button
                    className={styles.pageBtn}
                    disabled={page >= totalPages}
                    onClick={() => updateParam("page", String(page + 1))}
                    aria-label="Next page"
                  >
                    Next
                    <IconArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.button
            type="button"
            className={styles.scrim}
            aria-label="Close filters"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFilters(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
