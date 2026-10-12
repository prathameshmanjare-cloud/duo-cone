import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "../../store/auth";
import { usePrefersReducedMotion } from "./motionPrefs";
import { NavIcon, type NavIconName } from "./NavIcons";
import { Icon } from "./ui";
import s from "./Admin.module.css";

const NAV_GROUPS: { label: string; items: { to: string; end?: boolean; label: string; icon: NavIconName }[] }[] = [
  {
    label: "Overview",
    items: [{ to: "/admin", end: true, label: "Dashboard", icon: "dashboard" }],
  },
  {
    label: "Catalog",
    items: [
      { to: "/admin/products", label: "Products & stock", icon: "box" },
      { to: "/admin/brands", label: "Brands", icon: "tag" },
      { to: "/admin/categories", label: "Categories", icon: "folder" },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "/admin/orders", label: "Orders", icon: "receipt" },
      { to: "/admin/rfqs", label: "RFQs", icon: "mail" },
    ],
  },
  {
    label: "Admin",
    items: [
      { to: "/admin/users", label: "Users", icon: "users" },
      { to: "/admin/settings/email", label: "Email settings", icon: "settings" },
      { to: "/admin/account", label: "My account", icon: "key" },
    ],
  },
];

/** Section + page label for the topbar breadcrumb, from the current path. */
function crumbFor(pathname: string): { group: string; page: string } {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const match = item.end ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to);
      if (match) return { group: group.label, page: item.label };
    }
  }
  return { group: "Admin", page: "" };
}

export function AdminLayout() {
  const { status, user, hydrate, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = usePrefersReducedMotion();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    if (status === "anon") navigate("/admin/login", { replace: true });
  }, [status, navigate]);

  // the off-canvas nav (mobile) closes on navigation and on Esc
  useEffect(() => {
    if (!navOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  if (status === "idle" || status === "loading") {
    return (
      <div className={s.loginWrap} role="status" aria-label="Loading">
        <span className={s.spinner} />
      </div>
    );
  }
  if (status !== "authed") return null;

  const crumb = crumbFor(location.pathname);
  const displayName = user?.full_name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");

  function signOut() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className={s.shell}>
      <button
        type="button"
        className={`${s.scrim} ${navOpen ? s.scrimOpen : ""}`}
        aria-label="Close menu"
        tabIndex={navOpen ? 0 : -1}
        onClick={() => setNavOpen(false)}
      />

      <aside className={`${s.sidebar} ${navOpen ? s.sidebarOpen : ""}`} id="admin-nav">
        <div className={s.brand}>
          <span className={s.brandMark}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" stroke="#fdc400" />
            </svg>
          </span>
          DuoCone
          <span className={s.brandTag}>Admin</span>
        </div>

        <nav className={s.navScroll} aria-label="Admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={s.navGroup}>
              <div className={s.navGroupLabel}>{group.label}</div>
              {group.items.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={"end" in n ? n.end : undefined}
                  className={({ isActive }) => `${s.navlink} ${isActive ? s.navlinkActive : ""}`}
                  onClick={() => setNavOpen(false)}
                >
                  <NavIcon name={n.icon} className={s.navIcon} />
                  {n.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={s.userCard}>
          <span className={s.avatar}>{initials || "A"}</span>
          <div className={s.userMeta}>
            <div className={s.userName}>{displayName}</div>
            <div className={s.userEmail} title={user?.email}>{user?.email}</div>
          </div>
          <button type="button" className={s.iconBtn} onClick={signOut} aria-label="Sign out" title="Sign out">
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>

      <div className={s.content}>
        <header className={s.topbar}>
          <button
            type="button"
            className={`${s.iconBtn} ${s.iconBtnBordered} ${s.menuBtn}`}
            aria-label="Open menu"
            aria-controls="admin-nav"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <Icon name="menu" size={18} />
          </button>
          <div className={s.crumbs}>
            <span>{crumb.group}</span>
            {crumb.page && (
              <>
                <span className={s.crumbSep}>/</span>
                <strong>{crumb.page}</strong>
              </>
            )}
          </div>
          <div className={s.topbarRight}>
            <a className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} href="/" target="_blank" rel="noreferrer">
              <span className={s.hideSm}>View store</span>
              <Icon name="external" size={14} />
            </a>
          </div>
        </header>

        <main className={s.main}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
