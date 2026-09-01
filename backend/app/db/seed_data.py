"""Idempotent demo seed data.

Runs automatically on startup when AUTO_SEED=true (needed on hosts without a
shell / one-off jobs, e.g. Render free tier). Safe to call repeatedly — it
no-ops once products exist.
"""

import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import Brand, Inventory, Product, ProductImage, SealType, Segment

logger = logging.getLogger("duocon.seed")

SAMPLE_PRODUCTS = [
    dict(
        sku="1210654", name="Benati Mechanical Face Seal DF Type 1210654", seal_type=SealType.DF,
        internal_code="175FL-NBR60", price_cents=8999, material="NI-HARD (ASTM A532)",
        oring_material="NBR", hardness_hrc="58-62", lifetime_hours="5,000-8,000", warranty_months=24,
        inner_diameter_mm=175, outer_diameter_mm=210, height_mm=32,
    ),
    dict(
        sku="2205080", name="Benati Mechanical Face Seal DO Type 2205080", seal_type=SealType.DO,
        internal_code="220FL-FKM65", price_cents=6999, material="SAE 52100", oring_material="FKM",
        hardness_hrc="58-62", lifetime_hours="5,000-8,000", warranty_months=24,
        inner_diameter_mm=220, outer_diameter_mm=260, height_mm=35,
    ),
    dict(
        sku="9W7228", name="Caterpillar Aftermarket Mechanical Face Seal DO Type 9W7228", seal_type=SealType.DO,
        internal_code="240FL-NBR60", price_cents=14999, material="NI-HARD (ASTM A532)", oring_material="NBR",
        hardness_hrc="58-62", lifetime_hours="6,000-9,000", warranty_months=24,
        inner_diameter_mm=240, outer_diameter_mm=285, height_mm=38,
    ),
]


async def ensure_seed_data(db: AsyncSession) -> None:
    count = (await db.execute(select(func.count()).select_from(Product))).scalar_one()
    if count:
        logger.info("Seed skipped — %d products already present", count)
        return

    benati = Brand(slug="benati", name="Benati", segment=Segment.aftermarket)
    cat = Brand(slug="caterpillar", name="Caterpillar", segment=Segment.aftermarket)
    db.add_all([benati, cat])
    await db.flush()

    for data in SAMPLE_PRODUCTS:
        slug = data["name"].lower().replace(" ", "-")
        brand = cat if "caterpillar" in slug else benati
        product = Product(slug=slug, brand_id=brand.id, currency="EUR", is_active=True, **data)
        db.add(product)
        await db.flush()
        db.add(ProductImage(product_id=product.id, url=f"products/{slug}/01.webp", alt=data["name"], position=0))
        db.add(Inventory(product_id=product.id, stock_qty=50))

    await db.commit()
    logger.info("Seeded %d demo products", len(SAMPLE_PRODUCTS))
