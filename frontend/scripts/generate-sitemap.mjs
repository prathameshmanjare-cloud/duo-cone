// Writes public/sitemap.xml before the build. Pulls live product/category
// slugs from the API when reachable; falls back to static routes only so a
// build never fails just because the API is down or unset locally.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SITE_URL = "https://duo-cone.com";
const API_URL = process.env.VITE_API_URL || "http://localhost:8000/api/v1";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/shop", priority: "0.9", changefreq: "daily" },
  { path: "/rfq", priority: "0.8", changefreq: "weekly" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/technology", priority: "0.6", changefreq: "monthly" },
  { path: "/industries", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
  { path: "/faq", priority: "0.5", changefreq: "monthly" },
  { path: "/shipping", priority: "0.3", changefreq: "yearly" },
  { path: "/returns", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy-policy", priority: "0.2", changefreq: "yearly" },
  { path: "/terms", priority: "0.2", changefreq: "yearly" },
  { path: "/cookie-policy", priority: "0.2", changefreq: "yearly" },
  { path: "/legal-notice", priority: "0.2", changefreq: "yearly" },
];

async function fetchJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchAllProductSlugs() {
  const slugs = [];
  let page = 1;
  for (;;) {
    const data = await fetchJson(`${API_URL}/products?page=${page}&page_size=100`);
    if (!data || !Array.isArray(data.items) || data.items.length === 0) break;
    for (const p of data.items) if (p.slug) slugs.push(p.slug);
    if (data.items.length < 100 || page > 50) break;
    page += 1;
  }
  return slugs;
}

async function fetchCategorySlugs() {
  const data = await fetchJson(`${API_URL}/categories`);
  if (!Array.isArray(data)) return [];
  return data.map((c) => c.slug).filter(Boolean);
}

function urlEntry({ path, priority, changefreq }) {
  return `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function main() {
  const [productSlugs, categorySlugs] = await Promise.all([
    fetchAllProductSlugs(),
    fetchCategorySlugs(),
  ]);

  const entries = [
    ...STATIC_ROUTES,
    ...categorySlugs.map((slug) => ({ path: `/category/${slug}`, priority: "0.7", changefreq: "weekly" })),
    ...productSlugs.map((slug) => ({ path: `/product/${slug}`, priority: "0.6", changefreq: "weekly" })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(urlEntry)
    .join("\n")}\n</urlset>\n`;

  const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sitemap.xml");
  writeFileSync(outPath, xml);
  console.log(`sitemap.xml written with ${entries.length} URLs (${productSlugs.length} products, ${categorySlugs.length} categories)`);
}

main();
