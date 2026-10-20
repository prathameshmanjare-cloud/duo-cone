// Shared query definitions. Pages read with these and the build-time
// prerender (scripts/prerender.mjs) prefetches with the same ones, so the
// keys always match and the prerendered HTML hydrates from cached data.
import { api } from "./api";

export const SHOP_PAGE_SIZE = 24;

export interface ShopQuery {
  categorySlug?: string;
  page: number;
  sort: string;
  sealType?: string;
  brand?: string;
  priceMin?: string;
  priceMax?: string;
}

export const productQuery = (slug: string) => ({
  queryKey: ["product", slug],
  queryFn: () => api.getProduct(slug),
});

export const relatedQuery = (slug: string) => ({
  queryKey: ["product-related", slug],
  queryFn: () => api.getRelated(slug),
});

// admin-written page text for brand and segment pages (sanitized HTML)
export const brandQuery = (slug: string) => ({
  queryKey: ["brand", slug],
  queryFn: () => api.getBrand(slug),
});

export const categoryQuery = (slug: string) => ({
  queryKey: ["category", slug],
  queryFn: () => api.getCategory(slug),
});

export const featuredQuery = () => ({
  queryKey: ["products", "featured"],
  queryFn: () => api.listProducts({ page: 1, page_size: 4, sort: "latest" }),
});

export const shopQuery = (q: ShopQuery) => ({
  queryKey: [
    "products",
    {
      categorySlug: q.categorySlug,
      page: q.page,
      sort: q.sort,
      sealType: q.sealType,
      brand: q.brand,
      priceMin: q.priceMin,
      priceMax: q.priceMax,
    },
  ],
  queryFn: () =>
    api.listProducts({
      category: q.categorySlug,
      page: q.page,
      page_size: SHOP_PAGE_SIZE,
      sort: q.sort,
      seal_type: q.sealType,
      brand: q.brand,
      price_min: q.priceMin ? Number(q.priceMin) * 100 : undefined,
      price_max: q.priceMax ? Number(q.priceMax) * 100 : undefined,
    }),
});
