"""Seed a handful of realistic DuoCon products for local dev / demo.

Usage: python -m scripts.seed
Requires `duocone` Postgres DB reachable via DATABASE_URL, tables created
(via Alembic migration or Base.metadata.create_all for quick local dev).
"""

import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.session import Base, SessionLocal, engine  # noqa: E402
from app.models.catalog import Brand, Inventory, Product, ProductImage, Segment, SealType  # noqa: E402


SAMPLE_PRODUCTS = [
    dict(sku="1210654", name="Benati Mechanical Face Seal DF Type 1210654", seal_type=SealType.DF,
         internal_code="175FL-NBR60", price_cents=8999, material="NI-HARD (ASTM A532)",
         oring_material="NBR", hardness_hrc="58-62", lifetime_hours="5,000-8,000", warranty_months=24,
         inner_diameter_mm=175, outer_diameter_mm=210, height_mm=32),
    dict(sku="2205080", name="Benati Mechanical Face Seal DO Type 2205080", seal_type=SealType.DO,
         internal_code="220FL-FKM65", price_cents=6999, material="SAE 52100", oring_material="FKM",
         hardness_hrc="58-62", lifetime_hours="5,000-8,000", warranty_months=24,
         inner_diameter_mm=220, outer_diameter_mm=260, height_mm=35),
    dict(sku="9W7228", name="Caterpillar Aftermarket Mechanical Face Seal DO Type 9W7228", seal_type=SealType.DO,
         internal_code="240FL-NBR60", price_cents=14999, material="NI-HARD (ASTM A532)", oring_material="NBR",
         hardness_hrc="58-62", lifetime_hours="6,000-9,000", warranty_months=24,
         inner_diameter_mm=240, outer_diameter_mm=285, height_mm=38),
]


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        brand = Brand(slug="benati", name="Benati", segment=Segment.aftermarket)
        cat_brand = Brand(slug="caterpillar", name="Caterpillar", segment=Segment.aftermarket)
        db.add_all([brand, cat_brand])
        await db.flush()

        for i, data in enumerate(SAMPLE_PRODUCTS):
            slug = data["name"].lower().replace(" ", "-")
            b = cat_brand if "caterpillar" in slug else brand
            product = Product(slug=slug, brand_id=b.id, currency="EUR", is_active=True, **data)
            db.add(product)
            await db.flush()
            db.add(ProductImage(product_id=product.id, url=f"products/{slug}/01.webp", alt=data["name"], position=0))
            db.add(Inventory(product_id=product.id, stock_qty=50))

        await db.commit()
    print(f"Seeded {len(SAMPLE_PRODUCTS)} products.")


if __name__ == "__main__":
    asyncio.run(seed())
