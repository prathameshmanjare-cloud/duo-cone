import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { Link, localize, useLang } from "../../lib/i18n";
import { SITE_URL, breadcrumbJsonLd, canonicalUrl, clean } from "../../lib/seo";
import styles from "./Breadcrumbs.module.css";

/** Visible breadcrumb trail plus its BreadcrumbList JSON-LD. "Home" is
 *  prepended; the last item is the current page. */
export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  const { pathname } = useLocation();
  const lang = useLang();
  const trail = [{ label: lang === "de" ? "Startseite" : "Home", to: "/" }, ...items];
  const jsonLd = breadcrumbJsonLd(
    trail.map((item, i) => ({
      label: item.label,
      url: i === trail.length - 1 ? canonicalUrl(pathname) : SITE_URL + (item.to ? localize(item.to, lang) : pathname),
    }))
  );

  return (
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <ol>
        {trail.map((item, i) => (
          <li key={i}>
            {item.to && i < trail.length - 1 ? (
              <Link to={item.to}>{clean(item.label)}</Link>
            ) : (
              <span aria-current="page">{clean(item.label)}</span>
            )}
            {i < trail.length - 1 && <span className={styles.sep}>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
