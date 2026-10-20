// Build-time renderer used by scripts/prerender.mjs. Not shipped to browsers.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, dehydrate } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";

export { featuredQuery, productQuery, relatedQuery, shopQuery, SHOP_PAGE_SIZE } from "./lib/queries";

export function createQueryClient() {
  // never refetch or retry during the build; whatever was prefetched is final
  return new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
}

export function render(url: string, queryClient: QueryClient) {
  const html = renderToString(
    <StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </StrictMode>
  );
  return { html, state: dehydrate(queryClient) };
}
