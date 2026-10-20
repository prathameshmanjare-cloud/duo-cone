import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SHOP_PAGE_SIZE, shopQuery } from "../../lib/queries";
import { isHydrating } from "../../lib/ssr";
import { brandPath, segmentPath } from "../../lib/catalog";
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
import { ProductSearch } from "../../components/ProductSearch/ProductSearch";
import { Seo } from "../../components/Seo/Seo";
import { pageSuffix, pageTitle } from "../../lib/seo";
import styles from "./Shop.module.css";

const SEAL_TYPES: { value: string; label: string }[] = [
  { value: "DF", label: "DF" },
  { value: "DO", label: "DO" },
  { value: "other", label: "Universal" },
];

const BRAND_PRIORITY = ["Caterpillar", "Goetze", "Trelleborg"];
const OTHER_BRANDS = [
  "Nuova Sjat",
  "GNL",
  "SKF",
  "Eagle Burgmann",
  "CNHI",
  "Hitachi",
  "Fiat Hitachi",
  "John Deere",
  "Komatsu",
  "Liebherr",
  "FIAT Allis",
  "Poclain",
  "Busak Luyken",
  "Massey Ferguson",
  "Laltesi",
  "International",
  "Hanomag",
  "Hydromac",
  "Benati",
];
const BRANDS: { value: string; label: string }[] = [...BRAND_PRIORITY, ...OTHER_BRANDS].map(
  (name) => ({ label: name, value: name.toLowerCase().replace(/\s+/g, "-") }),
);
const SEAL_TYPE_LABEL: Record<string, string> = {
  DF: "DF Type",
  DO: "DO Type",
  other: "Universal",
};
const ease = [0.22, 1, 0.36, 1] as const;

export function Shop({
  categorySlug,
  brandSlug,
  embedded = false,
}: { categorySlug?: string; brandSlug?: string; embedded?: boolean } = {}) {
  const reduce = useReducedMotion();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { page: pagePath } = useParams<{ page?: string }>();
  const [showFilters, setShowFilters] = useState(false);

  // pages live in the path (/shop/page/2/) so each one is its own
  // prerendered, crawlable URL; ?page= is still read for old links
  const page = Math.max(1, Number(pagePath ?? params.get("page") ?? 1) || 1);
  const basePath = pathname.replace(/\/?(page\/[^/]+\/?)?$/, "/");
  // where "all brands" leads from here
  const allBrandsPath = categorySlug ? segmentPath(categorySlug) : "/shop/";
  const sort = params.get("sort") ?? "relevance";
  const sealType = params.get("seal_type") ?? undefined;
  const brand = brandSlug ?? params.get("brand") ?? undefined;
  const priceMin = params.get("price_min") ?? undefined;
  const priceMax = params.get("price_max") ?? undefined;

  const [minLocal, setMinLocal] = useState(priceMin ?? "");
  const [maxLocal, setMaxLocal] = useState(priceMax ?? "");
  useEffect(() => setMinLocal(priceMin ?? ""), [priceMin]);
  useEffect(() => setMaxLocal(priceMax ?? ""), [priceMax]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery(
    shopQuery({ categorySlug, page, sort, sealType, brand, priceMin, priceMax })
  );

  // any filter change goes back to page 1
  function goFiltered(next: URLSearchParams) {
    next.delete("page");
    const qs = next.toString();
    navigate({ pathname: basePath, search: qs ? `?${qs}` : "" });
  }

  function pageHref(n: number) {
    const next = new URLSearchParams(params);
    next.delete("page");
    const qs = next.toString();
    const path = n > 1 ? `${basePath}page/${n}/` : basePath;
    return `${path}${qs ? `?${qs}` : ""}`;
  }

  function updateParam(key: string, value?: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    goFiltered(next);
  }

  function clearAll() {
    const next = new URLSearchParams(params);
    ["seal_type", "brand", "price_min", "price_max"].forEach((k) => next.delete(k));
    goFiltered(next);
  }

  function applyPrice() {
    const next = new URLSearchParams(params);
    minLocal ? next.set("price_min", minLocal) : next.delete("price_min");
    maxLocal ? next.set("price_max", maxLocal) : next.delete("price_max");
    goFiltered(next);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / SHOP_PAGE_SIZE)) : 1;
  const title = categorySlug ? categorySlug.replace(/-/g, " ") : "All products";

  const activeChips: { label: string; onClear: () => void }[] = [];
  if (brand)
    activeChips.push({
      label: brand.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      onClear: () => (brandSlug ? navigate(allBrandsPath) : updateParam("brand", undefined)),
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
        <span className={styles.filterLabel}>Brand</span>
        <div className={styles.brandList} role="group" aria-label="Brand">
          {BRANDS.map((b) => (
            // real links to the brand pages, so crawlers can follow them
            <Link
              key={b.value}
              to={brand === b.value ? allBrandsPath : brandPath(b.value)}
              className={`${styles.brandPill} ${brand === b.value ? styles.brandPillOn : ""}`}
              aria-current={brand === b.value ? "page" : undefined}
            >
              {b.label}
            </Link>
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
          <Seo
            title={pageTitle(`Mechanical Face Seals, DF & DO Type${pageSuffix(page)}`)}
            description="Shop mechanical face seals (floating seals, duo cone seals) in DF and DO type: replacement and aftermarket parts for Caterpillar, Komatsu, Goetze, SKF and more. Search by OEM part number."
          />
          <header className={styles.head}>
            <span className={styles.kicker}>Catalog</span>
            <h1>{title}</h1>
            <p>Mechanical face seals (DF &amp; DO type). Filter by type and price.</p>
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
          <ProductSearch className={styles.search} />

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

          {isError && !data && (
            <EmptyState
              title="Couldn't load products"
              description="Something went wrong reaching the catalog. Please try again."
              action={<Button onClick={() => refetch()}>Retry</Button>}
            />
          )}

          {data && data.items.length === 0 && (
            <EmptyState
              title="No products match"
              description="Try clearing filters, or search by your OEM part number."
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
                initial={isHydrating() ? false : "hidden"}
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
                  {page > 1 ? (
                    <Link className={styles.pageBtn} to={pageHref(page - 1)} rel="prev" aria-label="Previous page">
                      <span className={styles.flip}>
                        <IconArrowRight size={16} />
                      </span>
                      Prev
                    </Link>
                  ) : (
                    <span className={styles.pageBtn} aria-disabled="true">
                      <span className={styles.flip}>
                        <IconArrowRight size={16} />
                      </span>
                      Prev
                    </span>
                  )}
                  <span className={styles.pageInfo}>
                    Page <b>{page}</b> of {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link className={styles.pageBtn} to={pageHref(page + 1)} rel="next" aria-label="Next page">
                      Next
                      <IconArrowRight size={16} />
                    </Link>
                  ) : (
                    <span className={styles.pageBtn} aria-disabled="true">
                      Next
                      <IconArrowRight size={16} />
                    </span>
                  )}
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
