import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "../../store/auth";
import { usePrefersReducedMotion } from "./motionPrefs";
import { NavIcon, type NavIconName } from "./NavIcons";
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

export function AdminLayout() {
  const { status, user, hydrate, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    if (status === "anon") navigate("/admin/login", { replace: true });
  }, [status, navigate]);

  if (status === "idle" || status === "loading") {
    return <div className={s.loginWrap}>Loading…</div>;
  }
  if (status !== "authed") return null;

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <div className={s.brand}>DuoCone CMS</div>
        <nav className={s.navScroll}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={s.navGroup}>
              <div className={s.navGroupLabel}>{group.label}</div>
              {group.items.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={"end" in n ? n.end : undefined}
                  className={({ isActive }) => `${s.navlink} ${isActive ? s.navlinkActive : ""}`}
                >
                  <NavIcon name={n.icon} className={s.navIcon} />
                  {n.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className={s.muted} style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
          {user?.email}
        </div>
        <motion.button
          className={s.logout}
          onClick={() => {
            logout();
            navigate("/admin/login", { replace: true });
          }}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        >
          Sign out
        </motion.button>
      </aside>
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
  );
}
