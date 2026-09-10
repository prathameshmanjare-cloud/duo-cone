import { useEffect } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../store/session";
import { api } from "../../lib/api";
import { Price } from "../../components/Price/Price";
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

export const AccountOrders = () => {
  const { data, isLoading, isError } = useQuery({ queryKey: ["my-orders"], queryFn: api.listOrders, retry: false });
  return (
    <div>
      <h1>Orders</h1>
      {isLoading && <p>Loading…</p>}
      {isError && <p>Couldn't load your orders. Please try again later.</p>}
      {data && data.length === 0 && <p>No orders yet. <Link to="/shop">Browse products</Link>.</p>}
      {data && data.length > 0 && (
        <ul className={styles.list}>
          {data.map((o) => (
            <li key={o.id} className={styles.listRow}>
              <div>
                <strong>{o.number}</strong>
                <span className={styles.muted}> · {new Date(o.created_at).toLocaleDateString()} · {o.status}</span>
                <div className={styles.muted}>{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</div>
              </div>
              <Price cents={o.total_cents} currency={o.currency} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const AccountRfqs = () => {
  const { data, isLoading, isError } = useQuery({ queryKey: ["my-rfqs"], queryFn: api.listMyRfqs, retry: false });
  return (
    <div>
      <h1>RFQs</h1>
      {isLoading && <p>Loading…</p>}
      {isError && <p>Couldn't load your RFQs. Please try again later.</p>}
      {data && data.length === 0 && <p>No RFQs yet. <Link to="/rfq">Request a quote</Link>.</p>}
      {data && data.length > 0 && (
        <ul className={styles.list}>
          {data.map((r) => (
            <li key={r.id} className={styles.listRow}>
              <div>
                <strong>{r.number}</strong>
                <span className={styles.muted}> · {new Date(r.created_at).toLocaleDateString()} · {r.status}</span>
                <div className={styles.muted}>
                  {r.items.map((i) => `${i.qty}× ${i.sku || i.name || "item"}`).join(", ") || "—"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

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
