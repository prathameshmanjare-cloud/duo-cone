# DuoCon E-Commerce — Architecture

## 1. Existing site analysis (duo-cone.com)

- **Platform:** WordPress + WooCommerce. GTranslate multilang (10 langs). Elementor-style theme.
- **Business:** B2B industrial. Sells **mechanical face seals / duo cone seals** (DF type + DO type) for heavy machinery (mining, construction, agriculture, forestry, recycling, defense). German manufacturer.
- **Catalog:** ~2109 products. Simple products (no visible variations). Price in EUR, shown **excl. VAT + "plus shipping costs"**. Every product has `ADD TO CART` but messaging is heavily **RFQ / "Express Offer — RFQ within 24h"** — quote-driven B2B funnel alongside direct cart.
- **Taxonomy:**
  - `Aftermarket` → by OEM machine brand: Caterpillar, CNHI, Hitachi, Fiat Hitachi, John Deere, Komatsu, Liebherr, Fiat Allis, Poclain, Busak Luyken, Latesi, Lamborghini, Benati …
  - `Replacement` → by seal brand: Goetze, Trelleborg, Nuova SJAT, GNL, SKF, Eagle Burgmann …
  - `Duo-Cone` → DO / DF type landing.
  - Product belongs to `[Segment, Brand]` (2-level).
- **Product page:** single image, title = `<Brand> Mechanical Face Seal <DF|DO> Type <OEM ref>`, price, qty, add-to-cart, Description (spec bullet list: lifetime, hardness HRC, seal material NI-HARD/SAE52100, casting/forged, ID/OD, o-ring material NBR/FKM/Silicone/HNBR, rubber hardness, 24mo warranty, German warehouse), internal code (e.g. `175FL-NBR60`), SKU = OEM ref, categories, Additional information tab (attributes), related products.
- **URLs:** `/product/<slug>/`, `/product-category/<slug>/`, `/shop/`, `/store/`, `/about-us/`, `/industries/`, `/technology/`, `/contact/`. SEO-friendly slugs already.
- **Header:** logo, product search, nav (About/Industries/Technology/Contact/Store), category quick links, language selector, cart.

### Works well
- Clear SKU=OEM cross-reference model (buyers search by OEM part number).
- Strong trust badges (RFQ 24h, support, 72h delivery, quality).
- Spec-rich descriptions.

### Weak / improve
- Repetitive hero (same 3 slides duplicated 3×).
- Thin product pages: one image, no dimensional table, no structured specs, no cross-reference table, no downloadable datasheet.
- No real search intelligence (WP search). No filced filtering by dimensions (ID/OD/height) — critical for seal buyers.
- No account / order history / saved RFQs.
- Checkout = default Woo. VAT/EU B2B (VAT ID reverse charge) not surfaced.
- Mobile nav cramped; no sticky buy CTA.
- No datasheets, no comparison, no "find my seal" tool.

### Keep (brand)
- Name DUO CONE, DF/DO nomenclature, EUR excl-VAT convention, RFQ-first tone, German-manufacturer positioning, industry list, trust badges.

---

## 2. Sitemap

```
/                         home
/shop                     all products + filters
/category/:slug           category listing (segment or brand)
/product/:slug            product detail
/search                   search results
/cross-reference          OEM part-number lookup tool  [new, brand-fit]
/rfq                       request-for-quote (multi-line)  [new, brand-fit]
/cart
/checkout
/order-success/:id
/login /register /forgot-password /reset-password
/account
/account/orders  /account/orders/:id
/account/rfqs    /account/rfqs/:id      [new]
/account/profile /account/addresses /account/wishlist
/about /industries /industries/:slug /technology
/contact /faq /shipping /returns
/privacy-policy /terms /cookie-policy
/blog /blog/:slug
/404
```

Nav (desktop): Shop ▾ (Aftermarket / Replacement / Duo-Cone / by brand mega-menu) · Cross-Reference · Industries · Technology · About · Contact — right: Search, Account, Cart, RFQ button, Lang.
Nav (mobile): hamburger drawer, sticky bottom bar (Search / RFQ / Cart), sticky buy CTA on PDP.

