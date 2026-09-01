from app.config.settings import get_settings
from app.models.catalog import Product
from app.schemas.product import (
    BrandOut,
    CrossReferenceOut,
    ProductAttributeOut,
    ProductCardOut,
    ProductDetailOut,
    ProductImageOut,
)

settings = get_settings()


def _image_url(path: str) -> str:
    if path.startswith("http"):
        return path
    return settings.image_base_url.rstrip("/") + "/" + path.lstrip("/")


def to_card(product: Product) -> ProductCardOut:
    cover = product.images[0].url if product.images else None
    in_stock = product.inventory.stock_qty > 0 if product.inventory else True
    return ProductCardOut(
        id=product.id,
        slug=product.slug,
        sku=product.sku,
        name=product.name,
        seal_type=product.seal_type.value,
        price_cents=product.price_cents,
        sale_price_cents=product.sale_price_cents,
        currency=product.currency,
        in_stock=in_stock,
        image_url=_image_url(cover) if cover else None,
        brand=BrandOut.model_validate(product.brand) if product.brand else None,
    )


def to_detail(product: Product) -> ProductDetailOut:
    card = to_card(product)
    return ProductDetailOut(
        **card.model_dump(),
        short_description=product.short_description,
        description_html=product.description_html,
        internal_code=product.internal_code,
        inner_diameter_mm=product.inner_diameter_mm,
        outer_diameter_mm=product.outer_diameter_mm,
        height_mm=product.height_mm,
        material=product.material,
        oring_material=product.oring_material,
        hardness_hrc=product.hardness_hrc,
        lifetime_hours=product.lifetime_hours,
        warranty_months=product.warranty_months,
        images=[
            ProductImageOut(url=_image_url(img.url), alt=img.alt, position=img.position)
            for img in product.images
        ],
        attributes=[ProductAttributeOut.model_validate(a) for a in product.attributes],
        cross_references=[CrossReferenceOut.model_validate(c) for c in product.cross_references],
    )
