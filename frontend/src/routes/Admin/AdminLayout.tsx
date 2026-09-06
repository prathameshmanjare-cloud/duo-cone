import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import s from "./Admin.module.css";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard" },
  { to: "/admin/products", label: "Products & stock" },
  { to: "/admin/brands", label: "Brands" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/rfqs", label: "RFQs" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/account", label: "My account" },
];

export function AdminLayout() {
  const { status, user, hydrate, logout } = useAuthStore();
  const navigate = useNavigate();

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
        <button
          className={s.logout}
          onClick={() => {
            logout();
            navigate("/admin/login", { replace: true });
          }}
        >
          Sign out
        </button>
      </aside>
      <main className={s.main}>
        <Outlet />
      </main>
    </div>
  );
}
