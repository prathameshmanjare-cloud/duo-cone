import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useCartStore } from "../../store/cart";
import { Price } from "../../components/Price/Price";
import { Button } from "../../components/Button/Button";
import { Breadcrumbs } from "../../components/Breadcrumbs/Breadcrumbs";
import { SpecTable } from "../../components/SpecTable/SpecTable";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { IconCheck, IconSeal } from "../../components/Icon/Icon";
import styles from "./Product.module.css";

export function Product() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const add = useCartStore((s) => s.add);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.getProduct(slug),
  });

  const { data: related } = useQuery({
    queryKey: ["product-related", slug],
    queryFn: () => api.getRelated(slug),
    enabled: !!product,
  });

  if (isLoading) return <div className={styles.page}>Loading…</div>;
  if (isError || !product) {
    return (
      <div className={styles.page}>
        <EmptyState title="Product not found" description="It may be out of catalog or the link is outdated." action={<Link to="/shop">Back to shop</Link>} />
      </div>
    );
  }

  const image = product.images[activeImage]?.url ?? product.image_url;

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{product.name} | DuoCon</title>
        <meta name="description" content={product.short_description ?? product.name} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            sku: product.sku,
            image: image ? [image] : [],
            offers: {
              "@type": "Offer",
              priceCurrency: product.currency,
              price: (product.sale_price_cents ?? product.price_cents) / 100,
              availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
          })}
        </script>
      </Helmet>

      <Breadcrumbs
        items={[
          { label: "Shop", to: "/shop" },
          product.brand ? { label: product.brand.name, to: `/category/${product.brand.slug}` } : { label: "Product" },
          { label: product.name },
        ]}
      />

      <div className={styles.grid}>
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {image ? <img src={image} alt={product.name} width={480} height={480} /> : <div className={styles.placeholder}><IconSeal size={96} /></div>}
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
          <h1>{product.name}</h1>
          <span className={styles.sku}>SKU / OEM ref: {product.sku}</span>
          {product.internal_code && <span className={styles.code}>Internal code: {product.internal_code}</span>}

          <Price cents={product.price_cents} salePriceCents={product.sale_price_cents} currency={product.currency} />

          <div className={styles.stock}>
            {product.in_stock ? (
              <span className={styles.inStock}><IconCheck size={16} /> In stock — ships within 72h from Germany</span>
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
            <Link to="/rfq"><Button variant="ghost">Request quote</Button></Link>
          </div>

          <details open className={styles.accordion}>
            <summary>Shipping &amp; returns</summary>
            <p>Ships within 72 hours from our German warehouse. 24-month warranty on all seals. See our <Link to="/returns">returns policy</Link>.</p>
          </details>
        </div>
      </div>

      <div className={styles.sticky}>
        <span>{product.name}</span>
        <Button variant="primary" onClick={() => add(product, qty)} disabled={!product.in_stock}>Add to cart</Button>
      </div>

      <section className={styles.section}>
        <h2>Specifications</h2>
        <SpecTable
          rows={[
            ["Inner diameter", product.inner_diameter_mm ? `${product.inner_diameter_mm} mm` : null],
            ["Outer diameter", product.outer_diameter_mm ? `${product.outer_diameter_mm} mm` : null],
            ["Height", product.height_mm ? `${product.height_mm} mm` : null],
            ["Seal material", product.material],
            ["O-ring material", product.oring_material],
            ["Hardness", product.hardness_hrc],
            ["Lifetime", product.lifetime_hours],
            ["Warranty", product.warranty_months ? `${product.warranty_months} months` : null],
            ...product.attributes.map((a) => [a.name, a.value] as [string, string]),
          ]}
        />
      </section>

      {product.cross_references.length > 0 && (
        <section className={styles.section}>
          <h2>Cross-reference / equivalent OEM numbers</h2>
          <ul className={styles.crossList}>
            {product.cross_references.map((c, i) => (
              <li key={i}>{c.ref_brand ? `${c.ref_brand}: ` : ""}{c.ref_number}</li>
            ))}
          </ul>
        </section>
      )}

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
