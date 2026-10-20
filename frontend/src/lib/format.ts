export function formatPrice(cents: number, currency = "EUR", lang: "en" | "de" = "en"): string {
  return new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-US", { style: "currency", currency }).format(cents / 100);
}