---

## 3. Page structure (key pages)

**Home:** announcement bar (RFQ 24h) → header → hero (single, DF/DO value prop, "See products" + "Start RFQ") → trust badges strip → DF vs DO explainer (2-col) → shop by segment (Aftermarket/Replacement/Duo-Cone, 3 cards) → shop by brand (logo grid, links to /category) → cross-reference teaser (input → /cross-reference) → industries strip → about/German-manufacturer block → FAQ (top 5) → newsletter → footer.

**Shop / Category:** left filter rail (segment, brand, DF/DO type, inner Ø range, outer Ø range, height range, price range, in-stock) · top bar (result count, sort, view toggle) · responsive product grid · pagination (SEO `?page=`) + "load more". Mobile: filters in slide-over. Empty + skeleton + error states.

**PDP:** breadcrumb → gallery (image(s), zoom) → title, internal code, SKU/OEM ref, price (excl VAT note), stock, qty, Add to cart + Start RFQ, delivery/returns accordion → specs **table** (ID/OD/height, material, o-ring, hardness, lifetime, warranty) → cross-reference table (equivalent OEM refs) → description → downloads (datasheet PDF placeholder) → related → product FAQ. JSON-LD Product. Sticky mobile buy bar.

**Cross-Reference:** input OEM/brand part no → fuzzy match → matched product(s) + dimensional confirmation → add to cart / RFQ.

**RFQ:** multi-line item table (add by SKU or search), qty per line, company, VAT ID, country, message, file upload (drawing). POST `/api/v1/rfq`. Confirmation + email.

**Checkout:** one page, sections: contact → shipping addr → billing (+ EU VAT ID field, reverse-charge note) → shipping method → order summary → coupon → terms checkbox → place order (payment provider placeholder / "pay by invoice" for B2B).

---

## 4. User flows

- **Direct purchase:** land → search/browse/filter → PDP → add to cart → cart drawer → checkout → order-success → email.
- **RFQ (primary B2B):** browse/cross-ref → add lines to RFQ → submit → email to sales + customer → sales replies → (later) convert to order.
- **Cross-reference:** enter OEM ref → match → PDP or RFQ.
- **Auth:** register (email verify) → login (JWT access + refresh httpOnly cookie) → account dashboard → orders/RFQs/addresses.
- **Return:** account/orders/:id → request return → email.

---

## 5. Frontend architecture

- **React 18 + Vite + TypeScript.** React Router v6 (data routers, lazy routes, code-split per route).
- **State:** TanStack Query (server state: products, cart-server-sync, orders) · Zustand (cart, UI drawers, auth session) · React Hook Form + Zod (forms).
- **Styling:** CSS Modules + design-token CSS vars (no Tailwind lock-in). `prefers-reduced-motion` honored. Framer Motion for route/drawer/modal transitions only.
- **Data fetching:** typed API client (`src/lib/api.ts`) wrapping `fetch`, base `VITE_API_URL`, auto refresh-token retry.
- **SEO:** `react-helmet-async` for title/meta/OG/canonical/JSON-LD; `vite-plugin-sitemap` + build-time prerender of static pages (or migrate to Next later — structure kept framework-light). `robots.txt`, `sitemap.xml` (dynamic from API).
- **Images:** `<img loading="lazy" decoding="async">`, `srcset` from GitHub-hosted `product-images` repo via raw/Pages URL, explicit width/height, `object-fit: contain` on white bg (industrial parts).
- **a11y:** semantic landmarks, focus-trap dialogs, labelled inputs, visible focus rings, skip link, accordion `aria-expanded`.
- **Perf:** route-level code splitting, `react-query` caching + `staleTime`, prefetch on link hover, defer non-critical, font `display=swap`, no CLS.

