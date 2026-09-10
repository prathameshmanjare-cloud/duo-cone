import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useCartStore } from "../../store/cart";
import { useSession } from "../../store/session";
import { api, ApiError } from "../../lib/api";
import { Price } from "../../components/Price/Price";
import { Button } from "../../components/Button/Button";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import styles from "./Checkout.module.css";

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  company: z.string().optional(),
  vatId: z.string().optional(),
  address1: z.string().min(3),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  countryCode: z.string().min(2).max(2),
  terms: z.literal(true, { message: "You must accept the terms" }),
});

type FormValues = z.infer<typeof schema>;

export function Checkout() {
  const { lines, subtotalCents, clear } = useCartStore();
  const navigate = useNavigate();
  const status = useSession((s) => s.status);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (status === "idle" || status === "loading") {
    return <div className={styles.page}>Loading…</div>;
  }
  if (status !== "authed") {
    return <Navigate to="/login?next=/checkout" replace />;
  }
  if (lines.length === 0) {
    return (
      <div className={styles.page}>
        <EmptyState title="Nothing to check out" description="Your cart is empty." action={<Link to="/shop">Browse products</Link>} />
      </div>
    );
  }

  async function onSubmit(v: FormValues) {
    setSubmitError(null);
    try {
      const order = await api.createOrder({
        email: v.email,
        vat_id: v.vatId || undefined,
        shipping_address: {
          name: v.fullName,
          company: v.company || undefined,
          line1: v.address1,
          city: v.city,
          postal_code: v.postalCode,
          country_code: v.countryCode.toUpperCase(),
        },
        items: lines.map((l) => ({
          product_id: l.product.id,
          sku: l.product.sku,
          name: l.product.name,
          qty: l.qty,
          unit_price_cents: l.product.sale_price_cents ?? l.product.price_cents,
        })),
        terms_accepted: v.terms,
      });
      clear();
      navigate(`/order-success/${order.number}`);
    } catch (e) {
      setSubmitError(
        e instanceof ApiError
          ? e.message
          : "Could not place the order. Please try again or email sales@duo-cone.com.",
      );
    }
  }

  return (
    <div className={styles.page}>
      <h1>Checkout</h1>
      <form className={styles.layout} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.fields}>
          <section>
            <h2>Contact</h2>
            <label>Email<input type="email" {...register("email")} />{errors.email && <span className={styles.err}>{errors.email.message}</span>}</label>
          </section>
          <section>
            <h2>Shipping address</h2>
            <label>Full name<input {...register("fullName")} />{errors.fullName && <span className={styles.err}>{errors.fullName.message}</span>}</label>
            <label>Company (optional)<input {...register("company")} /></label>
            <label>EU VAT ID (optional, reverse charge)<input {...register("vatId")} /></label>
            <label>Address<input {...register("address1")} />{errors.address1 && <span className={styles.err}>{errors.address1.message}</span>}</label>
            <div className={styles.row2}>
              <label>City<input {...register("city")} /></label>
              <label>Postal code<input {...register("postalCode")} /></label>
            </div>
            <label>Country code (e.g. DE)<input maxLength={2} {...register("countryCode")} /></label>
          </section>
          <label className={styles.terms}>
            <input type="checkbox" {...register("terms")} /> I accept the <Link to="/terms">terms &amp; conditions</Link>
          </label>
          {errors.terms && <span className={styles.err}>{errors.terms.message}</span>}
        </div>

        <aside className={styles.summary}>
          <h2>Order summary</h2>
          <ul>
            {lines.map((l) => (
              <li key={l.product.id}>{l.qty}× {l.product.name}</li>
            ))}
          </ul>
          <div className={styles.row}><span>Subtotal</span><Price cents={subtotalCents()} /></div>
          <p className={styles.note}>Payment by invoice (net 30) for verified B2B accounts, or card at delivery.</p>
          {submitError && <p className={styles.err}>{submitError}</p>}
          <Button type="submit" variant="primary" style={{ width: "100%" }} disabled={isSubmitting}>
            {isSubmitting ? "Placing order…" : "Place order"}
          </Button>
        </aside>
      </form>
    </div>
  );
}
