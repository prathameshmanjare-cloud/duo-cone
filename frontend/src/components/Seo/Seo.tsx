import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl, canonicalUrl, metaDescription } from "../../lib/seo";
import { alternatePath, langOf } from "../../lib/i18n";

/** Per-page search and social metadata: <title>, description, canonical URL
 *  (no query string), Open Graph / Twitter tags and JSON-LD. One per page.
 *  `title` is the full title — build it with pageTitle() / productTitle(). */
export function Seo({
  title,
  description,
  image,
  type = "website",
  jsonLd = [],
}: {
  title: string;
  description: string;
  image?: string | null;
  type?: "website" | "product";
  jsonLd?: object[];
}) {
  const { pathname } = useLocation();
  const url = canonicalUrl(pathname);
  const desc = metaDescription(description);
  const img = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;
  // hreflang: the same page in English and German (x-default = English)
  const en = alternatePath(pathname, "en");
  const de = alternatePath(pathname, "de");
  const alternates = en && de ? { en: canonicalUrl(en), de: canonicalUrl(de) } : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {alternates && <link rel="alternate" hrefLang="en" href={alternates.en} />}
      {alternates && <link rel="alternate" hrefLang="de" href={alternates.de} />}
      {alternates && <link rel="alternate" hrefLang="x-default" href={alternates.en} />}
      <meta property="og:locale" content={langOf(pathname) === "de" ? "de_DE" : "en_US"} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:image:secure_url" content={img} />
      {!image && <meta property="og:image:width" content="1200" />}
      {!image && <meta property="og:image:height" content="630" />}
      {!image && <meta property="og:image:alt" content="Duo Cone mechanical face seal, cutaway view" />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}
