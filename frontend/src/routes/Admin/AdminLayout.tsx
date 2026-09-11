import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "../../store/auth";
import { usePrefersReducedMotion } from "./motionPrefs";
import s from "./Admin.module.css";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard" },
  { to: "/admin/products", label: "Products & stock" },
  { to: "/admin/brands", label: "Brands" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/rfqs", label: "RFQs" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/settings/email", label: "Email settings" },
  { to: "/admin/account", label: "My account" },
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
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `${s.navlink} ${isActive ? s.navlinkActive : ""}`}
          >
            {n.label}
          </NavLink>
        ))}
        <div className={s.spacer} />
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
