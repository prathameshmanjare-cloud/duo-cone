const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

const ACCESS_KEY = "duocone-admin-access";
const REFRESH_KEY = "duocone-admin-refresh";
const REMEMBER_KEY = "duocone-admin-remember";

/** "Remember me" → localStorage (survives browser restart).
 *  Unchecked → sessionStorage (cleared when the tab/window closes). */
function stores() {
  return localStorage.getItem(REMEMBER_KEY) === "0"
    ? [sessionStorage, localStorage]
    : [localStorage, sessionStorage];
}

export const tokenStore = {
  get access() {
    const [a, b] = stores();
    return a.getItem(ACCESS_KEY) ?? b.getItem(ACCESS_KEY);
  },
  get refresh() {
    const [a, b] = stores();
    return a.getItem(REFRESH_KEY) ?? b.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string, remember = true) {
    this.clear();
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    const target = remember ? localStorage : sessionStorage;
    target.setItem(ACCESS_KEY, access);
    target.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    for (const st of [localStorage, sessionStorage]) {
      st.removeItem(ACCESS_KEY);
      st.removeItem(REFRESH_KEY);
    }
  },
};

export class AdminApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function parseDetail(body: string): string {
  try {
    const json = JSON.parse(body);
    if (typeof json.detail === "string") return json.detail;
    if (Array.isArray(json.detail)) return json.detail.map((d: { msg?: string }) => d.msg).join("; ");
    return body;
  } catch {
    return body || "Request failed";
  }
}

async function raw(path: string, init: RequestInit, retry = true): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (tokenStore.access) headers.set("Authorization", `Bearer ${tokenStore.access}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && retry && tokenStore.refresh) {
    const ok = await tryRefresh();
    if (ok) return raw(path, init, false);
    tokenStore.clear();
  }
  return res;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokenStore.refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access_token: string; refresh_token: string };
    tokenStore.set(
      data.access_token,
      data.refresh_token,
      localStorage.getItem(REMEMBER_KEY) !== "0"
    );
    return true;
  } catch {
    return false;
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await raw(path, init);
  if (!res.ok) {
    throw new AdminApiError(res.status, parseDetail(await res.text()));
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const body = (data: unknown) => JSON.stringify(data);
const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}` : "";
};

