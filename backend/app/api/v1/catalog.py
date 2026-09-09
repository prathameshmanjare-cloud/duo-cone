import uuid

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.catalog import MediaAsset
from app.repositories import product_repository as repo
from app.schemas.product import BrandOut, ProductCardOut
from app.services import product_service

router = APIRouter(tags=["catalog"])


@router.get("/media/{media_id}")
async def get_media(media_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Response:
    asset = await db.get(MediaAsset, media_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Media not found")
    return Response(
        content=asset.data,
        media_type=asset.content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@router.get("/brands", response_model=list[BrandOut])
async def list_brands(db: AsyncSession = Depends(get_db)) -> list[BrandOut]:
    brands = await repo.list_brands(db)
    return [BrandOut.model_validate(b) for b in brands]


@router.get("/cross-reference", response_model=list[ProductCardOut])
async def cross_reference(ref: str, db: AsyncSession = Depends(get_db)) -> list[ProductCardOut]:
    if not ref or len(ref) < 2:
        return []
    products = await repo.search_cross_reference(db, ref)
    return [product_service.to_card(p) for p in products]


@router.get("/search", response_model=list[ProductCardOut])
async def search(q: str, db: AsyncSession = Depends(get_db)) -> list[ProductCardOut]:
    if not q or len(q) < 2:
        return []
    filters = repo.ProductFilters(q=q, page=1, page_size=12)
    items, _ = await repo.list_products(db, filters)
    return [product_service.to_card(p) for p in items]
