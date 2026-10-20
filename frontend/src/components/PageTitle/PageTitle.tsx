import { Helmet } from "react-helmet-async";
import { SITE_NAME } from "../../lib/seo";

/** Title for pages that must stay out of search results (cart, checkout,
 *  account, search, forms, 404); public pages use <Seo> instead.
 *  One string child: React 19 renders an empty <title> when it gets several. */
export function PageTitle({ title }: { title: string }) {
  return (
    <Helmet>
      <title>{`${title} | ${SITE_NAME}`}</title>
      <meta name="robots" content="noindex, follow" />
    </Helmet>
  );
}
