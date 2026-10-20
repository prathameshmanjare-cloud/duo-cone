// Renders every public route to static HTML after `vite build`, so crawlers
// and link previews get the real page content in the first response.
//
//   dist/index.html            client template -> copied to dist/_shell.html
//   dist-ssr/entry-server.js   server bundle (vite build --ssr)
//
// Output: dist/<route>/index.html per route, dist/404.html, dist/_shell.html
// (empty app shell for client-only routes such as /cart, see vercel.json).
//
// On Vercel a failed catalog fetch fails the build, so the live deployment
// is never replaced by one without product pages. Locally it only warns.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const STRICT = Boolean(process.env.VERCEL) || process.env.PRERENDER_STRICT === "1";
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY ?? 6);

// every public URL ends in "/", like the old WooCommerce shop's URLs
const STATIC_ROUTES = [
  "/",
  "/shop/",
  "/rfq/",
  "/about-us/",
  "/technology/",
  "/industries/",
  "/contact/",
  "/faq/",
  "/shipping/",
  "/returns/",
  "/privacy-policy/",
  "/terms/",
  "/cookie-policy/",
  "/legal-notice/",
];
// segment and brand pages (see routes/Shop/Category.tsx)
const SEGMENTS = ["replacement", "aftermarket"];
const API_URL = process.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
const SITE_URL = "https://www.duo-cone.com";

const ssr = await import(pathToFileURL(join(ROOT, "dist-ssr", "entry-server.js")).href);
// dist/index.html is the empty client template right after `vite build` and
// the prerendered home page afterwards; keep a pristine copy (outside the
// deployed folder) so the prerender can be re-run on its own
const TEMPLATE_COPY = join(ROOT, "dist-ssr", "template.html");
let template = await readFile(join(DIST, "index.html"), "utf8");
if (template.includes('<div id="root"></div>')) await writeFile(TEMPLATE_COPY, template);
else template = await readFile(TEMPLATE_COPY, "utf8");
// client-only pages (cart, checkout, account, admin, ...) stay out of search
await writeFile(
  join(DIST, "_shell.html"),
  template.replace("</head>", '    <meta name="robots" content="noindex, follow" />\n  </head>')
);

/** Retries cover Render's free tier waking up and transient 5xx. */
// one API call per query for the whole build: the English and German page
// of the same content share the result
const fetched = new Map();

async function fetchOnce(options) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return { data: await options.queryFn() };
    } catch (err) {
      lastError = err;
      if (err?.status === 404) break;
      await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt));
    }
  }
  return { error: lastError };
}

async function prefetch(qc, options, { optional = false } = {}) {
  const key = JSON.stringify(options.queryKey);
  if (!fetched.has(key)) fetched.set(key, fetchOnce(options));
  const { data, error } = await fetched.get(key);
  if (error) {
    if (optional) return undefined;
    throw error;
  }
  qc.setQueryData(options.queryKey, data);
  return data;
}

const HEAD_TAG_RE =
  /<title>[\s\S]*?<\/title>|<meta\s+(?:name|property)="[^"]+"[^>]*\/?>|<link\s+rel="(?:canonical|alternate)"[^>]*\/?>/g;

function tagKey(tag) {
  if (tag.startsWith("<title")) return "title";
  if (tag.startsWith('<link rel="alternate"')) return "alternate:" + tag.match(/hreflang="([^"]+)"/i)?.[1];
  if (tag.startsWith("<link")) return "canonical";
  return tag.match(/(?:name|property)="([^"]+)"/)?.[1] ?? tag;
}

/** React 19 emits <title>/<meta> where <Helmet> sits; move them into <head>,
 *  replacing the template's defaults with the same name. */
