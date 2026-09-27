import bleach

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

# generic per-type artwork served from the frontend's /public folder
_DEFAULT_IMAGE = {
    "DF": "/product-images/df.png",
    "DO": "/product-images/do.png",
    "other": "/product-images/df.png",
}


# product copy comes from the CMS and WooCommerce imports and is rendered as
# raw HTML on the storefront — strip anything that could run script
_ALLOWED_TAGS = {
    "a", "abbr", "b", "blockquote", "br", "code", "div", "em", "h2", "h3", "h4",
    "h5", "h6", "hr", "i", "img", "li", "ol", "p", "pre", "small", "span",
    "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead",
    "tr", "u", "ul",
}
_ALLOWED_ATTRS = {
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "title", "width", "height"],
    "td": ["colspan", "rowspan"],
    "th": ["colspan", "rowspan", "scope"],
}


def sanitize_html(raw: str | None) -> str | None:
    if not raw:
        return raw
    return bleach.clean(
        raw,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRS,
        protocols={"http", "https", "mailto"},
        strip=True,
    )


def _image_url(path: str) -> str:
    if path.startswith(("http", "/")):
        return path
    return settings.image_base_url.rstrip("/") + "/" + path.lstrip("/")


def to_card(product: Product) -> ProductCardOut:
    cover = (
        product.images[0].url
        if product.images
        else _DEFAULT_IMAGE.get(product.seal_type.value)
    )
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
        is_rfq_only=product.is_rfq_only,
        image_url=_image_url(cover) if cover else None,
        brand=BrandOut.model_validate(product.brand) if product.brand else None,
    )


def to_detail(product: Product) -> ProductDetailOut:
    card = to_card(product)
    return ProductDetailOut(
        **card.model_dump(),
        short_description=product.short_description,
        description_html=sanitize_html(product.description_html),
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
