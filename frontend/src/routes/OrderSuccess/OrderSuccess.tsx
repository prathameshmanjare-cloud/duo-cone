import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { IconCheck } from "../../components/Icon/Icon";
import styles from "./OrderSuccess.module.css";

export function OrderSuccess() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className={styles.page}>
      <div className={styles.check} aria-hidden="true"><IconCheck size={32} /></div>
      <h1>Order placed</h1>
      <p>Thank you — we've received your order.</p>
      <p className={styles.orderNo}>Order reference: <strong>{id}</strong></p>
      <p>A confirmation email is on its way. We'll notify you as soon as your seals ship (within 72 hours from Germany).</p>
      <div className={styles.actions}>
        <Link to="/shop"><Button variant="ghost">Continue shopping</Button></Link>
        <Link to="/contact"><Button variant="primary">Need help?</Button></Link>
      </div>
    </div>
  );
}