### Component hierarchy
```
App
  RootLayout (AnnouncementBar, Header[Nav, MegaMenu, SearchBar, CartButton, LangSwitcher], Footer, ToastHost, CartDrawer)
  routes/
    Home (Hero, TrustBadges, TypeExplainer, SegmentCards, BrandGrid, CrossRefTeaser, IndustriesStrip, AboutBlock, FaqPreview, Newsletter)
    Shop/Category (FilterRail, ActiveFilters, SortBar, ProductGrid>ProductCard, Pagination, Skeleton, EmptyState)
    Product (Breadcrumbs, ProductGallery, BuyBox[Price, QuantitySelector, AddToCartButton, RfqButton], SpecTable, CrossRefTable, Downloads, RelatedProducts, ProductFaq, StickyBuyBar)
    Search  Cart  Checkout(CheckoutForm sections)  OrderSuccess
    Rfq (RfqLineTable)  CrossReference
    account/* (AccountLayout, Orders, OrderDetail, Rfqs, Profile, Addresses, Wishlist)
    auth/* (Login, Register, ForgotPassword, ResetPassword)
    content/* (About, Industries, IndustryDetail, Technology, Contact, Faq, Shipping, Returns, Privacy, Terms, CookiePolicy, Blog, BlogPost)
    NotFound
  shared/ui: Button, Price, QuantitySelector, Modal, Drawer, Accordion, Breadcrumbs, Pagination, Skeleton, EmptyState, Toast, Tag, RangeSlider, Field
```

---

## 6. Backend architecture (FastAPI)

```
backend/app/
  main.py                 app factory, middleware, routers, exception handlers
  config/settings.py      pydantic-settings (env)
  db/                     session (async SQLAlchemy 2.0), base
  models/                 SQLAlchemy ORM
  schemas/                Pydantic v2 request/response
  api/v1/                 routers: products, categories, brands, search, cross_reference,
                          cart, orders, rfq, auth, users, addresses, wishlist, reviews,
                          contact, newsletter, content, chat, whatsapp, sitemap, admin
  services/               business logic (pricing, cart, order, rfq, search, crossref, auth)
  repositories/           DB access per aggregate
  auth/                   jwt, password (argon2), deps (current_user, admin)
  integrations/           email/(base, sendgrid, mailgun), whatsapp/twilio, chat/(base, llm)
  background/             tasks.py (email send, order side effects, rfq notify, sync)
  middleware/             request id, rate limit (slowapi/redis), security headers
  utils/
migrations/               alembic
scripts/                  woo_migrate.py, seed.py
tests/
```

Rules: routers thin → services → repositories. Async everywhere (asyncpg). DI via FastAPI `Depends`.

---

## 7. PostgreSQL schema

