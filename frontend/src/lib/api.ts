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

const SESSION_KEY = "duocone-session";

export const session = {
  get token(): string | null {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(SESSION_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  },
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = session.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { headers, ...init });
  if (!res.ok) {
    const body = await res.text();
    let message = body || res.statusText;
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed.detail === "string") message = parsed.detail;
    } catch {
      /* keep raw */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface OrderLine {
  sku: string;
  name: string;
  qty: number;
  unit_price_cents: number;
  total_cents: number;
}

export interface Order {
  id: string;
  number: string;
  email: string;
  status: string;
  currency: string;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  total_cents: number;
  vat_reverse_charge: boolean;
  customer_note?: string | null;
  created_at: string;
  items: OrderLine[];
}

export interface CreateOrderPayload {
  email: string;
  currency?: string;
  vat_id?: string;
  shipping_address: {
    name: string;
    company?: string;
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postal_code: string;
    country_code: string;
    phone?: string;
  };
  billing_address?: CreateOrderPayload["shipping_address"];
  shipping_method?: string;
  customer_note?: string;
  items: { product_id?: string; sku: string; name: string; qty: number; unit_price_cents: number }[];
  terms_accepted: boolean;
}

export interface MyRfq {
  id: string;
  number: string;
  email: string;
  company?: string | null;
  message?: string | null;
  status: string;
  created_at: string;
  items: { sku?: string | null; name?: string | null; qty: number; note?: string | null }[];
}

export interface SessionUser {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  is_verified: boolean;
  is_admin: boolean;
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
    request<{ id: string; number: string }>(`/contact`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createOrder: (payload: CreateOrderPayload) =>
    request<Order>(`/orders`, { method: "POST", body: JSON.stringify(payload) }),
  listOrders: () => request<Order[]>(`/orders`),
  getOrder: (number: string, email?: string) =>
    request<Order>(`/orders/${encodeURIComponent(number)}${email ? `?email=${encodeURIComponent(email)}` : ""}`),
  listMyRfqs: () => request<MyRfq[]>(`/rfq`),

  login: (email: string, password: string) =>
    request<{ access_token: string; refresh_token: string }>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: {
    email: string;
    password: string;
    full_name?: string;
    company_name?: string;
    phone?: string;
  }) =>
    request<{ access_token: string; refresh_token: string }>(`/auth/register`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request<SessionUser>(`/auth/me`),

  chat: (message: string, history: { role: string; text: string }[]) =>
    request<ChatResponse>(`/chat`, {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
  chatHandoff: (payload: {
    email: string;
    message: string;
    name?: string;
    phone?: string;
    part_number?: string;
  }) =>
    request<{ number: string }>(`/chat/handoff`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export interface ChatBotProduct {
  name: string;
  slug: string;
  sku: string;
  price_cents: number;
  currency: string;
  is_rfq_only: boolean;
}

export interface ChatResponse {
  reply: string;
  quick_replies: string[];
  products: ChatBotProduct[];
  handoff: boolean;
}

export { ApiError };
