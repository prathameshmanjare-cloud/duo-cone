import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productQuery, relatedQuery } from "../../lib/queries";
import { brandPath, segmentOfBrand, segmentPath } from "../../lib/catalog";
import { canonicalUrl, clean, hasPrice, productDescription, productJsonLd, productTitle } from "../../lib/seo";
import { Seo } from "../../components/Seo/Seo";
import { useCartStore } from "../../store/cart";
import { Price } from "../../components/Price/Price";
import { Button } from "../../components/Button/Button";
import { Breadcrumbs } from "../../components/Breadcrumbs/Breadcrumbs";
import { SpecTable } from "../../components/SpecTable/SpecTable";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { IconCheck, IconSeal } from "../../components/Icon/Icon";
import { placeholderWebp } from "../../lib/images";
import { CrossRefTable } from "../../components/CrossRefTable/CrossRefTable";
import styles from "./Product.module.css";

export function Product() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [imgOk, setImgOk] = useState(true);
  const add = useCartStore((s) => s.add);

  const { data: product, isLoading } = useQuery(productQuery(slug));

  const { data: related } = useQuery({ ...relatedQuery(slug), enabled: !!product });

  if (isLoading) return <div className={styles.page}>Loading…</div>;
  // a failed background refetch keeps the prerendered data on screen
  if (!product) {
    return (
      <div className={styles.page}>
        <EmptyState title="Product not found" description="It may be out of catalog or the link is outdated." action={<Link to="/shop/">Back to shop</Link>} />
      </div>
    );
  }

  const image = (product.images[activeImage]?.url ?? product.image_url) || null;
  const showImage = Boolean(image) && imgOk;
  const name = clean(product.name);
  const webp = placeholderWebp(image, true);
  const specRows: [string, string | number | null | undefined][] = [
    ["Hardness", product.hardness_hrc],
    ["Lifetime", product.lifetime_hours],
    ["Warranty", product.warranty_months ? `${product.warranty_months} months` : null],
    ...product.attributes.map((a) => [a.name, a.value] as [string, string]),
  ];
  const imageAlt = [product.brand?.name, product.seal_type !== "other" && `${product.seal_type} type`, "mechanical face seal", clean(product.sku)]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.page}>
      <Seo
        title={productTitle(product)}
        description={productDescription(product)}
        image={image}
        type="product"
        jsonLd={[productJsonLd(product, canonicalUrl(`/product/${product.slug}/`))]}
      />

      <Breadcrumbs
        items={[
          { label: "Shop", to: "/shop/" },
          ...(product.brand
            ? [
                {
                  label: segmentOfBrand(product.brand.slug) === "replacement" ? "Replacement" : "Aftermarket",
                  to: segmentPath(segmentOfBrand(product.brand.slug)),
                },
                { label: product.brand.name, to: brandPath(product.brand.slug) },
              ]
            : []),
          { label: product.name },
        ]}
      />

      <div className={styles.grid}>
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {showImage ? (
              <picture>
                {webp && <source type="image/webp" srcSet={webp} sizes="(max-width: 768px) 92vw, 480px" />}
                <img
                  src={image!}
                  alt={product.images[activeImage]?.alt || imageAlt}
                  width={480}
                  height={480}
                  fetchPriority="high"
                  onError={() => setImgOk(false)}
                />
              </picture>
            ) : (
              <div className={styles.placeholder}><IconSeal size={96} /></div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className={styles.thumbs}>
              {product.images.map((img, i) => (
                <button key={i} className={i === activeImage ? styles.thumbActive : ""} onClick={() => setActiveImage(i)}>
                  <img src={img.url} alt={img.alt ?? ""} width={64} height={64} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.buyBox}>
          {product.brand && <span className={styles.brand}>{product.brand.name}</span>}
          <h1>{name}</h1>
          <span className={styles.sku}>SKU / OEM ref: {product.sku}</span>

          {hasPrice(product) ? (
            <Price cents={product.price_cents} salePriceCents={product.sale_price_cents} currency={product.currency} />
          ) : (
            <span className={styles.onRequest}>Price on request</span>
          )}

          <div className={styles.stock}>
            {product.in_stock ? (
              <span className={styles.inStock}><IconCheck size={16} /> In stock. Ships within 24h from Germany</span>
            ) : (
              <span className={styles.oos}>Currently on backorder</span>
            )}
          </div>

          <div className={styles.buyRow}>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              aria-label="Quantity"
              className={styles.qtyInput}
            />
            <Button variant="primary" onClick={() => add(product, qty)} disabled={!product.in_stock}>
              Add to cart
            </Button>
            <Link to="/rfq/"><Button variant="ghost">Request quote</Button></Link>
          </div>

          <details open className={styles.accordion}>
            <summary>Shipping &amp; returns</summary>
            <p>Ships within 24 hours from our German warehouse. 24-month warranty on all seals. See our <Link to="/returns/">returns policy</Link>.</p>
          </details>
        </div>
      </div>

      <div className={styles.sticky}>
        <span>{name}</span>
        <Button variant="primary" onClick={() => add(product, qty)} disabled={!product.in_stock}>Add to cart</Button>
      </div>

      {specRows.some(([, v]) => v !== null && v !== undefined && v !== "") && (
        <section className={styles.section}>
          <h2>Specifications</h2>
          <SpecTable rows={specRows} />
        </section>
      )}

      <section className={styles.section}>
        <h2>OEM cross-reference</h2>
        <CrossRefTable brand={product.brand?.name} sku={product.sku} refs={product.cross_references} />
      </section>

      {product.description_html && (
        <section className={styles.section}>
          <h2>Description</h2>
          <div dangerouslySetInnerHTML={{ __html: product.description_html }} />
        </section>
      )}

      {related && related.length > 0 && (
        <section className={styles.section}>
          <h2>Related products</h2>
          <div className={styles.relatedGrid}>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
