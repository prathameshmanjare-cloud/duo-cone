import { StrictMode, useEffect } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, hydrate, type DehydratedState } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./index.css";
import App from "./App.tsx";
import { isHydrating, markHydrated } from "./lib/ssr";
import { useCartStore } from "./store/cart";

declare global {
  interface Window {
    __RQ_STATE__?: DehydratedState;
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

// data the prerender used for this page, so hydration renders the same markup
if (window.__RQ_STATE__) hydrate(queryClient, window.__RQ_STATE__);

function AfterHydration() {
  useEffect(() => {
    if (!isHydrating()) return;
    markHydrated();
    void useCartStore.persist.rehydrate();
  }, []);
  return null;
}

const tree = (
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <AfterHydration />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);

const rootEl = document.getElementById("root")!;
if (isHydrating()) hydrateRoot(rootEl, tree);
else createRoot(rootEl).render(tree);
