import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import type { ProductCard as ProductCardT } from "../../lib/api";
import { useCartStore } from "../../store/cart";
import { Price } from "../Price/Price";
import { IconSeal, IconArrowRight, IconCheck } from "../Icon/Icon";
import { placeholderWebp } from "../../lib/images";
import { clean } from "../../lib/seo";
import styles from "./ProductCard.module.css";

export function ProductCard({ product }: { product: ProductCardT }) {
  const add = useCartStore((s) => s.add);
  const reduce = useReducedMotion();
  const [imgOk, setImgOk] = useState(true);
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const showImage = Boolean(product.image_url) && imgOk;

  function onAdd() {
    add(product);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1600);
  }

  const webp = placeholderWebp(product.image_url);

  return (
    <motion.article
      className={styles.card}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {/* same target as the name link below: kept out of the tab order and
          screen readers so the product is announced once */}
      <Link to={`/product/${product.slug}/`} className={styles.media} tabIndex={-1} aria-hidden="true">
        <span className={styles.mediaBg} aria-hidden="true" />
        {showImage ? (
          <picture>
            {webp && <source type="image/webp" srcSet={webp} sizes="280px" />}
            <img
              src={product.image_url!}
              alt={clean(product.name)}
              loading="lazy"
              width={280}
              height={280}
              className={styles.image}
              onError={() => setImgOk(false)}
            />
          </picture>
        ) : (
          <span className={styles.placeholder} aria-hidden="true">
            <IconSeal size={54} />
          </span>
        )}

        <span className={styles.typeTag}>{product.seal_type}</span>
        <span
          className={`${styles.stock} ${product.in_stock ? styles.inStock : styles.outStock}`}
        >
          {product.in_stock ? "In stock" : "Lead time"}
        </span>

        <span className={styles.view}>
          View details <IconArrowRight size={14} />
        </span>
      </Link>

      <div className={styles.body}>
        {product.brand && <span className={styles.brand}>{product.brand.name}</span>}
        <Link to={`/product/${product.slug}/`} className={styles.name}>
          {clean(product.name)}
        </Link>
        <span className={styles.sku}>{product.sku}</span>

        <div className={styles.priceRow}>
          {product.is_rfq_only ? (
            <span className={styles.onRequest}>Price on request</span>
          ) : (
            <>
              <Price
                cents={product.price_cents}
                salePriceCents={product.sale_price_cents}
                currency={product.currency}
              />
              <span className={styles.vat}>excl. VAT</span>
            </>
          )}
        </div>

        {product.is_rfq_only ? (
          <Link to="/rfq/" className={`${styles.addBtn} ${styles.quoteBtn}`}>
            Request a quote <IconArrowRight size={15} />
          </Link>
        ) : (
          <button
            type="button"
            className={`${styles.addBtn} ${added ? styles.addedBtn : ""}`}
            disabled={!product.in_stock}
            onClick={onAdd}
          >
            {added ? (
              <>
                <IconCheck size={16} /> Added
              </>
            ) : product.in_stock ? (
              "Add to cart"
            ) : (
              "Request lead time"
            )}
          </button>
        )}
      </div>
    </motion.article>
  );
}
