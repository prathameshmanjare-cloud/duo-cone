import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Segment(str, enum.Enum):
    aftermarket = "aftermarket"
    replacement = "replacement"
    oem = "oem"


class SealType(str, enum.Enum):
    DF = "DF"
    DO = "DO"
    other = "other"


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    segment: Mapped[Segment] = mapped_column(Enum(Segment, name="segment"))
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    products: Mapped[list["Product"]] = relationship(back_populates="brand")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    segment: Mapped[Segment | None] = mapped_column(Enum(Segment, name="segment"), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    seo_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    sort: Mapped[int] = mapped_column(Integer, default=0)
    woo_id: Mapped[int | None] = mapped_column(Integer, nullable=True, unique=True)

    parent: Mapped["Category | None"] = relationship(remote_side=[id])


class ProductCategory(Base):
    __tablename__ = "product_categories"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), primary_key=True
    )
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), primary_key=True)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    woo_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True)
    sku: Mapped[str] = mapped_column(String(120), index=True)  # OEM reference number
    name: Mapped[str] = mapped_column(String(300))
    seal_type: Mapped[SealType] = mapped_column(Enum(SealType, name="seal_type"), default=SealType.other)
    internal_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    brand_id: Mapped[int | None] = mapped_column(ForeignKey("brands.id"), nullable=True)
    short_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description_html: Mapped[str | None] = mapped_column(Text, nullable=True)

    price_cents: Mapped[int] = mapped_column(Integer)
    sale_price_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    tax_class: Mapped[str] = mapped_column(String(40), default="standard")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_rfq_only: Mapped[bool] = mapped_column(Boolean, default=False)

    inner_diameter_mm: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    outer_diameter_mm: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    height_mm: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    weight_g: Mapped[int | None] = mapped_column(Integer, nullable=True)
    material: Mapped[str | None] = mapped_column(String(160), nullable=True)
    oring_material: Mapped[str | None] = mapped_column(String(160), nullable=True)
    hardness_hrc: Mapped[str | None] = mapped_column(String(40), nullable=True)
    lifetime_hours: Mapped[str | None] = mapped_column(String(80), nullable=True)
    warranty_months: Mapped[int | None] = mapped_column(Integer, nullable=True)

    rating_avg: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)

    seo_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(320), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    brand: Mapped["Brand | None"] = relationship(back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product", order_by="ProductImage.position"
    )
    attributes: Mapped[list["ProductAttribute"]] = relationship(back_populates="product")
    cross_references: Mapped[list["CrossReference"]] = relationship(back_populates="product")
    inventory: Mapped["Inventory | None"] = relationship(back_populates="product", uselist=False)


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"))
    url: Mapped[str] = mapped_column(String(500))
    alt: Mapped[str | None] = mapped_column(String(300), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)

    product: Mapped["Product"] = relationship(back_populates="images")


class ProductAttribute(Base):
    __tablename__ = "product_attributes"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"))
    name: Mapped[str] = mapped_column(String(160))
    value: Mapped[str] = mapped_column(String(500))
    position: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped["Product"] = relationship(back_populates="attributes")


class CrossReference(Base):
    __tablename__ = "cross_references"
    __table_args__ = (UniqueConstraint("product_id", "ref_number", name="uq_product_ref"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"))
    ref_number: Mapped[str] = mapped_column(String(120), index=True)
    ref_brand: Mapped[str | None] = mapped_column(String(160), nullable=True)
    note: Mapped[str | None] = mapped_column(String(300), nullable=True)

    product: Mapped["Product"] = relationship(back_populates="cross_references")


class BackorderPolicy(str, enum.Enum):
    no = "no"
    notify = "notify"
    yes = "yes"


class Inventory(Base):
    __tablename__ = "inventory"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), primary_key=True
    )
    stock_qty: Mapped[int] = mapped_column(Integer, default=0)
    backorder: Mapped[BackorderPolicy] = mapped_column(
        Enum(BackorderPolicy, name="backorder_policy"), default=BackorderPolicy.notify
    )
    lead_time_days: Mapped[int] = mapped_column(Integer, default=3)
    warehouse: Mapped[str] = mapped_column(String(80), default="DE")

    product: Mapped["Product"] = relationship(back_populates="inventory")