function buildPage(appHtml, state, lang = "en") {
  const pageTags = new Map();
  const body = appHtml.replace(HEAD_TAG_RE, (tag) => {
    pageTags.set(tagKey(tag), tag);
    return "";
  });
  let head = template
    .replace(HEAD_TAG_RE, (tag) => (pageTags.has(tagKey(tag)) ? "" : tag))
    .replace('<html lang="en">', `<html lang="${lang}">`);
  head = head.replace("</head>", `    ${[...pageTags.values()].join("\n    ")}\n  </head>`);
  const json = JSON.stringify(state).replace(/</g, "\\u003c");
  return head.replace(
    '<div id="root"></div>',
    `<div id="root">${body}</div>\n    <script>window.__RQ_STATE__=${json}</script>`
  );
}

const written = { en: 0, de: 0 };

async function writeRoute(route, html) {
  written[route.startsWith("/de/") ? "de" : "en"]++;
  const file = join(DIST, route.replace(/^\/|\/$/g, ""), "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

async function renderOne(route, load, lang) {
  const qc = ssr.createQueryClient();
  if (load) await load(qc);
  const { html, state } = ssr.render(route, qc);
  await writeRoute(route, buildPage(html, state, lang));
}

/** Renders the English route and, where one exists, its German twin. */
async function renderRoute(route, load) {
  await renderOne(route, load, "en");
  const de = ssr.alternatePath(route, "de");
  if (de) await renderOne(de, load, "de");
}

// sitemap entries for a route in both languages
const withGerman = (entries) =>
  entries.flatMap((e) => {
    const de = ssr.alternatePath(e.route, "de");
    return de ? [e, { ...e, route: de }] : [e];
  });

async function pool(items, fn) {
  let i = 0;
  const failures = [];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < items.length) {
        const item = items[i++];
        try {
          await fn(item);
        } catch (err) {
          failures.push({ item, error: String(err?.message ?? err) });
        }
      }
    })
  );
  return failures;
}

