import { Link, useT } from "../../lib/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "../../store/cart";
import { Price } from "../Price/Price";
import { Button } from "../Button/Button";
import { IconClose } from "../Icon/Icon";
import styles from "./CartDrawer.module.css";

export function CartDrawer() {
  const t = useT();
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
            aria-label={t({ en: "Shopping cart", de: "Warenkorb" })}
            onClick={(e) => e.stopPropagation()}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
        <div className={styles.header}>
          <h2>{t({ en: "Your cart", de: "Ihr Warenkorb" })}</h2>
          <button onClick={close} aria-label={t({ en: "Close cart", de: "Warenkorb schließen" })}><IconClose size={20} /></button>
        </div>

        {lines.length === 0 ? (
          <div className={styles.empty}>
            <p>{t({ en: "Your cart is empty.", de: "Ihr Warenkorb ist leer." })}</p>
            <Link to="/shop/" onClick={close}>{t({ en: "Browse products →", de: "Produkte ansehen →" })}</Link>
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
                        aria-label={t({ en: `Quantity for ${line.product.name}`, de: `Menge für ${line.product.name}` })}
                      />
                      <Price cents={line.product.price_cents} salePriceCents={line.product.sale_price_cents} />
                    </div>
                  </div>
                  <button className={styles.remove} onClick={() => remove(line.product.id)} aria-label={t({ en: `Remove ${line.product.name}`, de: `${line.product.name} entfernen` })}>
                    <IconClose size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.footer}>
              <div className={styles.subtotal}>
                <span>{t({ en: "Subtotal", de: "Zwischensumme" })}</span>
                <Price cents={subtotalCents()} />
              </div>
              <Link to="/cart" onClick={close}><Button variant="ghost" style={{ width: "100%" }}>{t({ en: "View cart", de: "Warenkorb ansehen" })}</Button></Link>
              <Link to="/checkout" onClick={close}><Button variant="primary" style={{ width: "100%" }}>{t({ en: "Checkout", de: "Zur Kasse" })}</Button></Link>
            </div>
          </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
