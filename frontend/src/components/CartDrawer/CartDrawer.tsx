import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "../../store/cart";
import { Price } from "../Price/Price";
import { Button } from "../Button/Button";
import { IconClose } from "../Icon/Icon";
import styles from "./CartDrawer.module.css";

export function CartDrawer() {
  const { lines, isOpen, close, remove, setQty, subtotalCents } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          onClick={close}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            onClick={(e) => e.stopPropagation()}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
        <div className={styles.header}>
          <h2>Your cart</h2>
          <button onClick={close} aria-label="Close cart"><IconClose size={20} /></button>
        </div>

        {lines.length === 0 ? (
          <div className={styles.empty}>
            <p>Your cart is empty.</p>
            <Link to="/shop" onClick={close}>Browse products →</Link>
          </div>
        ) : (
          <>
            <ul className={styles.lines}>
              {lines.map((line) => (
                <li key={line.product.id} className={styles.line}>
                  {line.product.image_url && <img src={line.product.image_url} alt={line.product.name} width={64} height={64} />}
                  <div className={styles.lineBody}>
                    <span className={styles.lineName}>{line.product.name}</span>
                    <span className={styles.lineSku}>SKU: {line.product.sku}</span>
                    <div className={styles.lineRow}>
                      <input
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(e) => setQty(line.product.id, Number(e.target.value))}
                        aria-label={`Quantity for ${line.product.name}`}
                      />
                      <Price cents={line.product.price_cents} salePriceCents={line.product.sale_price_cents} />
                    </div>
                  </div>
                  <button className={styles.remove} onClick={() => remove(line.product.id)} aria-label={`Remove ${line.product.name}`}>
                    <IconClose size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.footer}>
              <div className={styles.subtotal}>
                <span>Subtotal</span>
                <Price cents={subtotalCents()} />
              </div>
              <Link to="/cart" onClick={close}><Button variant="ghost" style={{ width: "100%" }}>View cart</Button></Link>
              <Link to="/checkout" onClick={close}><Button variant="primary" style={{ width: "100%" }}>Checkout</Button></Link>
            </div>
          </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
