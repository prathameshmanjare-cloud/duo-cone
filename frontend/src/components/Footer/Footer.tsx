import { Link } from "react-router-dom";
import { Logo } from "../Logo/Logo";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div>
          <div className={styles.logo}><Logo height={26} tone="light" /></div>
          <p>German manufacturer of high-performance mechanical face seals (DF &amp; DO type) for mining, construction, agriculture, forestry and defense.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/category/aftermarket">Aftermarket</Link>
          <Link to="/category/replacement">Replacement</Link>
          <Link to="/category/duo-cone">Duo-Cone Seals</Link>
          <Link to="/cross-reference">Cross-Reference Tool</Link>
        </div>
        <div>
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <Link to="/industries">Industries</Link>
          <Link to="/technology">Technology</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div>
          <h4>Support</h4>
          <Link to="/faq">FAQ</Link>
          <Link to="/shipping">Shipping</Link>
          <Link to="/returns">Returns &amp; Refunds</Link>
          <Link to="/rfq">Request a Quote</Link>
        </div>
        <div>
          <h4>Legal</h4>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
        </div>
      </div>
      <div className={styles.bottom}>© {new Date().getFullYear()} DuoCon. All rights reserved.</div>
    </footer>
  );
}
