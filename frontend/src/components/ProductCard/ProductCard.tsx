import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import type { ProductCard as ProductCardT } from "../../lib/api";
import { useCartStore } from "../../store/cart";
import { Price } from "../Price/Price";
import { Button } from "../Button/Button";
import { IconSeal } from "../Icon/Icon";
import styles from "./ProductCard.module.css";

export function ProductCard({ product }: { product: ProductCardT }) {
  const add = useCartStore((s) => s.add);
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={styles.card}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <Link to={`/product/${product.slug}`} className={styles.imageLink}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" width={280} height={280} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true"><IconSeal size={48} /></div>
        )}
        <span className={styles.typeTag}>{product.seal_type}</span>
      </Link>
      <div className={styles.body}>
        {product.brand && <span className={styles.brand}>{product.brand.name}</span>}
        <Link to={`/product/${product.slug}`} className={styles.name}>
          {product.name}
        </Link>
        <span className={styles.sku}>SKU: {product.sku}</span>
        <Price cents={product.price_cents} salePriceCents={product.sale_price_cents} currency={product.currency} />
        {!product.in_stock && <span className={styles.oos}>Out of stock — request lead time</span>}
        <Button
          variant="primary"
          className={styles.addBtn}
          disabled={!product.in_stock}
          onClick={() => add(product)}
        >
          Add to cart
        </Button>
      </div>
    </motion.div>
  );
}
