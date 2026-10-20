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
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const STRICT = Boolean(process.env.VERCEL) || process.env.PRERENDER_STRICT === "1";
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY ?? 6);

const STATIC_ROUTES = [
  "/",
  "/shop",
  "/rfq",
  "/about",
  "/technology",
  "/industries",
  "/contact",
  "/faq",
  "/shipping",
  "/returns",
  "/privacy-policy",
  "/terms",
  "/cookie-policy",
  "/legal-notice",
];
// segment landing pages (see routes/Shop/Category.tsx)
const SEGMENTS = ["replacement", "aftermarket"];

const ssr = await import(pathToFileURL(join(ROOT, "dist-ssr", "entry-server.js")).href);
const template = await readFile(join(DIST, "index.html"), "utf8");
await copyFile(join(DIST, "index.html"), join(DIST, "_shell.html"));

/** Retries cover Render's free tier waking up and transient 5xx. */
async function prefetch(qc, options, { optional = false } = {}) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const data = await options.queryFn();
      qc.setQueryData(options.queryKey, data);
      return data;
    } catch (err) {
      lastError = err;
      if (err?.status === 404) break;
      await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt));
    }
  }
  if (optional) return undefined;
  throw lastError;
}

const HEAD_TAG_RE =
  /<title>[\s\S]*?<\/title>|<meta\s+(?:name|property)="[^"]+"[^>]*\/?>|<link\s+rel="canonical"[^>]*\/?>/g;

function tagKey(tag) {
  if (tag.startsWith("<title")) return "title";
  if (tag.startsWith("<link")) return "canonical";
  return tag.match(/(?:name|property)="([^"]+)"/)?.[1] ?? tag;
}

/** React 19 emits <title>/<meta> where <Helmet> sits; move them into <head>,
 *  replacing the template's defaults with the same name. */
function buildPage(appHtml, state) {
  const pageTags = new Map();
  const body = appHtml.replace(HEAD_TAG_RE, (tag) => {
    pageTags.set(tagKey(tag), tag);
    return "";
  });
  let head = template.replace(HEAD_TAG_RE, (tag) => (pageTags.has(tagKey(tag)) ? "" : tag));
  head = head.replace("</head>", `    ${[...pageTags.values()].join("\n    ")}\n  </head>`);
  const json = JSON.stringify(state).replace(/</g, "\\u003c");
  return head.replace(
    '<div id="root"></div>',
    `<div id="root">${body}</div>\n    <script>window.__RQ_STATE__=${json}</script>`
  );
}

async function writeRoute(route, html) {
  const file = route === "/" ? join(DIST, "index.html") : join(DIST, route.slice(1), "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

async function renderRoute(route, load) {
  const qc = ssr.createQueryClient();
  if (load) await load(qc);
  const { html, state } = ssr.render(route, qc);
  await writeRoute(route, buildPage(html, state));
}

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

  // listing pages: /shop and each segment, plus /page/N for the rest.
  // Their results also give the full product slug list.
  const listings = [{ base: "/shop" }, ...SEGMENTS.map((s) => ({ base: `/category/${s}`, categorySlug: s }))];
  const productSlugs = new Set();
  const listingJobs = [];
  for (const l of listings) {
    const qc = ssr.createQueryClient();
    const first = await prefetch(qc, shopQuery({ categorySlug: l.categorySlug }));
    const pages = Math.max(1, Math.ceil(first.total / ssr.SHOP_PAGE_SIZE));
    for (let page = 1; page <= pages; page++) listingJobs.push({ ...l, page });
  }

  const listingFailures = await pool(listingJobs, async ({ base, categorySlug, page }) => {
    const route = page > 1 ? `${base}/page/${page}` : base;
    await renderRoute(route, async (qc) => {
      const data = await prefetch(qc, shopQuery({ categorySlug, page }));
      for (const p of data.items) productSlugs.add(p.slug);
    });
  });

  const staticFailures = await pool(
    STATIC_ROUTES.filter((r) => r !== "/shop"),
    (route) =>
      renderRoute(route, route === "/" ? (qc) => prefetch(qc, ssr.featuredQuery(), { optional: true }) : null)
  );

  let missing = 0;
  const productFailures = await pool([...productSlugs], (slug) =>
    renderRoute(`/product/${slug}`, async (qc) => {
      const product = await prefetch(qc, ssr.productQuery(slug), { optional: true });
      if (!product) {
        missing++;
        throw new Error("product not found");
      }
      await prefetch(qc, ssr.relatedQuery(slug), { optional: true });
    })
  );

  // any URL without a file gets this page with an HTTP 404 status (Vercel)
  await writeFile(join(DIST, "404.html"), buildPage(ssr.render("/404", ssr.createQueryClient()).html, {}));

  const failures = [...listingFailures, ...staticFailures, ...productFailures];
  const pageCount = listingJobs.length + STATIC_ROUTES.length - 1 + productSlugs.size - productFailures.length;
  console.log(
    `prerendered ${pageCount} pages (${productSlugs.size - productFailures.length} products, ` +
      `${listingJobs.length} listing pages) in ${((Date.now() - started) / 1000).toFixed(1)}s`
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