```
users(id uuid pk, email citext unique, password_hash, full_name, phone,
      company_name, vat_id, is_verified bool, is_admin bool, created_at, updated_at)
email_verification_tokens(id, user_id fk, token_hash, expires_at, used_at)
password_reset_tokens(id, user_id fk, token_hash, expires_at, used_at)
addresses(id, user_id fk, type enum(shipping,billing), name, company, line1, line2,
          city, region, postal_code, country_code, phone, is_default bool)

brands(id, slug unique, name, segment enum(aftermarket,replacement,oem), logo_url, description)
categories(id, slug unique, name, parent_id fk null, segment, description, image_url,
           seo_title, seo_description, sort, woo_id int null)
products(id uuid pk, slug unique, woo_id int unique null, sku citext index,      -- OEM ref
         name, seal_type enum(DF,DO,other), internal_code,           -- e.g. 175FL-NBR60
         brand_id fk, short_description, description_html,
         price_cents int, sale_price_cents int null, currency char(3) default 'EUR',
         tax_class, is_active bool, is_rfq_only bool default false,
         inner_diameter_mm numeric, outer_diameter_mm numeric, height_mm numeric,
         weight_g int, material, oring_material, hardness_hrc, lifetime_hours,
         warranty_months int, rating_avg numeric, rating_count int,
         seo_title, seo_description, created_at, updated_at)
product_categories(product_id fk, category_id fk, pk(both))
product_images(id, product_id fk, url, alt, position, width, height)
product_attributes(id, product_id fk, name, value, position)          -- Additional info tab
product_variations(id, product_id fk, sku, attributes jsonb, price_cents,
                   sale_price_cents, stock_qty, woo_id int null)       -- future-proof
cross_references(id, product_id fk, ref_number citext index, ref_brand, note)
inventory(product_id fk pk, stock_qty int, backorder enum(no,notify,yes),
          lead_time_days int, warehouse text default 'DE')

carts(id uuid pk, user_id fk null, session_token null, currency, created_at, updated_at)
cart_items(id, cart_id fk, product_id fk, variation_id fk null, qty int, unit_price_cents)

coupons(id, code citext unique, type enum(percent,fixed), value_cents_or_pct int,
        min_subtotal_cents, starts_at, ends_at, usage_limit, used_count, is_active)

orders(id uuid pk, number text unique, user_id fk null, email, status enum(pending,paid,
       processing,shipped,completed,cancelled,refunded), currency,
       subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents,
       vat_id, vat_reverse_charge bool, coupon_id fk null,
       shipping_address jsonb, billing_address jsonb, shipping_method, customer_note,
       placed_at, created_at, updated_at)
order_items(id, order_id fk, product_id fk null, variation_id fk null, sku, name,
            qty, unit_price_cents, total_cents)
payments(id, order_id fk, provider, provider_ref, amount_cents, currency,
         status enum(initiated,authorized,captured,failed,refunded), raw jsonb, created_at)

rfqs(id uuid pk, number text unique, user_id fk null, email, company, vat_id,
     country_code, phone, message, status enum(new,quoted,won,lost,closed),
     attachment_url, created_at, updated_at)
rfq_items(id, rfq_id fk, product_id fk null, sku, name, qty, target_price_cents null, note)

wishlists(id, user_id fk, product_id fk, created_at, unique(user_id,product_id))
reviews(id, product_id fk, user_id fk null, author_name, rating int, title, body,
        is_approved bool, created_at)
newsletter_subscribers(id, email citext unique, is_confirmed bool, token_hash, created_at)
contact_messages(id, name, email, phone, subject, message, handled bool, created_at)

chat_conversations(id uuid pk, user_id fk null, session_token, created_at)
chat_messages(id, conversation_id fk, role enum(user,assistant,system), content,
              grounded_product_ids uuid[], created_at)

content_pages(id, slug unique, title, body_html, seo_title, seo_description, updated_at)
blog_posts(id, slug unique, title, excerpt, body_html, cover_url, author, tags text[],
           published_at, seo_title, seo_description)
industries(id, slug unique, name, summary, body_html, image_url, sort)
notifications(id, user_id fk null, type, payload jsonb, read_at, created_at)

migration_log(id, entity, woo_id int, local_id uuid, status, error, run_id, created_at)
```

Indexes: `products(sku)`, `products(brand_id)`, `products(is_active)`, GIN trigram on `products.name`/`sku` (search), `cross_references(ref_number)` trigram, `product_categories`, `orders(user_id)`, `orders(number)`. `citext` + `pg_trgm` extensions.

---

## 8. API endpoints (v1)

```
GET  /api/v1/products?segment&brand&type&id_min&id_max&od_min&od_max&h_min&h_max
        &price_min&price_max&in_stock&sort&page&page_size&q
GET  /api/v1/products/{slug}
GET  /api/v1/products/{slug}/related
GET  /api/v1/categories            GET /api/v1/categories/{slug}
GET  /api/v1/brands
GET  /api/v1/search?q&limit        (products + categories + suggestions)
GET  /api/v1/cross-reference?ref=  (fuzzy OEM lookup)
POST /api/v1/cart  GET /api/v1/cart  PATCH /api/v1/cart/items/{id}  DELETE ...
POST /api/v1/cart/coupon
POST /api/v1/checkout            -> creates order (+ BackgroundTasks: confirm email, sales notify)
GET  /api/v1/orders  GET /api/v1/orders/{id}
POST /api/v1/rfq   GET /api/v1/rfq  GET /api/v1/rfq/{id}
POST /api/v1/auth/register  /login  /refresh  /logout  /verify-email
     /forgot-password  /reset-password
GET/PATCH /api/v1/users/me
CRUD /api/v1/users/me/addresses
GET/POST/DELETE /api/v1/users/me/wishlist
GET/POST /api/v1/products/{id}/reviews
POST /api/v1/contact         POST /api/v1/newsletter
GET  /api/v1/content/{slug}  GET /api/v1/blog  GET /api/v1/blog/{slug}  GET /api/v1/industries
POST /api/v1/chat                (grounded; returns answer + cited product ids)
POST /api/v1/whatsapp/webhook   (Twilio signature verified)
GET  /sitemap.xml   GET /robots.txt
/api/v1/admin/*                  (admin-guarded: products, orders, rfqs, migration report)
```

