const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let loaded = false;

// Loads GA4 only after the visitor has accepted the cookie banner, and only
// if a measurement ID is configured — keeps analytics out of the page
// entirely for visitors who decline.
export function loadAnalytics(): void {
  if (loaded || !GA_ID) return;
  loaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA_ID, { anonymize_ip: true });
}
