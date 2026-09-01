from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories import product_repository as repo

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("")
async def list_categories(db: AsyncSession = Depends(get_db)):
    cats = await repo.list_categories(db)
    return [
        {"id": c.id, "slug": c.slug, "name": c.name, "parent_id": c.parent_id, "image_url": c.image_url}
        for c in cats
    ]


@router.get("/{slug}")
async def get_category(slug: str, db: AsyncSession = Depends(get_db)):
    cat = await repo.get_category_by_slug(db, slug)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return {
        "id": cat.id,
        "slug": cat.slug,
        "name": cat.name,
        "description": cat.description,
        "image_url": cat.image_url,
    }