Conventions: Pydantic response models, cents integers, RFC7807-style errors `{type,title,detail,errors}`, `X-Request-ID`, pagination envelope `{items,total,page,page_size}`, rate-limit auth + contact + chat.

---

## 9. Image architecture

- Separate repo **`duocon/product-images`**, served via GitHub Pages (`https://images.duo-cone.com` CNAME later) — swappable base via `IMAGE_BASE_URL`.
- Layout: `products/<product-slug>/01.webp 02.webp …`, `brands/<slug>.svg`, `categories/<slug>.webp`.
- DB stores **relative path** (`products/<slug>/01.webp`); API returns absolute (`IMAGE_BASE_URL + path`). CDN later = change one env var.
- Migration downloads Woo images → converts to `webp` (+ keeps original) → commits to repo → writes paths.
- Frontend `buildImageUrl(path, {w})`; `srcset` widths 480/960/1440; `alt` = product name + ref.

---

## 10. Auth architecture

- Password hash **argon2id**. JWT: short-lived access (15 min, `Authorization: Bearer`) + refresh (30 d, **httpOnly Secure SameSite=Lax cookie**), rotation + reuse detection.
- Email verification + password reset via single-use hashed tokens (24 h TTL), sent through EmailService (BackgroundTasks).
- `get_current_user` / `require_admin` deps. Guest cart via `session_token` cookie, merged on login.
- CORS allowlist (Vercel domains + apex). Security headers middleware. slowapi rate limit on `/auth/*`.

---

## 11. WooCommerce migration

`scripts/woo_migrate.py` (typed, async httpx, `--run-id`, `--resume`, `--dry-run`, `--only products|categories|images`).

```
Woo REST (ck/cs)  ->  paginate (per_page=100)  ->  validate (pydantic)  ->
transform (map fields, parse seal_type from name, dimensions from attributes,
           cross-refs from name/SKU, brand from category) ->
upsert by woo_id (idempotent)  ->  migration_log  ->  report (counts, failures csv)
```

Maps: categories→categories(parent), product→products+inventory+images+attributes+cross_references, variations→product_variations. Retries w/ backoff on 429/5xx. Report written to `scripts/reports/<run-id>.json`.

---

## 12. Email architecture

`EmailService` interface `send(template, to, context)` → provider (`SendGridProvider` | `MailgunProvider`) chosen by `EMAIL_PROVIDER`. Jinja2 templates in `integrations/email/templates/`. Templates: welcome, verify_email, password_reset, order_confirmation, order_status, shipping_notification, rfq_received_customer, rfq_received_sales, contact_notification, newsletter_confirm. All dispatched via `BackgroundTasks`. Retry + dead-letter log table optional later.

---

## 13. WhatsApp architecture

Twilio WhatsApp. Outbound: `WhatsAppService.send(to, template, vars)` for order placed / shipped / RFQ received (opt-in phone on order). Inbound: `POST /api/v1/whatsapp/webhook` → **verify `X-Twilio-Signature`** → route intent (order status by number, support handoff) → reply via Messaging API. Credentials server-side only. Logged to `notifications`.

---

## 14. Chatbot architecture

Phase 1: Tidio script slot in layout (env flag).
Phase 2 (built-in, structure ready): `POST /api/v1/chat` → `ChatService`: (1) retrieve — full-text + trigram over products/cross_references/specs, (2) build context from real rows only, (3) LLM (provider-abstracted `integrations/chat/base.py`) with system prompt "answer only from provided PRODUCT_CONTEXT; if absent say you don't know; never invent price/stock/specs", (4) return `{answer, cited_product_ids}`. Store `chat_conversations/messages`. No tool that fabricates catalog data.

---

