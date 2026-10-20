"""Product URLs follow the old shop's rule, and a part can't be stored twice."""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError

from app.db.bootstrap import ensure_product_uniqueness
from app.db.session import SessionLocal
from app.models.catalog import Brand, Product, Segment
from app.utils.slug import part_key, product_slug


@pytest.mark.parametrize(
    ("title", "old_slug"),
    [
        # old duo-cone.com URLs still listed by Google
        ("SKF Mechanical Face Seal Type DF 108710", "skf-mechanical-face-seal-type-df-108710"),
        (
            "Goetze Mechanical Face Seal DO Type 76.90 H-25 76.97 H-25",
            "goetze-mechanical-face-seal-do-type-76-90-h-25-76-97-h-25",
        ),
        (
            "Caterpillar Metal Face Seal DO Type Group 462-6304 Seal Nr 154-3383",
            "caterpillar-metal-face-seal-do-type-group-462-6304-seal-nr-154-3383",
        ),
        ("Komatsu Mechanical Face Seal  Type  150.27.00025", "komatsu-mechanical-face-seal-type-150-27-00025"),
    ],
)
def test_product_slug_matches_old_shop_urls(title, old_slug):
    assert product_slug(title) == old_slug


def test_part_key_ignores_separators():
    assert part_key("140.30.00141") == part_key("140-30-00141") == part_key("140 30 00141")


async def _brand() -> Brand:
    async with SessionLocal() as db:
        b = Brand(slug=f"b-{uuid.uuid4().hex[:8]}", name="Test", segment=Segment.aftermarket)
        db.add(b)
        await db.commit()
        await db.refresh(b)
        return b


def _seal(brand: Brand, sku: str) -> Product:
    return Product(
        slug=f"p-{uuid.uuid4().hex[:8]}", sku=sku, name=f"Seal {sku}", brand_id=brand.id, price_cents=100
    )


async def test_same_part_cannot_be_stored_twice():
    brand = await _brand()
    async with SessionLocal() as db:
        db.add_all([_seal(brand, "140.30.00141"), _seal(brand, "140-30-00141")])
        await db.commit()

        # existing duplicates: the rule waits instead of failing startup
        assert await ensure_product_uniqueness(db) is False

        await db.execute(delete(Product).where(Product.sku == "140-30-00141"))
        await db.commit()
        assert await ensure_product_uniqueness(db) is True

        db.add(_seal(brand, "140 30 00141"))
        with pytest.raises(IntegrityError):
            await db.commit()
        await db.rollback()

        # same part number under another brand is a different part
        other = await _brand()
        db.add(_seal(other, "140.30.00141"))
        await db.commit()
