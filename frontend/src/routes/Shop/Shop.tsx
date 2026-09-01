import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { ProductGridSkeleton } from "../../components/Skeleton/Skeleton";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { Button } from "../../components/Button/Button";
import { IconChevronDown, IconChevronUp } from "../../components/Icon/Icon";
import styles from "./Shop.module.css";

const SEAL_TYPES = ["DF", "DO"];
const PAGE_SIZE = 24;

export function Shop({ categorySlug }: { categorySlug?: string } = {}) {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const page = Number(params.get("page") ?? 1);
  const sort = params.get("sort") ?? "relevance";
  const sealType = params.get("seal_type") ?? undefined;
  const priceMin = params.get("price_min") ?? undefined;
  const priceMax = params.get("price_max") ?? undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", { categorySlug, page, sort, sealType, priceMin, priceMax }],
    queryFn: () =>
      api.listProducts({
        category: categorySlug,
        page,
        page_size: PAGE_SIZE,
        sort,
        seal_type: sealType,
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

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{categorySlug ? `${categorySlug} seals` : "Shop"} — DuoCon Mechanical Face Seals</title>
      </Helmet>

      <div className={styles.topBar}>
        <h1>{categorySlug ? categorySlug.replace(/-/g, " ") : "All products"}</h1>
        <button className={styles.filterToggle} onClick={() => setShowFilters((v) => !v)}>
          Filters {showFilters ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </button>
      </div>

      <div className={styles.layout}>
        <aside className={`${styles.filters} ${showFilters ? styles.filtersOpen : ""}`}>
          <fieldset>
            <legend>Seal type</legend>
            {SEAL_TYPES.map((t) => (
              <label key={t}>
                <input
                  type="radio"
                  name="seal_type"
                  checked={sealType === t}
                  onChange={() => updateParam("seal_type", t)}
                />
                {t} Type
              </label>
            ))}
            <label>
              <input type="radio" name="seal_type" checked={!sealType} onChange={() => updateParam("seal_type", undefined)} />
              All
            </label>
          </fieldset>
          <fieldset>
            <legend>Price (€, excl. VAT)</legend>
            <div className={styles.priceInputs}>
              <input
                type="number"
                placeholder="Min"
                defaultValue={priceMin}
                onBlur={(e) => updateParam("price_min", e.target.value || undefined)}
              />
              <input
                type="number"
                placeholder="Max"
                defaultValue={priceMax}
                onBlur={(e) => updateParam("price_max", e.target.value || undefined)}
              />
            </div>
          </fieldset>
        </aside>

        <div className={styles.results}>
          <div className={styles.sortBar}>
            <span>{data ? `${data.total} results` : "…"}</span>
            <select value={sort} onChange={(e) => updateParam("sort", e.target.value)} aria-label="Sort products">
              <option value="relevance">Sort: Relevance</option>
              <option value="latest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>

          {isLoading && <ProductGridSkeleton />}

          {isError && (
            <EmptyState
              title="Couldn't load products"
              description="Something went wrong reaching the catalog. Please try again."
              action={<Button onClick={() => window.location.reload()}>Retry</Button>}
            />
          )}

          {data && data.items.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try clearing filters, or use our cross-reference tool with your OEM part number."
            />
          )}

          {data && data.items.length > 0 && (
            <>
              <div className={styles.grid}>
                {data.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div className={styles.pagination}>
                <button disabled={page <= 1} onClick={() => updateParam("page", String(page - 1))}>← Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => updateParam("page", String(page + 1))}>Next →</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
