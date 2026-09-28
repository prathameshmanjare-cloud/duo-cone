import { Helmet } from "react-helmet-async";

/** Browser-tab / search-result title. One string child: React 19 renders an
 *  empty <title> when it gets several (e.g. `{name} | DuoCone`). */
export function PageTitle({ title }: { title: string }) {
  return (
    <Helmet>
      <title>{`${title} | DuoCone`}</title>
    </Helmet>
  );
}
