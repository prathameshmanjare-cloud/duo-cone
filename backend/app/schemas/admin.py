"""Schemas for the admin CMS: full product view + partial-update payloads."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.catalog import BackorderPolicy, SealType, Segment
from app.models.commerce import OrderStatus, RfqStatus


# ---------------------------------------------------------------- products ----
class InventoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    stock_qty: int = 0
    backorder: BackorderPolicy = BackorderPolicy.notify
    lead_time_days: int = 3
    warehouse: str = "DE"


class ProductAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    slug: str
    sku: str
    name: str
    seal_type: SealType
    internal_code: str | None = None
    brand_id: int | None = None
    short_description: str | None = None
    description_html: str | None = None
    price_cents: int
    sale_price_cents: int | None = None
    currency: str
    tax_class: str
    is_active: bool
    is_rfq_only: bool
    inner_diameter_mm: float | None = None
    outer_diameter_mm: float | None = None
    height_mm: float | None = None
    weight_g: int | None = None
    material: str | None = None
    oring_material: str | None = None
    hardness_hrc: str | None = None
    lifetime_hours: str | None = None
    warranty_months: int | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    inventory: InventoryOut | None = None


class PagedProductsAdmin(BaseModel):
    items: list[ProductAdminOut]
    total: int
    page: int
    page_size: int


class ProductCreateIn(BaseModel):
    sku: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=300)
    slug: str | None = None
    seal_type: SealType = SealType.other
    internal_code: str | None = None
    brand_id: int | None = None
    short_description: str | None = None
    description_html: str | None = None
    price_cents: int = Field(ge=0, default=0)
    sale_price_cents: int | None = Field(default=None, ge=0)
    currency: str = "EUR"
    tax_class: str = "standard"
    is_active: bool = True
    is_rfq_only: bool = False
    inner_diameter_mm: float | None = None
    outer_diameter_mm: float | None = None
    height_mm: float | None = None
    weight_g: int | None = None
    material: str | None = None
    oring_material: str | None = None
    hardness_hrc: str | None = None
    lifetime_hours: str | None = None
    warranty_months: int | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    # optional starting inventory
    stock_qty: int | None = Field(default=None, ge=0)


class ProductUpdateIn(BaseModel):
    """All optional — only provided fields are written."""

    sku: str | None = Field(default=None, min_length=1, max_length=120)
    name: str | None = Field(default=None, min_length=1, max_length=300)
    slug: str | None = None
    seal_type: SealType | None = None
    internal_code: str | None = None
    brand_id: int | None = None
    short_description: str | None = None
    description_html: str | None = None
    price_cents: int | None = Field(default=None, ge=0)
    sale_price_cents: int | None = Field(default=None, ge=0)
    currency: str | None = None
    tax_class: str | None = None
    is_active: bool | None = None
    is_rfq_only: bool | None = None
    inner_diameter_mm: float | None = None
    outer_diameter_mm: float | None = None
    height_mm: float | None = None
    weight_g: int | None = None
    material: str | None = None
    oring_material: str | None = None
    hardness_hrc: str | None = None
    lifetime_hours: str | None = None
    warranty_months: int | None = None
    seo_title: str | None = None
    seo_description: str | None = None


class InventoryIn(BaseModel):
    stock_qty: int = Field(ge=0)
    backorder: BackorderPolicy = BackorderPolicy.notify
    lead_time_days: int = Field(ge=0, default=3)
    warehouse: str = "DE"


# ------------------------------------------------------------------ brands ----
class BrandIn(BaseModel):
    slug: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=160)
    segment: Segment = Segment.aftermarket
    logo_url: str | None = None
    description: str | None = None


class BrandUpdateIn(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=120)
    name: str | None = Field(default=None, min_length=1, max_length=160)
    segment: Segment | None = None
    logo_url: str | None = None
    description: str | None = None


class BrandOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    name: str
    segment: Segment
    logo_url: str | None = None
    description: str | None = None
    product_count: int = 0


# -------------------------------------------------------------- categories ----
class CategoryIn(BaseModel):
    slug: str = Field(min_length=1, max_length=160)
    name: str = Field(min_length=1, max_length=160)
    parent_id: int | None = None
    segment: Segment | None = None
    description: str | None = None
    image_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    sort: int = 0


class CategoryUpdateIn(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=160)
    name: str | None = Field(default=None, min_length=1, max_length=160)
    parent_id: int | None = None
    segment: Segment | None = None
    description: str | None = None
    image_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    sort: int | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    name: str
    parent_id: int | None = None
    segment: Segment | None = None
    description: str | None = None
    image_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    sort: int = 0


# ------------------------------------------------------------------ orders ----
class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: uuid.UUID | None = None
    sku: str
    name: str
    qty: int
    unit_price_cents: int
    total_cents: int


class OrderAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    number: str
    email: str
    status: OrderStatus
    currency: str
    subtotal_cents: int
    discount_cents: int
    shipping_cents: int
    tax_cents: int
    total_cents: int
    payment_method: str = "invoice"
    paid_at: datetime | None = None
    shipping_address: dict | None = None
    billing_address: dict | None = None
    shipping_method: str | None = None
    customer_note: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    items: list[OrderItemOut] = []


class PagedOrders(BaseModel):
    items: list[OrderAdminOut]
    total: int
    page: int
    page_size: int


class OrderStatusIn(BaseModel):
    status: OrderStatus


# -------------------------------------------------------------------- rfqs ----
class RfqItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: uuid.UUID | None = None
    sku: str | None = None
    name: str | None = None
    qty: int
    target_price_cents: int | None = None
    note: str | None = None


class RfqAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    number: str
    email: str
    company: str | None = None
    vat_id: str | None = None
    country_code: str | None = None
    phone: str | None = None
    message: str | None = None
    status: RfqStatus
    created_at: datetime | None = None
    updated_at: datetime | None = None
    items: list[RfqItemOut] = []


class PagedRfqs(BaseModel):
    items: list[RfqAdminOut]
    total: int
    page: int
    page_size: int


class RfqStatusIn(BaseModel):
    status: RfqStatus


# ------------------------------------------------------------------ users ----
class UserAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str
    full_name: str | None = None
    phone: str | None = None
    company_name: str | None = None
    vat_id: str | None = None
    is_verified: bool
    is_admin: bool
    created_at: datetime | None = None
    order_count: int = 0
    rfq_count: int = 0


class PagedUsers(BaseModel):
    items: list[UserAdminOut]
    total: int
    page: int
    page_size: int


class UserUpdateIn(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    company_name: str | None = None
    vat_id: str | None = None
    is_verified: bool | None = None
    is_admin: bool | None = None


class PasswordResetIn(BaseModel):
    password: str = Field(min_length=8, max_length=128)


# ------------------------------------------------------ product sub-resources ----
class CrossRefIn(BaseModel):
    ref_number: str = Field(min_length=1, max_length=120)
    ref_brand: str | None = None
    note: str | None = None


class CrossRefOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ref_number: str
    ref_brand: str | None = None
    note: str | None = None


class ProductImageIn(BaseModel):
    url: str = Field(min_length=1, max_length=500)
    alt: str | None = None
    position: int = 0


class ProductImagePatchIn(BaseModel):
    url: str | None = Field(default=None, min_length=1, max_length=500)
    alt: str | None = None
    position: int | None = None


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    url: str
    alt: str | None = None
    position: int = 0


# --------------------------------------------------------- email settings ----
class SecretFingerprint(BaseModel):
    configured: bool
    length: int | None = None
    starts: str | None = None
    ends: str | None = None


class EmailSettingsOut(BaseModel):
    """Effective email/SMTP config, secrets masked (fingerprint only)."""

    provider: str
    effective_provider: str
    email_from: str
    email_from_name: str
    sales_email: str
    sendgrid_api_key: SecretFingerprint
    mailgun_api_key: SecretFingerprint
    mailgun_domain: str | None = None
    smtp_host: str | None = None
    smtp_port: int
    smtp_user: str | None = None
    smtp_password: SecretFingerprint
    smtp_starttls: bool
    smtp_ssl: bool


class SendTestEmailIn(BaseModel):
    to: str = Field(min_length=3, max_length=320)


class SendTestEmailOut(BaseModel):
    sent: bool
    provider: str


# --------------------------------------------------------------- dashboard ----
class DashboardStats(BaseModel):
    products_total: int
    products_active: int
    products_rfq_only: int
    out_of_stock: int
    low_stock: int
    brands_total: int
    categories_total: int
    orders_total: int
    orders_pending: int
    revenue_cents: int
    rfqs_total: int
    rfqs_new: int
    users_total: int = 0
