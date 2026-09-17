import { Link } from "react-router-dom";
import { Logo } from "../Logo/Logo";
import { RevealGroup, RevealItem } from "../Reveal/Reveal";
import { COMPANY } from "../../lib/company";
import styles from "./Footer.module.css";

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.45 1.33 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.9 9.9 0 0 0 12.04 2Zm0 1.67c2.21 0 4.28.86 5.84 2.42a8.2 8.2 0 0 1 2.42 5.87c0 4.56-3.71 8.27-8.28 8.27a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.39c0-4.57 3.71-8.28 8.27-8.28Zm-2.47 4.4c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02 0 1.2.87 2.35.99 2.51.12.16 1.7 2.6 4.19 3.64.58.25 1.04.4 1.4.51.59.19 1.12.16 1.55.1.47-.07 1.45-.59 1.66-1.17.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.72-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.77.96-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01Z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}
function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.64h.05c.53-1 1.83-2.06 3.77-2.06C20.4 8.58 22 10.6 22 14.06V21h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V21H9V9Z" />
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.glow} aria-hidden="true" />

      <RevealGroup className={styles.grid}>
        <RevealItem className={styles.brand}>
          <div className={styles.logo}>
            <Logo height={30} />
          </div>
          <p>
            German manufacturer of high-performance mechanical face seals (DF &amp; DO type) for
            mining, construction, agriculture, forestry and defense.
          </p>

          <div className={styles.quickContacts}>
            <a href={`https://wa.me/${COMPANY.phoneHref.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
              <IconWhatsApp /> {COMPANY.phoneDisplay}
            </a>
            <a href={`mailto:${COMPANY.email}`}>
              <IconMail /> {COMPANY.email}
            </a>
          </div>

          <div className={styles.badges}>
            <span className={styles.madeIn}>
              <span className={styles.flag} aria-hidden="true" />
              Made in Germany
            </span>
            <a
              className={styles.social}
              href="#"
              aria-label="DuoCone on LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconLinkedIn />
            </a>
          </div>

          <div className={styles.legalInfo}>
            <span>SAP PARTS Europe GmbH</span>
            <span>Benzstraße 21, 51381 Leverkusen, Germany</span>
            <span>HRB 82724 Cologne District Court, VAT 300917783</span>
          </div>
        </RevealItem>

        <RevealItem className={styles.col}>
          <h4>Shop</h4>
          <Link to="/category/aftermarket">Aftermarket</Link>
          <Link to="/category/replacement">Replacement</Link>
          <Link to="/cross-reference">Cross-Reference Tool</Link>
        </RevealItem>
        <RevealItem className={styles.col}>
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <Link to="/industries">Industries</Link>
          <Link to="/technology">Technology</Link>
          <Link to="/contact">Contact</Link>
        </RevealItem>
        <RevealItem className={styles.col}>
          <h4>Support</h4>
          <Link to="/faq">FAQ</Link>
          <Link to="/shipping">Shipping</Link>
          <Link to="/returns">Returns &amp; Refunds</Link>
          <Link to="/rfq">Request a Quote</Link>
        </RevealItem>
        <RevealItem className={styles.col}>
          <h4>Legal</h4>
          <Link to="/legal-notice">Legal Notice</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
        </RevealItem>
      </RevealGroup>

      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span>© {year} DuoCone. All rights reserved.</span>
          <nav>
            <Link to="/legal-notice">Legal Notice</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
