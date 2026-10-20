import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { Link, NavLink, alternatePath, useLang, type Lang } from "../../lib/i18n";
import gsap from "gsap";
import { useCartStore } from "../../store/cart";
import { useSession } from "../../store/session";
import { Logo } from "../Logo/Logo";
import {
  IconMenu,
  IconUser,
  IconCart,
  IconClose,
  IconArrowRight,
  IconLogout,
} from "../Icon/Icon";
import styles from "./Header.module.css";

const NAV = [
  { to: "/shop/", label: { en: "Shop", de: "Shop" } },
  { to: "/product-category/replacement/", label: { en: "Replacement", de: "Replacement" } },
  { to: "/product-category/aftermarket/", label: { en: "Aftermarket", de: "Aftermarket" } },
  { to: "/industries/", label: { en: "Industries", de: "Branchen" } },
  { to: "/technology/", label: { en: "Technology", de: "Technologie" } },
  { to: "/about-us/", label: { en: "About", de: "Über uns" } },
  { to: "/contact/", label: { en: "Contact", de: "Kontakt" } },
];

const TEXT = {
  announcement: { en: "Express Offer. Receive your RFQ within 12 hours.", de: "Express-Angebot: Ihr Angebot innerhalb von 12 Stunden." },
  openMenu: { en: "Open menu", de: "Menü öffnen" },
  closeMenu: { en: "Close menu", de: "Menü schließen" },
  home: { en: "DuoCone home", de: "DuoCone Startseite" },
  rfq: { en: "Start RFQ", de: "Angebot anfordern" },
  account: { en: "Account", de: "Konto" },
  signOut: { en: "Sign out", de: "Abmelden" },
  signIn: { en: "Sign in", de: "Anmelden" },
  cart: { en: (n: number) => `Cart, ${n} items`, de: (n: number) => `Warenkorb, ${n} Artikel` },
  languages: { en: "Language", de: "Sprache" },
};

/** EN | DE: the same page in the other language, or that language's home
 *  page when the current page has no translation (cart, legal pages, ...). */
function LangSwitch() {
  const { pathname, search } = useLocation();
  const lang = useLang();
  const options: { code: Lang; label: string; name: string }[] = [
    { code: "en", label: "EN", name: "English" },
    { code: "de", label: "DE", name: "Deutsch" },
  ];
  return (
    <div className={styles.langSwitch} role="group" aria-label={TEXT.languages[lang]}>
      {options.map((o) => {
        const target = alternatePath(pathname, o.code);
        return (
          <RouterLink
            key={o.code}
            to={target ? target + search : o.code === "de" ? "/de/" : "/"}
            hrefLang={o.code}
            lang={o.code}
            aria-label={o.name}
            aria-current={o.code === lang ? "true" : undefined}
            className={o.code === lang ? styles.langOn : undefined}
          >
            {o.label}
          </RouterLink>
        );
      })}
    </div>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const count = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.open);
  const navigate = useNavigate();
  const { user, status, hydrate, logout } = useSession();
  const lang = useLang();

  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    const el = headerRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = window.scrollY;
    let hidden = false;

    const show = () => {
      if (el && hidden) {
        hidden = false;
        gsap.to(el, { yPercent: 0, duration: 0.4, ease: "power3.out" });
      }
    };

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 4);

      const heroEl = document.querySelector<HTMLElement>("[data-hero-scroll]");
      const inHero =
        !!heroEl &&
        y + window.innerHeight > heroEl.offsetTop &&
        y < heroEl.offsetTop + heroEl.offsetHeight;

      if (el && !reduce && !menuOpen && inHero) {
        const goingDown = y > last && y > 160;
        if (goingDown && !hidden) {
          hidden = true;
          gsap.to(el, { yPercent: -100, duration: 0.4, ease: "power3.out" });
        } else if (!goingDown && hidden) {
          show();
        }
      } else {
        show();
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

  return (
    <>
      <div className={styles.announcement}>
        <span className={styles.spark} aria-hidden="true" />
        {TEXT.announcement[lang]}
      </div>
      <header ref={headerRef} className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.inner}>
          <button
            className={styles.burger}
            aria-label={menuOpen ? TEXT.closeMenu[lang] : TEXT.openMenu[lang]}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>
          <Link to="/" className={styles.logo} aria-label={TEXT.home[lang]}>
            <Logo height={30} />
          </Link>
          <nav className={styles.nav} aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? styles.active : undefined)}
              >
                <span>{item.label[lang]}</span>
              </NavLink>
            ))}
          </nav>
          <div className={styles.actions}>
            <LangSwitch />
            <Link to="/rfq/" className={styles.rfqBtn} aria-label={TEXT.rfq[lang]}>
              <span className={styles.rfqLabel}>{TEXT.rfq[lang]}</span> <IconArrowRight size={15} />
            </Link>
            <span className={styles.divider} aria-hidden="true" />
            {status === "authed" && user ? (
              <>
                <Link to="/account" className={styles.userName} aria-label={TEXT.account[lang]}>
                  <IconUser size={18} />
                  {user.full_name || user.email.split("@")[0]}
                </Link>
                <button
                  className={styles.signOut}
                  onClick={() => {
                    logout();
                    navigate(lang === "de" ? "/de/" : "/");
                  }}
                  aria-label={TEXT.signOut[lang]}
                  title={TEXT.signOut[lang]}
                >
                  <IconLogout size={16} />
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.signIn} aria-label={TEXT.signIn[lang]}>
                <IconUser size={16} />
                <span className={styles.signInLabel}>{TEXT.signIn[lang]}</span>
              </Link>
            )}
            <button className={styles.cartBtn} onClick={openCart} aria-label={TEXT.cart[lang](count)}>
              <IconCart size={20} />
              {count > 0 && <span className={styles.badge}>{count}</span>}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className={styles.mobileNav} aria-label="Mobile">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                {item.label[lang]}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
