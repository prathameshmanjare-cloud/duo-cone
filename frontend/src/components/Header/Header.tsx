import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useCartStore } from "../../store/cart";
import { useSession } from "../../store/session";
import { Logo } from "../Logo/Logo";
import {
  IconMenu,
  IconSearch,
  IconUser,
  IconCart,
  IconClose,
  IconArrowRight,
  IconLogout,
} from "../Icon/Icon";
import styles from "./Header.module.css";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/category/replacement", label: "Replacement" },
  { to: "/category/aftermarket", label: "Aftermarket" },
  { to: "/category/duo-cone", label: "Duo Cone" },
  { to: "/industries", label: "Industries" },
  { to: "/technology", label: "Technology" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const count = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.open);
  const navigate = useNavigate();
  const { user, status, hydrate, logout } = useSession();

  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    const el = headerRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = window.scrollY;
    let hidden = false;

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 4);

      if (el && !reduce && !menuOpen) {
        const goingDown = y > last && y > 160;
        if (goingDown && !hidden) {
          hidden = true;
          gsap.to(el, { yPercent: -100, duration: 0.4, ease: "power3.out" });
        } else if (!goingDown && hidden) {
          hidden = false;
          gsap.to(el, { yPercent: 0, duration: 0.4, ease: "power3.out" });
        }
      }
      last = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (el) gsap.set(el, { yPercent: 0 });
    };
  }, [menuOpen]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <div className={styles.announcement}>
        <span className={styles.spark} aria-hidden="true" />
        Express Offer. Receive your RFQ within 24 hours.
      </div>
      <header ref={headerRef} className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.inner}>
          <button
            className={styles.burger}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>
          <Link to="/" className={styles.logo} aria-label="DuoCone home">
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
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </form>
          <div className={styles.actions}>
            <Link to="/rfq" className={styles.rfqBtn}>
              <span className={styles.rfqLabel}>Start RFQ</span> <IconArrowRight size={15} />
            </Link>
            <span className={styles.divider} aria-hidden="true" />
            {status === "authed" && user ? (
              <>
                <Link to="/account" className={styles.userName} aria-label="Account">
                  <IconUser size={18} />
                  {user.full_name || user.email.split("@")[0]}
                </Link>
                <button
                  className={styles.signOut}
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  aria-label="Sign out"
                >
                  <IconLogout size={16} />
                  <span className={styles.signOutLabel}>Sign out</span>
                </button>
                <button className={styles.cartBtn} onClick={openCart} aria-label={`Cart, ${count} items`}>
                  <IconCart size={20} />
                  {count > 0 && <span className={styles.badge}>{count}</span>}
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.signIn}>
                <IconUser size={16} />
                <span className={styles.signInLabel}>Sign in</span>
              </Link>
            )}
          </div>
        </div>
        {menuOpen && (
          <nav className={styles.mobileNav} aria-label="Mobile">
            <form
              className={styles.mobileSearch}
              onSubmit={(e) => {
                onSearch(e);
                setMenuOpen(false);
              }}
              role="search"
            >
              <IconSearch size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
              />
            </form>
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
