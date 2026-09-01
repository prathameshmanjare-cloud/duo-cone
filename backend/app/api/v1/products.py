from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories import product_repository as repo
from app.schemas.product import PagedProducts, ProductCardOut, ProductDetailOut
from app.services import product_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=PagedProducts)
async def list_products(
    db: AsyncSession = Depends(get_db),
    segment: str | None = None,
    brand: str | None = Query(None, alias="brand"),
    category: str | None = Query(None, alias="category"),
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
) -> PagedProducts:
    filters = repo.ProductFilters(
        segment=segment,
        brand_slug=brand,
        category_slug=category,
        seal_type=seal_type,
        q=q,
        price_min=price_min,
        price_max=price_max,
        id_min=id_min,
        id_max=id_max,
        od_min=od_min,
        od_max=od_max,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    items, total = await repo.list_products(db, filters)
    return PagedProducts(
        items=[product_service.to_card(p) for p in items], total=total, page=page, page_size=page_size
    )


@router.get("/{slug}", response_model=ProductDetailOut)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)) -> ProductDetailOut:
    product = await repo.get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_service.to_detail(product)


@router.get("/{slug}/related", response_model=list[ProductCardOut])
async def get_related(slug: str, db: AsyncSession = Depends(get_db)) -> list[ProductCardOut]:
    product = await repo.get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    related = await repo.get_related_products(db, product)
    return [product_service.to_card(p) for p in related]
