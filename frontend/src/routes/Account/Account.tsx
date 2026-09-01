import { NavLink, Outlet } from "react-router-dom";
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
  return (
    <div className={styles.page}>
      <nav className={styles.side} aria-label="Account">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? styles.active : undefined)}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export const AccountOverview = () => <div><h1>Account overview</h1><p>Welcome back. See your recent orders and RFQs here.</p></div>;
export const AccountOrders = () => <div><h1>Orders</h1><p>No orders yet.</p></div>;
export const AccountRfqs = () => <div><h1>RFQs</h1><p>No RFQs yet.</p></div>;
export const AccountAddresses = () => <div><h1>Addresses</h1><p>No saved addresses yet.</p></div>;
export const AccountWishlist = () => <div><h1>Wishlist</h1><p>Your wishlist is empty.</p></div>;
export const AccountProfile = () => <div><h1>Profile</h1><p>Manage your account details.</p></div>;
