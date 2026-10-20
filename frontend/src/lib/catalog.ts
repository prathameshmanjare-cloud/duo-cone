// Catalog segments, the brands in each, and their public URLs. URLs follow
// the old WooCommerce shop (/product-category/<segment>/<brand>/) so links
// Google already ranks keep working.

export type SegmentSlug = "replacement" | "aftermarket";

const brand = (label: string) => ({ label, value: label.toLowerCase().replace(/\s+/g, "-") });

// seal-brand originals; every other brand is an aftermarket OEM fitment
// (same rule as backend/scripts/import_pricelist.py REPLACEMENT_BRANDS)
export const REPLACEMENT_BRANDS = ["Goetze", "Trelleborg", "Nuova Sjat", "GNL", "SKF", "Eagle Burgmann"].map(brand);

export const AFTERMARKET_BRANDS = [
  "Caterpillar",
  "CNHI",
  "Hitachi",
  "Fiat Hitachi",
  "John Deere",
  "Komatsu",
  "Liebherr",
  "FIAT Allis",
  "Poclain",
  "Busak Luyken",
  "Massey Ferguson",
  "Laltesi",
  "International",
  "Hanomag",
  "Hydromac",
  "Benati",
].map(brand);

const REPLACEMENT_SLUGS = new Set(REPLACEMENT_BRANDS.map((b) => b.value));

export function segmentOfBrand(brandSlug: string): SegmentSlug {
  return REPLACEMENT_SLUGS.has(brandSlug) ? "replacement" : "aftermarket";
}

export const segmentPath = (segment: string) => `/product-category/${segment}/`;

export const brandPath = (brandSlug: string, segment: string = segmentOfBrand(brandSlug)) =>
  `/product-category/${segment}/${brandSlug}/`;

export const productPath = (slug: string) => `/product/${slug}/`;
