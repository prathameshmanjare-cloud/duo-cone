import { useState } from "react";
import { useParams } from "react-router-dom";
import { Link, localize, useLang, useT } from "../../lib/i18n";
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
import { deDescriptionHtml, deShortDescription, productName } from "../../lib/productText";
import styles from "./Product.module.css";

export function Product() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [imgOk, setImgOk] = useState(true);
  const add = useCartStore((s) => s.add);
  const t = useT();
  const lang = useLang();

  const { data: product, isLoading } = useQuery(productQuery(slug));

  const { data: related } = useQuery({ ...relatedQuery(slug), enabled: !!product });

  if (isLoading) return <div className={styles.page}>{t({ en: "Loading…", de: "Wird geladen…" })}</div>;
  // a failed background refetch keeps the prerendered data on screen
  if (!product) {
    return (
      <div className={styles.page}>
        <EmptyState
          title={t({ en: "Product not found", de: "Produkt nicht gefunden" })}
          description={t({ en: "It may be out of catalog or the link is outdated.", de: "Der Artikel ist nicht mehr im Sortiment oder der Link ist veraltet." })}
          action={<Link to="/shop/">{t({ en: "Back to shop", de: "Zurück zum Shop" })}</Link>}
        />
      </div>
    );
  }

  const image = (product.images[activeImage]?.url ?? product.image_url) || null;
  const showImage = Boolean(image) && imgOk;
  const name = productName(product.name, lang);
  const descriptionHtml = lang === "de" ? (deDescriptionHtml(product.description_html) ?? product.description_html) : product.description_html;
  const webp = placeholderWebp(image, true);
  const specRows: [string, string | number | null | undefined][] = [
    [t({ en: "Hardness", de: "Härte" }), product.hardness_hrc],
    [t({ en: "Lifetime", de: "Lebensdauer" }), product.lifetime_hours],
    [t({ en: "Warranty", de: "Gewährleistung" }), product.warranty_months ? t({ en: `${product.warranty_months} months`, de: `${product.warranty_months} Monate` }) : null],
    ...product.attributes.map((a) => [a.name, a.value] as [string, string]),
  ];
  const imageAlt = [product.brand?.name, product.seal_type !== "other" && t({ en: `${product.seal_type} type`, de: `Typ ${product.seal_type}` }), t({ en: "mechanical face seal", de: "Laufwerksdichtung" }), clean(product.sku)]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.page}>
      <Seo
        title={productTitle({ name, sku: product.sku })}
        description={productDescription(product, lang)}
        image={image}
        type="product"
        jsonLd={[
          productJsonLd(
            product,
            canonicalUrl(localize(`/product/${product.slug}/`, lang)),
            lang === "de"
              ? {
                  name,
                  description: deShortDescription(product.short_description) ?? name,
                  category: "Laufwerksdichtungen",
                }
              : undefined
          ),
        ]}
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
          { label: name },
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
          <span className={styles.sku}>{t({ en: "SKU / OEM ref:", de: "Artikelnr. / OEM-Ref.:" })} {product.sku}</span>

          {hasPrice(product) ? (
            <Price cents={product.price_cents} salePriceCents={product.sale_price_cents} currency={product.currency} />
          ) : (
            <span className={styles.onRequest}>{t({ en: "Price on request", de: "Preis auf Anfrage" })}</span>
          )}

          <div className={styles.stock}>
            {product.in_stock ? (
              <span className={styles.inStock}><IconCheck size={16} /> {t({ en: "In stock. Ships within 24h from Germany", de: "Auf Lager. Versand innerhalb von 24 h ab Deutschland" })}</span>
            ) : (
              <span className={styles.oos}>{t({ en: "Currently on backorder", de: "Derzeit nicht vorrätig – Lieferzeit auf Anfrage" })}</span>
            )}
          </div>

          <div className={styles.buyRow}>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              aria-label={t({ en: "Quantity", de: "Menge" })}
              className={styles.qtyInput}
            />
            <Button variant="primary" onClick={() => add(product, qty)} disabled={!product.in_stock}>
              {t({ en: "Add to cart", de: "In den Warenkorb" })}
            </Button>
            <Link to="/rfq/"><Button variant="ghost">{t({ en: "Request quote", de: "Angebot anfordern" })}</Button></Link>
          </div>

          <details open className={styles.accordion}>
            <summary>{t({ en: "Shipping & returns", de: "Versand & Rückgabe" })}</summary>
            <p>
              {t({
                en: "Ships within 24 hours from our German warehouse. 24-month warranty on all seals. See our ",
                de: "Versand innerhalb von 24 Stunden aus unserem Lager in Deutschland. 24 Monate Gewährleistung auf alle Dichtungen. Siehe unsere ",
              })}
              <Link to="/returns/">{t({ en: "returns policy", de: "Rückgaberegelung" })}</Link>.
            </p>
          </details>
        </div>
      </div>

      <div className={styles.sticky}>
        <span>{name}</span>
        <Button variant="primary" onClick={() => add(product, qty)} disabled={!product.in_stock}>{t({ en: "Add to cart", de: "In den Warenkorb" })}</Button>
      </div>

      {specRows.some(([, v]) => v !== null && v !== undefined && v !== "") && (
        <section className={styles.section}>
          <h2>{t({ en: "Specifications", de: "Technische Daten" })}</h2>
          <SpecTable rows={specRows} />
        </section>
      )}

      <section className={styles.section}>
        <h2>{t({ en: "OEM cross-reference", de: "OEM-Vergleichsnummern" })}</h2>
        <CrossRefTable brand={product.brand?.name} sku={product.sku} refs={product.cross_references} />
      </section>

      {descriptionHtml && (
        <section className={styles.section}>
          <h2>{t({ en: "Description", de: "Beschreibung" })}</h2>
          <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
        </section>
      )}

      {related && related.length > 0 && (
        <section className={styles.section}>
          <h2>{t({ en: "Related products", de: "Ähnliche Produkte" })}</h2>
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
