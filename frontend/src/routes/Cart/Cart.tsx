import { Link } from "react-router-dom";
import { useCartStore } from "../../store/cart";
import { Price } from "../../components/Price/Price";
import { Button } from "../../components/Button/Button";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import styles from "./Cart.module.css";

export function Cart() {
  const { lines, remove, setQty, subtotalCents } = useCartStore();

  if (lines.length === 0) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Your cart is empty"
          description="Browse our seal catalog or use the cross-reference tool to find your part."
          action={<Link to="/shop"><Button>Browse products</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>Your cart</h1>
      <div className={styles.layout}>
        <ul className={styles.lines}>
          {lines.map((line) => (
            <li key={line.product.id} className={styles.line}>
              {line.product.image_url && <img src={line.product.image_url} alt={line.product.name} width={96} height={96} />}
              <div className={styles.body}>
                <Link to={`/product/${line.product.slug}`}>{line.product.name}</Link>
                <span className={styles.sku}>SKU: {line.product.sku}</span>
                <Price cents={line.product.price_cents} salePriceCents={line.product.sale_price_cents} />
              </div>
              <input
                type="number"
                min={1}
                value={line.qty}
                onChange={(e) => setQty(line.product.id, Number(e.target.value))}
                aria-label={`Quantity for ${line.product.name}`}
              />
              <button onClick={() => remove(line.product.id)} aria-label={`Remove ${line.product.name}`}>Remove</button>
            </li>
          ))}
        </ul>
        <aside className={styles.summary}>
          <h2>Order summary</h2>
          <div className={styles.row}><span>Subtotal</span><Price cents={subtotalCents()} /></div>
          <p className={styles.note}>VAT and shipping calculated at checkout.</p>
          <Link to="/checkout"><Button variant="primary" style={{ width: "100%" }}>Proceed to checkout</Button></Link>
        </aside>
      </div>
    </div>
  );
}
