import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { api } from "../../lib/api";
import { Button } from "../../components/Button/Button";
import { IconClose } from "../../components/Icon/Icon";
import styles from "./Rfq.module.css";

interface RfqFormValues {
  email: string;
  company: string;
  vatId: string;
  countryCode: string;
  phone: string;
  message: string;
  items: { sku: string; qty: number; note: string }[];
}

export function Rfq() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<RfqFormValues>({
    defaultValues: { items: [{ sku: "", qty: 1, note: "" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(values: RfqFormValues) {
    setError(null);
    try {
      const res = await api.submitRfq({
        email: values.email,
        company: values.company || undefined,
        vat_id: values.vatId || undefined,
        country_code: values.countryCode || undefined,
        phone: values.phone || undefined,
        message: values.message || undefined,
        items: values.items.filter((i) => i.sku).map((i) => ({ sku: i.sku, qty: Number(i.qty), note: i.note || undefined })),
      });
      setSubmitted(res.number);
    } catch {
      setError("Could not submit your RFQ right now. Please try again or email sales@duo-cone.com.");
    }
  }

  if (submitted) {
    return (
      <div className={styles.page}>
        <h1>RFQ received</h1>
        <p>Your reference number is <strong>{submitted}</strong>. Our team replies within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>Request a Quote</h1>
      <p className={styles.lead}>Add one or more part numbers below. We'll reply with pricing and lead time within 24 hours.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.contact}>
          <label>Email<input type="email" required {...register("email", { required: true })} /></label>
          <label>Company<input {...register("company")} /></label>
          <label>VAT ID<input {...register("vatId")} /></label>
          <label>Country code<input maxLength={2} {...register("countryCode")} /></label>
          <label>Phone<input {...register("phone")} /></label>
        </div>

        <h2>Line items</h2>
        <table className={styles.table}>
          <thead><tr><th>SKU / OEM ref</th><th>Qty</th><th>Note</th><th /></tr></thead>
          <tbody>
            {fields.map((field, i) => (
              <tr key={field.id}>
                <td><input {...register(`items.${i}.sku` as const)} placeholder="e.g. 1210654" /></td>
                <td><input type="number" min={1} {...register(`items.${i}.qty` as const)} /></td>
                <td><input {...register(`items.${i}.note` as const)} placeholder="optional" /></td>
                <td><button type="button" className={styles.removeLine} onClick={() => remove(i)} aria-label="Remove line"><IconClose size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className={styles.addLine} onClick={() => append({ sku: "", qty: 1, note: "" })}>+ Add line</button>

        <label className={styles.messageLabel}>Message<textarea rows={4} {...register("message")} /></label>

        {error && <p className={styles.err}>{error}</p>}
        <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? "Submitting…" : "Submit RFQ"}</Button>
      </form>
    </div>
  );
}
