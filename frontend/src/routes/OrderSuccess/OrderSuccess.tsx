import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button } from "../../components/Button/Button";
import { Price } from "../../components/Price/Price";
import { IconCheck } from "../../components/Icon/Icon";
import styles from "./OrderSuccess.module.css";

export function OrderSuccess() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const paid = params.get("paid") === "1";

  // resolves for the signed-in owner (or admin); guests just see the generic
  // confirmation — the number + email is enough for support to look it up.
  const { data: order } = useQuery({
    queryKey: ["order", id, paid],
    // on a Stripe return, sync-payment confirms with Stripe directly (no auth,
    // works for guests, no webhook required); otherwise just read the order
    queryFn: () => (paid ? api.syncPayment(id!) : api.getOrder(id!)),
    enabled: Boolean(id),
    retry: false,
    // keep polling briefly if Stripe hasn't settled the payment yet
    refetchInterval: (q) =>
      paid && q.state.data && q.state.data.status !== "paid" ? 2500 : false,
  });

  return (
    <div className={styles.page}>
      <div className={styles.check} aria-hidden="true"><IconCheck size={32} /></div>
      <h1>{paid ? "Payment received" : "Order placed"}</h1>
      <p>
        {paid
          ? "Thank you — your card payment went through and your order is confirmed."
          : "Thank you. We've received your order."}
      </p>
      <p className={styles.orderNo}>Order reference: <strong>{order?.number ?? id}</strong></p>

      {order && (
        <div className={styles.summary}>
          <ul>
            {order.items.map((l) => (
              <li key={l.sku}>
                <span>{l.qty}× {l.name}</span>
                <Price cents={l.total_cents} currency={order.currency} />
              </li>
            ))}
          </ul>
          <div className={styles.total}>
            <span>Total (excl. VAT)</span>
            <Price cents={order.total_cents} currency={order.currency} />
          </div>
          {order.vat_reverse_charge && (
            <p className={styles.note}>VAT reverse-charge applies — invoiced net.</p>
          )}
          <p className={styles.note}>Status: {order.status}</p>
        </div>
      )}

      <p>A confirmation email is on its way. We'll notify you as soon as your seals ship (within 72 hours from Germany).</p>
      <div className={styles.actions}>
        <Link to="/shop"><Button variant="ghost">Continue shopping</Button></Link>
        <Link to="/contact"><Button variant="primary">Need help?</Button></Link>
      </div>
    </div>
  );
}
