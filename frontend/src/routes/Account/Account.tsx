import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSession } from "../../store/session";
import styles from "./Account.module.css";

const LINKS = [
  { to: "/account", label: "Overview", end: true },
  { to: "/account/orders", label: "Orders" },
  { to: "/account/rfqs", label: "RFQs" },
  { to: "/account/addresses", label: "Addresses" },
  { to: "/account/wishlist", label: "Wishlist" },
  { to: "/account/profile", label: "Profile" },
];

export function AccountLayout() {
  const { status, hydrate, logout } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    if (status === "anon") navigate("/login?next=/account", { replace: true });
  }, [status, navigate]);

  if (status === "idle" || status === "loading") {
    return <div className={styles.page}>Loading…</div>;
  }
  if (status !== "authed") return null;

  return (
    <div className={styles.page}>
      <nav className={styles.side} aria-label="Account">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? styles.active : undefined)}>
            {l.label}
          </NavLink>
        ))}
        <button
          className={styles.signOut}
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Sign out
        </button>
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export const AccountOverview = () => {
  const user = useSession((s) => s.user);
  return (
    <div>
      <h1>Account overview</h1>
      <p>Welcome back{user?.full_name ? `, ${user.full_name}` : ""}. See your recent orders and RFQs here.</p>
    </div>
  );
};

export const AccountOrders = () => <div><h1>Orders</h1><p>No orders yet.</p></div>;
export const AccountRfqs = () => <div><h1>RFQs</h1><p>No RFQs yet.</p></div>;
export const AccountAddresses = () => <div><h1>Addresses</h1><p>No saved addresses yet.</p></div>;
export const AccountWishlist = () => <div><h1>Wishlist</h1><p>Your wishlist is empty.</p></div>;

export const AccountProfile = () => {
  const user = useSession((s) => s.user);
  return (
    <div>
      <h1>Profile</h1>
      <dl className={styles.profile}>
        <div><dt>Email</dt><dd>{user?.email}</dd></div>
        <div><dt>Name</dt><dd>{user?.full_name || "—"}</dd></div>
        <div><dt>Company</dt><dd>{user?.company_name || "—"}</dd></div>
        <div><dt>Phone</dt><dd>{user?.phone || "—"}</dd></div>
        <div><dt>Verified</dt><dd>{user?.is_verified ? "Yes" : "No"}</dd></div>
      </dl>
    </div>
  );
};
