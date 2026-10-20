import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Link, useLang, useT } from "../../lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SHOP_PAGE_SIZE, shopQuery } from "../../lib/queries";
import { DE_SEO } from "../../content/de";
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
import { localTitle } from "../../lib/seo";
import styles from "./Shop.module.css";

const SEAL_TYPES: { value: string; label: string }[] = [
  { value: "DF", label: "DF" },
  { value: "DO", label: "DO" },
  { value: "other", label: "Universal" }, // same word in German
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
const SEAL_TYPE_LABEL: Record<string, { en: string; de: string }> = {
  DF: { en: "DF Type", de: "Typ DF" },
  DO: { en: "DO Type", de: "Typ DO" },
  other: { en: "Universal", de: "Universal" },
};
const ease = [0.22, 1, 0.36, 1] as const;

export function Shop({
  categorySlug,
  brandSlug,
  embedded = false,
}: { categorySlug?: string; brandSlug?: string; embedded?: boolean } = {}) {
  const reduce = useReducedMotion();
  const t = useT();
  const lang = useLang();
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
  const title = categorySlug ? categorySlug.replace(/-/g, " ") : t({ en: "All products", de: DE_SEO.shop.h1 });

  const activeChips: { label: string; onClear: () => void }[] = [];
  if (brand)
    activeChips.push({
      label: brand.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      onClear: () => (brandSlug ? navigate(allBrandsPath) : updateParam("brand", undefined)),
    });
  if (sealType)
    activeChips.push({
      label: SEAL_TYPE_LABEL[sealType]?.[lang] ?? sealType,
      onClear: () => updateParam("seal_type", undefined),
    });
  if (priceMin) activeChips.push({ label: `${t({ en: "Min", de: "Min." })} €${priceMin}`, onClear: () => updateParam("price_min", undefined) });
  if (priceMax) activeChips.push({ label: `${t({ en: "Max", de: "Max." })} €${priceMax}`, onClear: () => updateParam("price_max", undefined) });

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
        <span className={styles.filterLabel}>{t({ en: "Seal type", de: "Dichtungstyp" })}</span>
        <div className={styles.segmented} role="group" aria-label={t({ en: "Seal type", de: "Dichtungstyp" })}>
          <button
            type="button"
            className={!sealType ? styles.segOn : undefined}
            onClick={() => updateParam("seal_type", undefined)}
          >
            {t({ en: "All", de: "Alle" })}
          </button>
          {SEAL_TYPES.map((st) => (
            <button
              key={st.value}
              type="button"
              className={sealType === st.value ? styles.segOn : undefined}
              onClick={() => updateParam("seal_type", st.value)}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>{t({ en: "Brand", de: "Marke" })}</span>
        <div className={styles.brandList} role="group" aria-label={t({ en: "Brand", de: "Marke" })}>
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
        <span className={styles.filterLabel}>{t({ en: "Price (€, excl. VAT)", de: "Preis (€, zzgl. MwSt.)" })}</span>
        <div className={styles.priceRow}>
          <div className={styles.priceField}>
            <span>€</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder={t({ en: "Min", de: "Min." })}
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
              placeholder={t({ en: "Max", de: "Max." })}
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
          {t({ en: "Clear all filters", de: "Alle Filter zurücksetzen" })}
        </button>
      )}
    </>
  );

  return (
    <div className={embedded ? styles.pageEmbedded : styles.page} id="products">
      {!embedded && (
        <>
          <Seo
            title={localTitle(lang, "Mechanical Face Seals, DF & DO Type", DE_SEO.shop.title, page)}
            description={t({
              en: "Shop mechanical face seals (floating seals, duo cone seals) in DF and DO type: replacement and aftermarket parts for Caterpillar, Komatsu, Goetze, SKF and more. Search by OEM part number.",
              de: DE_SEO.shop.description,
            })}
          />
          <header className={styles.head}>
            <span className={styles.kicker}>{t({ en: "Catalog", de: "Katalog" })}</span>
            <h1>{title}</h1>
            <p>
              {t({
                en: "Mechanical face seals (DF & DO type). Filter by type and price.",
                de: "Laufwerksdichtungen (Typ DF & DO). Nach Typ, Marke und Preis filtern oder direkt nach der OEM-Teilenummer suchen.",
              })}
            </p>
          </header>
        </>
      )}

      <div className={styles.layout}>
        <aside className={`${styles.filters} ${showFilters ? styles.filtersOpen : ""}`}>
          <div className={styles.filtersInner}>
            <div className={styles.filtersHeadMobile}>
              <span>{t({ en: "Filters", de: "Filter" })}</span>
              <button type="button" onClick={() => setShowFilters(false)} aria-label={t({ en: "Close filters", de: "Filter schließen" })}>
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
                {t({ en: "Filters", de: "Filter" })} {showFilters ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
              </button>
              <span className={styles.count}>
                {data
                  ? t({
                      en: `${data.total} result${data.total === 1 ? "" : "s"}`,
                      de: `${data.total.toLocaleString("de-DE")} ${data.total === 1 ? "Ergebnis" : "Ergebnisse"}`,
                    })
                  : t({ en: "Loading…", de: "Wird geladen…" })}
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
              <span>{t({ en: "Sort", de: "Sortieren" })}</span>
              <select value={sort} onChange={(e) => updateParam("sort", e.target.value)} aria-label={t({ en: "Sort products", de: "Produkte sortieren" })}>
                <option value="relevance">{t({ en: "Relevance", de: "Relevanz" })}</option>
                <option value="latest">{t({ en: "Newest", de: "Neueste" })}</option>
                <option value="price_asc">{t({ en: "Price: low to high", de: "Preis: aufsteigend" })}</option>
                <option value="price_desc">{t({ en: "Price: high to low", de: "Preis: absteigend" })}</option>
              </select>
              <IconChevronDown size={15} />
            </label>
          </div>

          {isLoading && <ProductGridSkeleton count={12} />}

          {isError && !data && (
            <EmptyState
              title={t({ en: "Couldn't load products", de: "Produkte konnten nicht geladen werden" })}
              description={t({ en: "Something went wrong reaching the catalog. Please try again.", de: "Der Katalog ist gerade nicht erreichbar. Bitte versuchen Sie es erneut." })}
              action={<Button onClick={() => refetch()}>{t({ en: "Retry", de: "Erneut versuchen" })}</Button>}
            />
          )}

          {data && data.items.length === 0 && (
            <EmptyState
              title={t({ en: "No products match", de: "Keine passenden Produkte" })}
              description={t({ en: "Try clearing filters, or search by your OEM part number.", de: "Setzen Sie Filter zurück oder suchen Sie nach Ihrer OEM-Teilenummer." })}
              action={
                activeChips.length > 0 ? (
                  <Button variant="ghost" onClick={clearAll}>
                    {t({ en: "Clear filters", de: "Filter zurücksetzen" })}
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
                    <Link className={styles.pageBtn} to={pageHref(page - 1)} rel="prev" aria-label={t({ en: "Previous page", de: "Vorherige Seite" })}>
                      <span className={styles.flip}>
                        <IconArrowRight size={16} />
                      </span>
                      {t({ en: "Prev", de: "Zurück" })}
                    </Link>
                  ) : (
                    <span className={styles.pageBtn} aria-disabled="true">
                      <span className={styles.flip}>
                        <IconArrowRight size={16} />
                      </span>
                      {t({ en: "Prev", de: "Zurück" })}
                    </span>
                  )}
                  <span className={styles.pageInfo}>
                    {t({ en: "Page", de: "Seite" })} <b>{page}</b> {t({ en: "of", de: "von" })} {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link className={styles.pageBtn} to={pageHref(page + 1)} rel="next" aria-label={t({ en: "Next page", de: "Nächste Seite" })}>
                      {t({ en: "Next", de: "Weiter" })}
                      <IconArrowRight size={16} />
                    </Link>
                  ) : (
                    <span className={styles.pageBtn} aria-disabled="true">
                      {t({ en: "Next", de: "Weiter" })}
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
