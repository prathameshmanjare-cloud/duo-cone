import { Link } from "react-router-dom";
import { Logo } from "../Logo/Logo";
import styles from "./Footer.module.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Logo height={30} />
          </div>
          <p>
            German manufacturer of high-performance mechanical face seals (DF &amp; DO type) for
            mining, construction, agriculture, forestry and defense.
          </p>
          <span className={styles.madeIn}>
            <span className={styles.flag} aria-hidden="true" />
            Made in Germany
          </span>
        </div>

        <div className={styles.col}>
          <h4>Shop</h4>
          <Link to="/category/aftermarket">Aftermarket</Link>
          <Link to="/category/replacement">Replacement</Link>
          <Link to="/category/duo-cone">Duo-Cone Seals</Link>
          <Link to="/cross-reference">Cross-Reference Tool</Link>
        </div>
        <div className={styles.col}>
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <Link to="/industries">Industries</Link>
          <Link to="/technology">Technology</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className={styles.col}>
          <h4>Support</h4>
          <Link to="/faq">FAQ</Link>
          <Link to="/shipping">Shipping</Link>
          <Link to="/returns">Returns &amp; Refunds</Link>
          <Link to="/rfq">Request a Quote</Link>
        </div>
        <div className={styles.col}>
          <h4>Legal</h4>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span>© {year} DuoCone. All rights reserved.</span>
          <nav>
            <Link to="/privacy-policy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookie-policy">Cookies</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
