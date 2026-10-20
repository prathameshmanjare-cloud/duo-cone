import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { api } from "../../lib/api";
import { Button } from "../../components/Button/Button";
import { IconClose } from "../../components/Icon/Icon";
import styles from "./Rfq.module.css";
import { useDict } from "../../lib/i18n";
import { PageTitle } from "../../components/PageTitle/PageTitle";

interface RfqFormValues {
  email: string;
  company: string;
  vatId: string;
  countryCode: string;
  phone: string;
  message: string;
  items: { sku: string; qty: number; note: string }[];
  /** honeypot — must stay empty */
  website: string;
}

/** Pre-fill handed over by checkout when the destination is outside Europe. */
type RfqPrefill = Partial<Pick<RfqFormValues, "email" | "company" | "vatId" | "countryCode" | "items">>;

// German form texts (de pages: /de/anfrage/)
const DE_RFQ: Record<string, string> = {
  "Could not submit your RFQ right now. Please try again or email sale@duo-cone.com.": "Ihre Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie an sale@duo-cone.com.",
  "RFQ received": "Anfrage erhalten",
  "Request a Quote": "Angebot anfordern",
  "We don't take direct orders outside Europe. Your cart is below — send it and we'll reply with pricing, shipping and lead time within 24 hours.": "Außerhalb Europas nehmen wir keine Direktbestellungen an. Ihr Warenkorb steht unten – senden Sie ihn, und wir antworten innerhalb von 24 Stunden mit Preis, Versand und Lieferzeit.",
  "Add one or more part numbers below. We'll reply with pricing and lead time within 24 hours.": "Geben Sie eine oder mehrere Teilenummern ein. Wir antworten innerhalb von 24 Stunden mit Preis und Lieferzeit.",
  "Email": "E-Mail",
  "Company": "Firma",
  "VAT ID": "USt-IdNr.",
  "Country code": "Ländercode",
  "Phone": "Telefon",
  "Line items": "Positionen",
  "SKU / OEM ref": "Artikelnr. / OEM-Ref.",
  "Qty": "Menge",
  "Note": "Hinweis",
  "e.g. 1210654": "z. B. 1210654",
  "optional": "optional",
  "Remove line": "Position entfernen",
  "+ Add line": "+ Position hinzufügen",
  "Message": "Nachricht",
  "Submitting…": "Wird gesendet…",
  "Submit RFQ": "Anfrage senden",
  "Your reference number is": "Ihre Referenznummer lautet",
  "Our team replies within 24 hours.": "Unser Team antwortet innerhalb von 24 Stunden."
};

export function Rfq() {
  const L = useDict(DE_RFQ);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prefill = (useLocation().state ?? null) as RfqPrefill | null;
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<RfqFormValues>({
    defaultValues: {
      email: prefill?.email ?? "",
      company: prefill?.company ?? "",
      vatId: prefill?.vatId ?? "",
      countryCode: prefill?.countryCode ?? "",
      items: prefill?.items?.length ? prefill.items : [{ sku: "", qty: 1, note: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(values: RfqFormValues) {
    setError(null);
    if (values.website) return; // bot
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
      setError(L("Could not submit your RFQ right now. Please try again or email sale@duo-cone.com."));
    }
  }

  if (submitted) {
    return (
      <div className={styles.page}>
        <PageTitle title={L("RFQ received")} />
        <h1>{L("RFQ received")}</h1>
        <p>
          {L("Your reference number is")} <strong>{submitted}</strong>.{" "}
          {L("Our team replies within 24 hours.")}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageTitle title={L("Request a Quote")} />
      <h1>{L("Request a Quote")}</h1>
      <p className={styles.lead}>
        {prefill?.items?.length
          ? L("We don't take direct orders outside Europe. Your cart is below — send it and we'll reply with pricing, shipping and lead time within 24 hours.")
          : L("Add one or more part numbers below. We'll reply with pricing and lead time within 24 hours.")}
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className={styles.hp}
          aria-hidden="true"
          {...register("website")}
        />
        <div className={styles.contact}>
          <label>{L("Email")}<input type="email" required {...register("email", { required: true })} /></label>
          <label>{L("Company")}<input {...register("company")} /></label>
          <label>{L("VAT ID")}<input {...register("vatId")} /></label>
          <label>{L("Country code")}<input maxLength={2} {...register("countryCode")} /></label>
          <label>{L("Phone")}<input {...register("phone")} /></label>
        </div>

        <h2>{L("Line items")}</h2>
        <table className={styles.table}>
          <thead><tr><th>{L("SKU / OEM ref")}</th><th>{L("Qty")}</th><th>{L("Note")}</th><th /></tr></thead>
          <tbody>
            {fields.map((field, i) => (
              <tr key={field.id}>
                <td><input {...register(`items.${i}.sku` as const)} placeholder={L("e.g. 1210654")} /></td>
                <td><input type="number" min={1} {...register(`items.${i}.qty` as const)} /></td>
                <td><input {...register(`items.${i}.note` as const)} placeholder={L("optional")} /></td>
                <td><button type="button" className={styles.removeLine} onClick={() => remove(i)} aria-label={L("Remove line")}><IconClose size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className={styles.addLine} onClick={() => append({ sku: "", qty: 1, note: "" })}>{L("+ Add line")}</button>

        <label className={styles.messageLabel}>{L("Message")}<textarea rows={4} {...register("message")} /></label>

        {error && <p className={styles.err}>{error}</p>}
        <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? L("Submitting…") : L("Submit RFQ")}</Button>
      </form>
    </div>
  );
}
