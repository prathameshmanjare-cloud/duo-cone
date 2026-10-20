// Products without their own photo use generic DF/DO artwork the API points
// at (/product-images/df.png). WebP copies sit next to it in /public:
// df.webp (300 px) and df-960.webp (960 px).
const PLACEHOLDER = /^\/product-images\/(df|do)\.png$/;

/** WebP `srcset` for the generic artwork, or null for real product photos. */
export function placeholderWebp(url: string | null | undefined, large = false) {
  const m = url?.match(PLACEHOLDER);
  if (!m) return null;
  const small = `/product-images/${m[1]}.webp 300w`;
  return large ? `${small}, /product-images/${m[1]}-960.webp 960w` : small;
}
