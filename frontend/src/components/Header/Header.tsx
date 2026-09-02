import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/cart";
import { Logo } from "../Logo/Logo";
import {
  IconMenu,
  IconSearch,
  IconUser,
  IconCart,
  IconClose,
  IconArrowRight,
} from "../Icon/Icon";
import styles from "./Header.module.css";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/cross-reference", label: "Cross-Reference" },
  { to: "/industries", label: "Industries" },
  { to: "/technology", label: "Technology" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const count = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.open);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <div className={styles.announcement}>
        <span className={styles.spark} aria-hidden="true" />
        Express Offer — receive your RFQ within 24 hours.
      </div>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.inner}>
          <button
            className={styles.burger}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>
          <Link to="/" className={styles.logo} aria-label="DuoCon home">
            <Logo height={30} />
          </Link>
          <nav className={styles.nav} aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? styles.active : undefined)}
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <form className={styles.search} onSubmit={onSearch} role="search">
            <IconSearch size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by name or OEM part number…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </form>
          <div className={styles.actions}>
            <Link to="/rfq" className={styles.rfqBtn}>
              Start RFQ <IconArrowRight size={15} />
            </Link>
            <span className={styles.divider} aria-hidden="true" />
            <Link to="/account" aria-label="Account" className={styles.iconLink}>
              <IconUser size={20} />
            </Link>
            <button className={styles.cartBtn} onClick={openCart} aria-label={`Cart, ${count} items`}>
              <IconCart size={20} />
              {count > 0 && <span className={styles.badge}>{count}</span>}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className={styles.mobileNav} aria-label="Mobile">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
