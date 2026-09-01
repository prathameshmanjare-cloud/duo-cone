from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.catalog import Brand, Category, CrossReference, Product, ProductCategory


class ProductFilters:
    def __init__(
        self,
        segment: str | None = None,
        brand_slug: str | None = None,
        category_slug: str | None = None,
        seal_type: str | None = None,
        q: str | None = None,
        price_min: int | None = None,
        price_max: int | None = None,
        id_min: float | None = None,
        id_max: float | None = None,
        od_min: float | None = None,
        od_max: float | None = None,
        sort: str = "relevance",
        page: int = 1,
        page_size: int = 24,
    ) -> None:
        self.segment = segment
        self.brand_slug = brand_slug
        self.category_slug = category_slug
        self.seal_type = seal_type
        self.q = q
        self.price_min = price_min
        self.price_max = price_max
        self.id_min = id_min
        self.id_max = id_max
        self.od_min = od_min
        self.od_max = od_max
        self.sort = sort
        self.page = page
        self.page_size = page_size


async def list_products(db: AsyncSession, filters: ProductFilters) -> tuple[list[Product], int]:
    stmt = select(Product).where(Product.is_active.is_(True)).options(
        selectinload(Product.brand), selectinload(Product.images), selectinload(Product.inventory)
    )

    if filters.brand_slug:
        stmt = stmt.join(Brand).where(Brand.slug == filters.brand_slug)
    if filters.category_slug:
        stmt = stmt.join(ProductCategory, ProductCategory.product_id == Product.id).join(
            Category, Category.id == ProductCategory.category_id
        ).where(Category.slug == filters.category_slug)
    if filters.seal_type:
        stmt = stmt.where(Product.seal_type == filters.seal_type)
    if filters.q:
        like = f"%{filters.q}%"
        stmt = stmt.where((Product.name.ilike(like)) | (Product.sku.ilike(like)))
    if filters.price_min is not None:
        stmt = stmt.where(Product.price_cents >= filters.price_min)
    if filters.price_max is not None:
        stmt = stmt.where(Product.price_cents <= filters.price_max)
    if filters.id_min is not None:
        stmt = stmt.where(Product.inner_diameter_mm >= filters.id_min)
    if filters.id_max is not None:
        stmt = stmt.where(Product.inner_diameter_mm <= filters.id_max)
    if filters.od_min is not None:
        stmt = stmt.where(Product.outer_diameter_mm >= filters.od_min)
    if filters.od_max is not None:
        stmt = stmt.where(Product.outer_diameter_mm <= filters.od_max)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    if filters.sort == "price_asc":
        stmt = stmt.order_by(Product.price_cents.asc())
    elif filters.sort == "price_desc":
        stmt = stmt.order_by(Product.price_cents.desc())
    elif filters.sort == "latest":
        stmt = stmt.order_by(Product.created_at.desc())
    else:
        stmt = stmt.order_by(Product.name.asc())

    stmt = stmt.offset((filters.page - 1) * filters.page_size).limit(filters.page_size)
    rows = (await db.execute(stmt)).scalars().unique().all()
    return list(rows), total


async def get_product_by_slug(db: AsyncSession, slug: str) -> Product | None:
    stmt = (
        select(Product)
        .where(Product.slug == slug)
        .options(
            selectinload(Product.brand),
            selectinload(Product.images),
            selectinload(Product.attributes),
            selectinload(Product.cross_references),
            selectinload(Product.inventory),
        )
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def get_related_products(db: AsyncSession, product: Product, limit: int = 4) -> list[Product]:
    stmt = (
        select(Product)
        .where(Product.brand_id == product.brand_id, Product.id != product.id, Product.is_active.is_(True))
        .options(selectinload(Product.brand), selectinload(Product.images), selectinload(Product.inventory))
        .limit(limit)
    )
    return list((await db.execute(stmt)).scalars().unique().all())


async def search_cross_reference(db: AsyncSession, ref: str) -> list[Product]:
    like = f"%{ref}%"
    stmt = (
        select(Product)
        .join(CrossReference, CrossReference.product_id == Product.id)
        .where((CrossReference.ref_number.ilike(like)) | (Product.sku.ilike(like)))
        .options(selectinload(Product.brand), selectinload(Product.images), selectinload(Product.inventory))
        .limit(20)
    )
    return list((await db.execute(stmt)).scalars().unique().all())


async def list_brands(db: AsyncSession) -> list[Brand]:
    return list((await db.execute(select(Brand).order_by(Brand.name))).scalars().all())


async def list_categories(db: AsyncSession) -> list[Category]:
    return list((await db.execute(select(Category).order_by(Category.sort))).scalars().all())


async def get_category_by_slug(db: AsyncSession, slug: str) -> Category | None:
    return (await db.execute(select(Category).where(Category.slug == slug))).scalar_one_or_none()
