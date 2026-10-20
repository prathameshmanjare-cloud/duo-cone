// Page titles, descriptions and structured data, built from catalog data.
import type { ProductDetail } from "./api";
import { COMPANY } from "./company";

export const SITE_URL = "https://www.duo-cone.com";
export const SITE_NAME = "Duo Cone";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;
const SUFFIX = ` | ${SITE_NAME}`;

/** Collapses the double spaces some imported titles have ("Seal  Type  140"). */
export const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** Absolute canonical URL: always https://www…, trailing slash, no query. */
export function canonicalUrl(pathname: string) {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") + "/";
  return SITE_URL + (path === "//" ? "/" : path);
}

export const absoluteUrl = (url: string) => (/^https?:\/\//.test(url) ? url : SITE_URL + url);

function cut(s: string, max: number) {
  if (s.length <= max) return s;
  const head = s.slice(0, max - 1);
  return head.slice(0, Math.max(head.lastIndexOf(" "), max - 20)).replace(/[\s,.;:–-]+$/, "") + "…";
}

/** "<page> | Duo Cone", kept within 60 characters. */
export function pageTitle(page: string) {
  const t = clean(page);
  if (t.length + SUFFIX.length <= TITLE_MAX) return t + SUFFIX;
  return t.length <= TITLE_MAX ? t : cut(t, TITLE_MAX);
}

/** " – Page 2" for listing pages after the first, so every page title is unique. */
export const pageSuffix = (page?: string | number) => (Number(page) > 1 ? ` – Page ${Number(page)}` : "");

export const metaDescription = (s: string) => cut(clean(s), DESCRIPTION_MAX);

/** "<Product name> – <OEM part no.> | Duo Cone", without repeating the part
 *  number when the name already ends with it, within 60 characters. */
export function productTitle(p: Pick<ProductDetail, "name" | "sku">) {
  const name = clean(p.name);
  const sku = clean(p.sku);
  const base = sku && name.endsWith(sku) ? name.slice(0, -sku.length).trim() : name;
  const variants = [base, base.replace("Mechanical Face Seal", "Face Seal")];
  for (const b of variants) {
    const t = sku && !b.includes(sku) ? `${b} – ${sku}` : b;
    if (t.length + SUFFIX.length <= TITLE_MAX) return t + SUFFIX;
  }
  for (const b of variants) {
    const t = sku && !b.includes(sku) ? `${b} – ${sku}` : b;
    if (t.length <= TITLE_MAX) return t;
  }
  return cut(`${variants[1]} – ${sku}`, TITLE_MAX);
}

export const hasPrice = (p: Pick<ProductDetail, "price_cents" | "is_rfq_only">) =>
  !p.is_rfq_only && p.price_cents > 0;

const SEAL_TYPE: Record<string, string> = { DF: "DF type ", DO: "DO type " };

export function productDescription(p: ProductDetail) {
  const brand = p.brand?.name ?? "";
  const type = SEAL_TYPE[p.seal_type] ?? "";
  const price = hasPrice(p) ? "Order online" : "Price on request";
  return metaDescription(
    `${brand} ${type}mechanical face seal (floating seal, duo cone seal), OEM ref ${clean(p.sku)}. ` +
      `${price}, ships from Germany within 24 h. Quote within 24 h.`
  );
}

const ORG_ID = `${SITE_URL}/#organization`;

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE_NAME,
  legalName: "SAPPARTS Europe GmbH",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo.png`,
  email: COMPANY.email,
  telephone: COMPANY.phoneHref.replace("tel:", ""),
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY.street,
    postalCode: COMPANY.postcodeCity.split(" ")[0],
    addressLocality: COMPANY.postcodeCity.split(" ").slice(1).join(" "),
    addressCountry: "DE",
  },
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  publisher: { "@id": ORG_ID },
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/search/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const plainText = (html: string | null | undefined) =>
  clean((html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&"));

export function productJsonLd(p: ProductDetail, url: string) {
  const images = (p.images.length ? p.images.map((i) => i.url) : p.image_url ? [p.image_url] : []).map(absoluteUrl);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: clean(p.name),
    description: plainText(p.short_description || p.description_html) || clean(p.name),
    sku: clean(p.sku),
    mpn: clean(p.sku),
    url,
    image: images,
    category: "Mechanical face seals",
  };
  if (p.brand) data.brand = { "@type": "Brand", name: p.brand.name };
  // only real prices; price-on-request parts get no offer at all
  if (hasPrice(p)) {
    data.offers = {
      "@type": "Offer",
      url,
      priceCurrency: p.currency,
      price: ((p.sale_price_cents ?? p.price_cents) / 100).toFixed(2),
      availability: p.in_stock ? "https://schema.org/InStock" : "https://schema.org/BackOrder",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID },
    };
  }
  return data;
}

export function breadcrumbJsonLd(items: { label: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: clean(item.label),
      item: item.url,
    })),
  };
}

export type FaqItem = { q: string; a: string };

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: clean(item.q),
      acceptedAnswer: { "@type": "Answer", text: clean(item.a) },
    })),
  };
}
