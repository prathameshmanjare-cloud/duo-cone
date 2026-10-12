import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { OrderStatus, RfqStatus } from "../../lib/adminApi";
import { usePrefersReducedMotion } from "./motionPrefs";
import s from "./Admin.module.css";

/* Shared building blocks for the admin screens: icons, page header, status
 * pills, pager, loading/empty table states and the slide-over drawer. */

export type IconName =
  | "search"
  | "download"
  | "plus"
  | "trash"
  | "x"
  | "chevronLeft"
  | "chevronRight"
  | "chevronDown"
  | "eye"
  | "menu"
  | "logout"
  | "external"
  | "inbox"
  | "arrowLeft"
  | "arrowUp"
  | "arrowDown"
  | "lock"
  | "mail";

const ICONS: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  download: <path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 20h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  logout: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />,
  inbox: <path d="M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5l2-8Z" />,
  arrowLeft: <path d="M19 12H5m0 0 6-6m-6 6 6 6" />,
  arrowUp: <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
  arrowDown: <path d="M12 5v14m0 0-6-6m6 6 6-6" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
};

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <div className={s.pageHead}>
      <div className={s.pageHeadText}>
        {back && (
          <Link to={back.to} className={s.backLink}>
            <Icon name="arrowLeft" size={14} /> {back.label}
          </Link>
        )}
        <h1 className={s.h1}>{title}</h1>
        {subtitle && <p className={s.pageSub}>{subtitle}</p>}
      </div>
      {actions && <div className={s.pageActions}>{actions}</div>}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className={s.search}>
      <Icon name="search" />
      <input
        className={s.input}
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export type Tone = "ok" | "warn" | "danger" | "info" | "violet" | "neutral";

export const orderTone = (st: OrderStatus): Tone =>
  ({
    pending: "warn",
    paid: "info",
    processing: "info",
    shipped: "violet",
    completed: "ok",
    cancelled: "danger",
    refunded: "neutral",
  })[st] as Tone;

export const rfqTone = (st: RfqStatus): Tone =>
  ({ new: "warn", quoted: "info", won: "ok", lost: "danger", closed: "neutral" })[st] as Tone;

export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={s.badge} data-tone={tone}>
      {children}
    </span>
  );
}

export function StatusSelect<T extends string>({
  value,
  options,
  tone,
  label,
  onChange,
}: {
  value: T;
  options: readonly T[];
  tone: Tone;
  label: string;
  onChange: (v: T) => void;
}) {
  return (
    <select
      className={s.statusSelect}
      data-tone={tone}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((x) => (
        <option key={x} value={x}>
          {x}
        </option>
      ))}
    </select>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className={s.pager}>
      <span>
        Showing <strong className={s.strong}>{from}–{to}</strong> of <strong className={s.strong}>{total}</strong>
      </span>
      <div className={s.pagerNav}>
        <button
          type="button"
          className={`${s.iconBtn} ${s.iconBtnBordered}`}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <Icon name="chevronLeft" />
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className={`${s.iconBtn} ${s.iconBtnBordered}`}
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <Icon name="chevronRight" />
        </button>
      </div>
    </div>
  );
}

const SKELETON_WIDTHS = ["72%", "48%", "86%", "40%", "64%", "56%"];

export function TableSkeleton({ cols, rows = 6 }: { cols: number; rows?: number }) {
  return (
    <div className={s.tableWrap} aria-busy="true" aria-label="Loading">
      <table className={s.table}>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }, (_, c) => (
                <td key={c}>
                  <span className={s.skeleton} style={{ width: SKELETON_WIDTHS[(r + c) % SKELETON_WIDTHS.length] }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, title, hint }: { colSpan: number; title: string; hint?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className={s.empty}>
        <div className={s.emptyIcon}>
          <Icon name="inbox" size={22} />
        </div>
        <div className={s.emptyTitle}>{title}</div>
        {hint && <div className={s.emptyHint}>{hint}</div>}
      </td>
    </tr>
  );
}

export function DeleteButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={`${s.iconBtn} ${s.iconBtnDanger}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon name="trash" />
    </button>
  );
}

/** Right-hand slide-over used for order / RFQ detail. Closes on Esc or scrim click. */
export function Drawer({
  title,
  meta,
  footer,
  onClose,
  children,
}: {
  title: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        className={s.overlay}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.15 }}
      />
      <motion.aside
        className={s.drawer}
        role="dialog"
        aria-modal="true"
        initial={reduceMotion ? { opacity: 0 } : { x: 40, opacity: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={s.drawerHead}>
          <div>
            <h2 className={s.drawerTitle}>{title}</h2>
            {meta && <div className={s.drawerSub}>{meta}</div>}
          </div>
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className={s.drawerBody}>{children}</div>
        {footer && <div className={s.drawerFoot}>{footer}</div>}
      </motion.aside>
    </>
  );
}

export function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={s.drawerSection}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
