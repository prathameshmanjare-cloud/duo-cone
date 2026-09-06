import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adminApi, type DashboardStats } from "../../lib/adminApi";
import { formatPrice } from "../../lib/format";
import { useAuthStore } from "../../store/auth";
import s from "./Admin.module.css";

export function Dashboard() {
  const user = useAuthStore((st) => st.user);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminApi.stats,
  });

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const name = user?.full_name || user?.email?.split("@")[0] || "there";

  return (
    <>
      <div className={s.dashHead}>
        <div>
          <h1 className={s.dashTitle}>{greeting()}, {name}</h1>
          <p className={s.dashSub}>{today} · DuoCone storefront overview</p>
        </div>
        <div className={s.quickRow}>
          <Link className={s.btn} to="/admin/products/new">+ New product</Link>
          <Link className={`${s.btn} ${s.btnGhost}`} to="/admin/products">Products &amp; stock</Link>
        </div>
      </div>

      {isLoading && <p className={s.muted}>Loading…</p>}
      {error && <p className={s.error}>{(error as Error).message}</p>}

      {data && (
        <>
          <div className={s.kpiGrid}>
            <Kpi
              accent="var(--color-success)"
              label="Revenue (paid+)"
              value={formatPrice(data.revenue_cents)}
              foot={`${data.orders_total} orders all-time`}
              icon={<IconCash />}
            />
            <Kpi
              accent="var(--color-primary)"
              label="Pending orders"
              value={data.orders_pending}
              foot={data.orders_pending ? "need processing" : "all clear"}
              icon={<IconBag />}
              to="/admin/orders"
            />
            <Kpi
              accent="var(--color-secondary-dark)"
              label="Open RFQs"
              value={data.rfqs_new}
              foot={`${data.rfqs_total} total requests`}
              icon={<IconQuote />}
              to="/admin/rfqs"
            />
            <Kpi
              accent="#7b3ff2"
              label="Products"
              value={data.products_total}
              foot={`${data.products_active} active`}
              icon={<IconBox />}
              to="/admin/products"
            />
          </div>

          <div className={s.dashCols}>
            <div className={s.panel}>
              <h2 className={s.panelTitle}>Needs attention</h2>
              <div className={s.attentionList}>
                <Attn
                  tone={data.out_of_stock ? "danger" : "ok"}
                  count={data.out_of_stock}
                  text="products out of stock"
                  href="/admin/products?stock=out"
                />
                <Attn
                  tone={data.low_stock ? "warn" : "ok"}
                  count={data.low_stock}
                  text="products low on stock (≤5)"
                  href="/admin/products?stock=low"
                />
                <Attn
                  tone={data.orders_pending ? "warn" : "ok"}
                  count={data.orders_pending}
                  text="orders awaiting processing"
                  href="/admin/orders"
                />
                <Attn
                  tone={data.rfqs_new ? "warn" : "ok"}
                  count={data.rfqs_new}
                  text="RFQs not yet quoted"
                  href="/admin/rfqs"
                />
              </div>

              <h2 className={s.panelTitle} style={{ marginTop: "var(--space-6)" }}>
                Catalog mix
              </h2>
              <CatalogMix data={data} />
            </div>

            <div className={s.panel}>
              <h2 className={s.panelTitle}>At a glance</h2>
              <Mini label="Active products" value={data.products_active} />
              <Mini label="Quote-only products" value={data.products_rfq_only} />
              <Mini label="Brands" value={data.brands_total} to="/admin/brands" />
              <Mini label="Categories" value={data.categories_total} to="/admin/categories" />
              <Mini label="Registered users" value={data.users_total} to="/admin/users" />
              <Mini label="Total RFQs" value={data.rfqs_total} to="/admin/rfqs" />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Kpi({
  accent,
  label,
  value,
  foot,
  icon,
  to,
}: {
  accent: string;
  label: string;
  value: string | number;
  foot: string;
  icon: ReactNode;
  to?: string;
}) {
  const inner = (
    <div className={s.kpi} style={{ ["--accent" as string]: accent }}>
      <div className={s.kpiTop}>
        <span className={s.kpiLabel}>{label}</span>
        <span className={s.kpiIcon}>{icon}</span>
      </div>
      <div className={s.kpiValue}>{value}</div>
      <div className={s.kpiFoot}>{foot}</div>
    </div>
  );
  return to ? (
    <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
      {inner}
    </Link>
  ) : (
    inner
  );
}

function Attn({
  tone,
  count,
  text,
  href,
}: {
  tone: "danger" | "warn" | "ok";
  count: number;
  text: string;
  href: string;
}) {
  const cls =
    tone === "danger" ? s.attnDanger : tone === "warn" ? s.attnWarn : s.attnOk;
  return (
    <Link to={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div className={`${s.attn} ${cls}`}>
        <span className={s.attnDot} />
        <span className={s.attnText}>{text}</span>
        <span className={s.attnCount}>{count}</span>
      </div>
    </Link>
  );
}

function CatalogMix({ data }: { data: DashboardStats }) {
  const total = Math.max(data.products_total, 1);
  const activePct = (data.products_active / total) * 100;
  const rfqPct = (data.products_rfq_only / total) * 100;
  return (
    <>
      <div className={s.meter}>
        <span className={s.meterFill} style={{ width: `${activePct}%` }} />
        <span className={s.meterFillAlt} style={{ width: `${rfqPct}%` }} />
      </div>
      <div className={s.legend}>
        <span className={s.legendItem}>
          <span className={s.legendSwatch} style={{ background: "var(--color-primary)" }} />
          Active {data.products_active}
        </span>
        <span className={s.legendItem}>
          <span className={s.legendSwatch} style={{ background: "var(--color-secondary)" }} />
          Quote-only {data.products_rfq_only}
        </span>
        <span className={s.legendItem}>
          <span className={s.legendSwatch} style={{ background: "var(--color-bg-subtle)" }} />
          of {data.products_total} total
        </span>
      </div>
    </>
  );
}

function Mini({ label, value, to }: { label: string; value: number; to?: string }) {
  return (
    <div className={s.miniRow}>
      <span>{to ? <Link to={to}>{label}</Link> : label}</span>
      <span className={s.miniVal}>{value}</span>
    </div>
  );
}

/* --------------------------------------------------------------------- icons */
const svg = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconCash() {
  return (
    <svg {...svg}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}
function IconBag() {
  return (
    <svg {...svg}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function IconQuote() {
  return (
    <svg {...svg}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg {...svg}>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </svg>
  );
}
