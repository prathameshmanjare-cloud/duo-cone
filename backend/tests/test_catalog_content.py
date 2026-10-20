"""Brand / category page text and the OEM cross-reference table data."""

from __future__ import annotations

import uuid

from app.db.session import SessionLocal
from app.models.catalog import Brand, Category, CrossReference, Product, Segment


async def _add(*rows):
    async with SessionLocal() as db:
        db.add_all(rows)
        await db.commit()
        for r in rows:
            await db.refresh(r)
    return rows


async def test_brand_page_text_is_sanitized_html(client):
    tag = uuid.uuid4().hex[:8]
    (brand,) = await _add(
        Brand(
            slug=f"acme-{tag}",
            name="Acme",
            segment=Segment.aftermarket,
            description="Seals for Acme loaders.\n\nSee <a href=\"https://x.test\">specs</a><script>alert(1)</script>",
        )
    )
    res = await client.get(f"/api/v1/brands/{brand.slug}")
    assert res.status_code == 200
    html = res.json()["description_html"]
    assert html.startswith("<p>Seals for Acme loaders.</p><p>See <a")
    assert "<script" not in html


async def test_brand_without_text_and_unknown_brand(client):
    tag = uuid.uuid4().hex[:8]
    (brand,) = await _add(Brand(slug=f"plain-{tag}", name="Plain", segment=Segment.replacement))
    assert (await client.get(f"/api/v1/brands/{brand.slug}")).json()["description_html"] is None
    assert (await client.get("/api/v1/brands/does-not-exist")).status_code == 404


async def test_category_text_is_sanitized(client):
    tag = uuid.uuid4().hex[:8]
    (cat,) = await _add(Category(slug=f"cat-{tag}", name="Cat", description='<p onclick="x()">Hi</p>'))
    res = await client.get(f"/api/v1/categories/{cat.slug}")
    assert res.json()["description"] == "<p>Hi</p>"


async def test_product_exposes_machine_models(client):
    tag = uuid.uuid4().hex[:8]
    (product,) = await _add(Product(slug=f"seal-{tag}", sku=f"S-{tag}", name="Seal", price_cents=100))
    await _add(
        CrossReference(product_id=product.id, ref_number="171-1189", ref_brand="Caterpillar", machine_models="D6R, D6T")
    )
    refs = (await client.get(f"/api/v1/products/{product.slug}")).json()["cross_references"]
    assert refs == [{"ref_number": "171-1189", "ref_brand": "Caterpillar", "machine_models": "D6R, D6T"}]
