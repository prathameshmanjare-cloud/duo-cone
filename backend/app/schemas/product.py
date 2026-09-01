import uuid

from pydantic import BaseModel, ConfigDict


class BrandOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    name: str
    logo_url: str | None = None


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    url: str
    alt: str | None = None
    position: int


class ProductAttributeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
    value: str


class CrossReferenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    ref_number: str
    ref_brand: str | None = None


class ProductCardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    slug: str
    sku: str
    name: str
    seal_type: str
    price_cents: int
    sale_price_cents: int | None = None
    currency: str
    in_stock: bool = True
    image_url: str | None = None
    brand: BrandOut | None = None


class ProductDetailOut(ProductCardOut):
    short_description: str | None = None
    description_html: str | None = None
    internal_code: str | None = None
    inner_diameter_mm: float | None = None
    outer_diameter_mm: float | None = None
    height_mm: float | None = None
    material: str | None = None
    oring_material: str | None = None
    hardness_hrc: str | None = None
    lifetime_hours: str | None = None
    warranty_months: int | None = None
    images: list[ProductImageOut] = []
    attributes: list[ProductAttributeOut] = []
    cross_references: list[CrossReferenceOut] = []


class PagedProducts(BaseModel):
    items: list[ProductCardOut]
    total: int
    page: int
    page_size: int