/** Fetch an export (csv|pdf) with auth and trigger a browser download. */
export async function downloadExport(
  resource: "products" | "orders" | "rfqs" | "users" | "brands" | "categories",
  format: "csv" | "pdf",
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<void> {
  const res = await raw(`/admin/export/${resource}${qs({ ...params, fmt: format })}`, {});
  if (!res.ok) throw new AdminApiError(res.status, parseDetail(await res.text()));
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^"]+)"?/.exec(cd);
  const name = match ? match[1] : `${resource}.${format}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------- types ----
export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  is_verified: boolean;
  is_admin: boolean;
}

export interface Inventory {
  stock_qty: number;
  backorder: "no" | "notify" | "yes";
  lead_time_days: number;
  warehouse: string;
}

export interface AdminProduct {
  id: string;
  slug: string;
  sku: string;
  name: string;
  seal_type: "DF" | "DO" | "other";
  internal_code: string | null;
  brand_id: number | null;
  short_description: string | null;
  description_html: string | null;
  price_cents: number;
  sale_price_cents: number | null;
  currency: string;
  tax_class: string;
  is_active: boolean;
  is_rfq_only: boolean;
  inner_diameter_mm: number | null;
  outer_diameter_mm: number | null;
  height_mm: number | null;
  weight_g: number | null;
  material: string | null;
  oring_material: string | null;
  hardness_hrc: string | null;
  lifetime_hours: string | null;
  warranty_months: number | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string | null;
  updated_at: string | null;
  inventory: Inventory | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminBrand {
  id: number;
  slug: string;
  name: string;
  segment: "aftermarket" | "replacement" | "oem";
  logo_url: string | null;
  description: string | null;
  product_count: number;
}

export interface AdminCategory {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  segment: "aftermarket" | "replacement" | "oem" | null;
  description: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort: number;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  id: number;
  sku: string;
  name: string;
  qty: number;
  unit_price_cents: number;
  total_cents: number;
}

export interface AdminOrder {
  id: string;
  number: string;
  email: string;
  status: OrderStatus;
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  shipping_address: Record<string, unknown> | null;
  billing_address: Record<string, unknown> | null;
  shipping_method: string | null;
  customer_note: string | null;
  created_at: string | null;
  items: OrderItem[];
}

export type RfqStatus = "new" | "quoted" | "won" | "lost" | "closed";

export interface RfqItemRow {
  id: number;
  sku: string | null;
  name: string | null;
  qty: number;
  target_price_cents: number | null;
  note: string | null;
}

export interface AdminRfq {
  id: string;
  number: string;
  email: string;
  company: string | null;
  vat_id: string | null;
  country_code: string | null;
  phone: string | null;
  message: string | null;
  status: RfqStatus;
  created_at: string | null;
  items: RfqItemRow[];
}

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  vat_id: string | null;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string | null;
  order_count: number;
  rfq_count: number;
}

export interface CrossRef {
  id: number;
  ref_number: string;
  ref_brand: string | null;
  note: string | null;
}

export interface ProductImageRow {
  id: number;
  url: string;
  alt: string | null;
  position: number;
}

export interface DashboardStats {
  products_total: number;
  products_active: number;
  products_rfq_only: number;
  out_of_stock: number;
  low_stock: number;
  brands_total: number;
  categories_total: number;
  orders_total: number;
  orders_pending: number;
  revenue_cents: number;
  rfqs_total: number;
  rfqs_new: number;
  users_total: number;
}

// ------------------------------------------------------------ endpoints ----
export const adminApi = {
  login: (email: string, password: string) =>
    req<{ access_token: string; refresh_token: string }>("/auth/login", {
      method: "POST",
      body: body({ email, password }),
    }),
  me: () => req<AdminUser>("/auth/me"),

  stats: () => req<DashboardStats>("/admin/stats"),

  listProducts: (params: {
    q?: string;
    brand_id?: number;
    is_active?: boolean;
    is_rfq_only?: boolean;
    stock?: string;
    sort?: string;
    page?: number;
    page_size?: number;
  }) => req<Paged<AdminProduct>>(`/admin/products${qs(params)}`),
  getProduct: (id: string) => req<AdminProduct>(`/admin/products/${id}`),
  createProduct: (data: Record<string, unknown>) =>
    req<AdminProduct>("/admin/products", { method: "POST", body: body(data) }),
  updateProduct: (id: string, data: Record<string, unknown>) =>
    req<AdminProduct>(`/admin/products/${id}`, { method: "PATCH", body: body(data) }),
  deleteProduct: (id: string) => req<void>(`/admin/products/${id}`, { method: "DELETE" }),
  setInventory: (id: string, data: Inventory) =>
    req<Inventory>(`/admin/products/${id}/inventory`, { method: "PUT", body: body(data) }),

  listBrands: () => req<AdminBrand[]>("/admin/brands"),
  createBrand: (data: Record<string, unknown>) =>
    req<AdminBrand>("/admin/brands", { method: "POST", body: body(data) }),
  updateBrand: (id: number, data: Record<string, unknown>) =>
    req<AdminBrand>(`/admin/brands/${id}`, { method: "PATCH", body: body(data) }),
  deleteBrand: (id: number) => req<void>(`/admin/brands/${id}`, { method: "DELETE" }),

  listCategories: () => req<AdminCategory[]>("/admin/categories"),
  createCategory: (data: Record<string, unknown>) =>
    req<AdminCategory>("/admin/categories", { method: "POST", body: body(data) }),
  updateCategory: (id: number, data: Record<string, unknown>) =>
    req<AdminCategory>(`/admin/categories/${id}`, { method: "PATCH", body: body(data) }),
  deleteCategory: (id: number) => req<void>(`/admin/categories/${id}`, { method: "DELETE" }),

  listOrders: (params: { q?: string; status?: string; page?: number; page_size?: number }) =>
    req<Paged<AdminOrder>>(`/admin/orders${qs(params)}`),
  getOrder: (id: string) => req<AdminOrder>(`/admin/orders/${id}`),
  setOrderStatus: (id: string, status: OrderStatus) =>
    req<AdminOrder>(`/admin/orders/${id}`, { method: "PATCH", body: body({ status }) }),

  listRfqs: (params: { q?: string; status?: string; page?: number; page_size?: number }) =>
    req<Paged<AdminRfq>>(`/admin/rfqs${qs(params)}`),
  getRfq: (id: string) => req<AdminRfq>(`/admin/rfqs/${id}`),
  setRfqStatus: (id: string, status: RfqStatus) =>
    req<AdminRfq>(`/admin/rfqs/${id}`, { method: "PATCH", body: body({ status }) }),

  listUsers: (params: {
    q?: string;
    is_admin?: boolean;
    is_verified?: boolean;
    page?: number;
    page_size?: number;
  }) => req<Paged<AdminUserRow>>(`/admin/users${qs(params)}`),
  updateUser: (id: string, data: Record<string, unknown>) =>
    req<AdminUserRow>(`/admin/users/${id}`, { method: "PATCH", body: body(data) }),
  resetUserPassword: (id: string, password: string) =>
    req<AdminUserRow>(`/admin/users/${id}/password`, { method: "POST", body: body({ password }) }),
  deleteUser: (id: string) => req<void>(`/admin/users/${id}`, { method: "DELETE" }),

  listCrossRefs: (productId: string) =>
    req<CrossRef[]>(`/admin/products/${productId}/cross-references`),
  addCrossRef: (productId: string, data: Record<string, unknown>) =>
    req<CrossRef>(`/admin/products/${productId}/cross-references`, {
      method: "POST",
      body: body(data),
    }),
  deleteCrossRef: (productId: string, refId: number) =>
    req<void>(`/admin/products/${productId}/cross-references/${refId}`, { method: "DELETE" }),

  listImages: (productId: string) =>
    req<ProductImageRow[]>(`/admin/products/${productId}/images`),
  addImage: (productId: string, data: Record<string, unknown>) =>
    req<ProductImageRow>(`/admin/products/${productId}/images`, { method: "POST", body: body(data) }),
  uploadImage: async (
    productId: string,
    file: File,
    opts: { alt?: string; position?: number } = {}
  ): Promise<ProductImageRow> => {
    const fd = new FormData();
    fd.append("file", file);
    if (opts.alt) fd.append("alt", opts.alt);
    fd.append("position", String(opts.position ?? 0));
    // hand-rolled fetch: never set Content-Type so the browser adds the
    // multipart boundary; keep auth + one refresh retry.
    const send = () =>
      fetch(`${API_URL}/admin/products/${productId}/images/upload`, {
        method: "POST",
        headers: tokenStore.access ? { Authorization: `Bearer ${tokenStore.access}` } : {},
        body: fd,
      });
    let res = await send();
    if (res.status === 401 && tokenStore.refresh && (await tryRefresh())) {
      res = await send();
    }
    if (!res.ok) throw new AdminApiError(res.status, parseDetail(await res.text()));
    return (await res.json()) as ProductImageRow;
  },
  updateImage: (productId: string, imageId: number, data: Record<string, unknown>) =>
    req<ProductImageRow>(`/admin/products/${productId}/images/${imageId}`, {
      method: "PATCH",
      body: body(data),
    }),
  deleteImage: (productId: string, imageId: number) =>
    req<void>(`/admin/products/${productId}/images/${imageId}`, { method: "DELETE" }),
};
