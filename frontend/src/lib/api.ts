const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export interface Brand {
  id: number;
  slug: string;
  name: string;
  logo_url?: string | null;
}

export interface ProductCard {
  id: string;
  slug: string;
  sku: string;
  name: string;
  seal_type: string;
  price_cents: number;
  sale_price_cents?: number | null;
  currency: string;
  in_stock: boolean;
  is_rfq_only?: boolean;
  image_url?: string | null;
  brand?: Brand | null;
}

export interface ProductDetail extends ProductCard {
  short_description?: string | null;
  description_html?: string | null;
  internal_code?: string | null;
  inner_diameter_mm?: number | null;
  outer_diameter_mm?: number | null;
  height_mm?: number | null;
  material?: string | null;
  oring_material?: string | null;
  hardness_hrc?: string | null;
  lifetime_hours?: string | null;
  warranty_months?: number | null;
  images: { url: string; alt?: string | null; position: number }[];
  attributes: { name: string; value: string }[];
  cross_references: { ref_number: string; ref_brand?: string | null }[];
}

export interface PagedProducts {
  items: ProductCard[];
  total: number;
  page: number;
  page_size: number;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listProducts: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string][]
    );
    return request<PagedProducts>(`/products?${qs.toString()}`);
  },
  getProduct: (slug: string) => request<ProductDetail>(`/products/${slug}`),
  getRelated: (slug: string) => request<ProductCard[]>(`/products/${slug}/related`),
  listBrands: () => request<Brand[]>(`/brands`),
  listCategories: () => request<{ id: number; slug: string; name: string; image_url?: string }[]>(`/categories`),
  crossReference: (ref: string) => request<ProductCard[]>(`/cross-reference?ref=${encodeURIComponent(ref)}`),
  search: (q: string) => request<ProductCard[]>(`/search?q=${encodeURIComponent(q)}`),
  submitRfq: (payload: unknown) =>
    request<{ id: string; number: string }>(`/rfq`, { method: "POST", body: JSON.stringify(payload) }),
  submitContact: (payload: unknown) =>
    request<{ id: string }>(`/contact`, { method: "POST", body: JSON.stringify(payload) }),
};

export { ApiError };