async function main() {
  const started = Date.now();
  const shopQuery = (extra) => ssr.shopQuery({ page: 1, sort: "relevance", ...extra });

  // listing pages: /shop/, each segment, each brand within its segment,
  // plus page/N/ for the rest. Their results also give every product slug.
  const brands = await prefetch(ssr.createQueryClient(), {
    queryKey: ["brands"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/brands`);
      if (!res.ok) throw Object.assign(new Error(`brands: HTTP ${res.status}`), { status: res.status });
      return res.json();
    },
  });
  const listings = [
    { base: "/shop/" },
    ...SEGMENTS.map((s) => ({ base: `/product-category/${s}/`, categorySlug: s })),
    ...SEGMENTS.flatMap((s) =>
      brands.map((b) => ({ base: `/product-category/${s}/${b.slug}/`, categorySlug: s, brand: b.slug }))
    ),
  ];
  const productSlugs = new Set();
  const listingProducts = new Map(); // listing base path -> product slugs on all its pages
  const listingJobs = [];
  let brandPages = 0;
  for (const l of listings) {
    const qc = ssr.createQueryClient();
    const first = await prefetch(qc, shopQuery({ categorySlug: l.categorySlug, brand: l.brand }));
    if (l.brand && first.total === 0) continue; // brand isn't in this segment
    if (l.brand) brandPages++;
    const pages = Math.max(1, Math.ceil(first.total / ssr.SHOP_PAGE_SIZE));
    for (let page = 1; page <= pages; page++) listingJobs.push({ ...l, page });
  }

  const listingFailures = await pool(listingJobs, async ({ base, categorySlug, brand, page }) => {
    const route = page > 1 ? `${base}page/${page}/` : base;
    await renderRoute(route, async (qc) => {
      const data = await prefetch(qc, shopQuery({ categorySlug, brand, page }));
      // admin-written page text shown under the products (first page only)
      if (page === 1 && brand) {
        await prefetch(qc, ssr.brandQuery(brand), { optional: true });
        // counts for the German brand page text
        const stats = ssr.brandStatsQueries(categorySlug, brand);
        await prefetch(qc, stats.df, { optional: true });
        await prefetch(qc, stats.do, { optional: true });
      }
      else if (page === 1 && categorySlug) await prefetch(qc, ssr.categoryQuery(categorySlug), { optional: true });
      for (const p of data.items) {
        productSlugs.add(p.slug);
        if (!listingProducts.has(base)) listingProducts.set(base, []);
        listingProducts.get(base).push(p.slug);
      }
    });
  });

  const staticFailures = await pool(
    STATIC_ROUTES.filter((r) => r !== "/shop/"),
    (route) =>
      renderRoute(route, route === "/" ? (qc) => prefetch(qc, ssr.featuredQuery(), { optional: true }) : null)
  );

  let missing = 0;
  const lastmod = new Map(); // product slug -> YYYY-MM-DD
  const productFailures = await pool([...productSlugs], (slug) =>
    renderRoute(`/product/${slug}/`, async (qc) => {
      const product = await prefetch(qc, ssr.productQuery(slug), { optional: true });
      if (!product) {
        missing++;
        throw new Error("product not found");
      }
      await prefetch(qc, ssr.relatedQuery(slug), { optional: true });
      lastmod.set(slug, product.updated_at ? product.updated_at.slice(0, 10) : "");
    })
  );

  // sitemaps: pages (static + listings) and products, tied by an index.
  // lastmod comes from the products; static pages have no reliable date.
  const newest = (slugs) => slugs.map((sl) => lastmod.get(sl) ?? "").sort().at(-1) ?? "";
  const pageEntries = [
    ...STATIC_ROUTES.map((route) => ({ route, date: route === "/shop/" ? newest([...lastmod.keys()]) : "" })),
    ...listingJobs
      .filter((j) => j.page === 1 && j.base !== "/shop/")
      .map((j) => ({ route: j.base, date: newest(listingProducts.get(j.base) ?? []) })),
  ];
  const productEntries = [...lastmod].map(([slug, date]) => ({ route: `/product/${slug}/`, date }));
  const urlset = (entries) =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(({ route, date }) => `  <url><loc>${SITE_URL}${route}</loc>${date ? `<lastmod>${date}</lastmod>` : ""}</url>`)
      .join("\n") +
    `\n</urlset>\n`;
  const sitemaps = [
    { file: "sitemap-pages.xml", entries: withGerman(pageEntries) },
    { file: "sitemap-products.xml", entries: withGerman(productEntries) },
  ];
  for (const sm of sitemaps) await writeFile(join(DIST, sm.file), urlset(sm.entries));
  await writeFile(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      sitemaps
        .map((sm) => {
          const date = sm.entries.map((e) => e.date).sort().at(-1) ?? "";
          return `  <sitemap><loc>${SITE_URL}/${sm.file}</loc>${date ? `<lastmod>${date}</lastmod>` : ""}</sitemap>`;
        })
        .join("\n") +
      `\n</sitemapindex>\n`
  );

  // any URL without a file gets this page with an HTTP 404 status (Vercel)
  await writeFile(join(DIST, "404.html"), buildPage(ssr.render("/404/", ssr.createQueryClient()).html, {}));

  const failures = [...listingFailures, ...staticFailures, ...productFailures];
  console.log(
    `prerendered ${written.en} English + ${written.de} German pages (${productSlugs.size - productFailures.length} products, ` +
      `${listingJobs.length} listing pages, ${brandPages} brand pages, ${fetched.size} API calls) in ` +
      `${((Date.now() - started) / 1000).toFixed(1)}s`
  );
  if (failures.length) {
    console.warn(`${failures.length} routes failed:`, failures.slice(0, 10));
    // a handful of vanished products is fine; anything else means bad data
    if (STRICT && failures.length > missing) process.exit(1);
  }
}

main().catch((err) => {
  console.error("prerender failed:", err);
  if (STRICT) process.exit(1);
  console.warn("continuing with the client-only shell (local build)");
});