## 15. Deployment architecture

- **Frontend:** Vercel (Vite static build) — apex `duo-cone.com` + `www`. Env `VITE_API_URL`, `VITE_IMAGE_BASE_URL`. Preview deploys per PR.
- **Backend:** Render web service (Docker, `uvicorn app.main:app`), auto-deploy `main`. Health check `/healthz`.
- **DB:** Render PostgreSQL (or Neon). Alembic migrations run on release (`render.yaml` preDeploy).
- **Images:** GitHub Pages from `product-images` repo.
- **Secrets:** Vercel/Render dashboards; never in repo. `.env.example` committed.
- `render.yaml` + `vercel.json` (SPA rewrite `/* -> /index.html`, security headers, cache-control for assets).

---

## 16. Security architecture

argon2id · JWT rotation + httpOnly refresh · CORS allowlist · security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors none) · SQLAlchemy params (no raw SQL) · Pydantic validation on every input · output escaping (React) + sanitize stored HTML (bleach) for reviews/blog · rate limiting (auth, contact, chat, rfq) · Twilio + payment webhook signature verification · admin RBAC · secrets in env · dependency scanning (`pip-audit`, `npm audit`) in CI · no secrets to client · file-upload validation (RFQ drawings: type + size + AV scan hook).

---

## 17. SEO strategy

Per-route `<title>`/meta/canonical via Helmet · OG + Twitter cards · JSON-LD: Organization (home), Product + Offer + AggregateRating (PDP), BreadcrumbList, ItemList (category), FAQPage (faq) · semantic HTML · SEO slugs preserved from Woo · dynamic `sitemap.xml` (products, categories, content, blog) + `robots.txt` · hreflang later for langs · pre-render static/content routes at build · fast LCP, no CLS · descriptive `alt`. 301 map from old Woo URLs (mostly identical paths — `/product/`, `/product-category/` → `/category/`).

---

## 18. Performance strategy

Route code-splitting + lazy · TanStack Query cache (`staleTime` 5 min catalog) · prefetch on hover · list virtualization for very long filter/spec lists · image lazy + srcset + width/height + webp · gzip/brotli (Vercel) · HTTP cache headers on catalog GETs (`s-maxage`, `stale-while-revalidate`) · DB: indexed filters, keyset pagination option, `EXPLAIN`-checked queries, connection pool · avoid N+1 (selectinload) · minimal deps · Lighthouse budget: perf ≥ 90 mobile.

---

## 19. (component hierarchy — see §5)

## 20. Implementation roadmap

1. **Scaffold** — monorepo (`frontend/`, `backend/`, `docs/`), tooling, CI, `.env.example`, deploy configs.
2. **Design system** — tokens, primitives (Button/Field/Price/Modal/Drawer/Accordion/Skeleton/EmptyState/Toast), layout shell (Header/Footer/AnnouncementBar).
3. **Backend core** — settings, async DB, models, Alembic init, `/healthz`, error handlers, OpenAPI.
4. **Catalog API** — products/categories/brands/search/cross-reference + repositories/services + seed script.
5. **Woo migration script** — implement + dry-run + report.
6. **Frontend catalog** — Home, Shop/Category (filters), PDP, Search, Cross-Reference — wired to API with loading/empty/error states.
7. **Cart + Checkout** — Zustand cart, cart drawer, `/cart`, `/checkout`, order create, `/order-success`, confirmation email.
8. **RFQ** — `/rfq`, API, sales + customer email, `/account/rfqs`.
9. **Auth + Account** — register/verify/login/refresh/reset, account dashboard, orders, addresses, wishlist.
10. **Content** — About/Industries/Technology/Contact/FAQ/Shipping/Returns/legal/blog + CMS-lite `content_pages`.
11. **Integrations** — EmailService providers, WhatsApp webhook, chat endpoint (grounded), Tidio flag.
12. **SEO + sitemap + JSON-LD + 301s**, 404 page.
13. **Hardening** — rate limits, security headers, tests (pytest + Playwright), a11y pass, Lighthouse.
14. **Deploy** — Vercel + Render + Postgres + images repo; run migration; smoke test.
```
