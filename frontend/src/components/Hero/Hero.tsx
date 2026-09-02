import { Link } from "react-router-dom";
import { Button } from "../Button/Button";
import { IconArrowRight } from "../Icon/Icon";
import { SealCanvas } from "./SealCanvas";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.stage} aria-hidden="true">
        <SealCanvas className={styles.canvas} />
        <div className={styles.vignette} />
      </div>

      <div className={styles.inner}>
        <h1 className={styles.reveal} style={{ animationDelay: "0.05s" }}>
          DUO CONE SEALS (DO &amp; DF)
        </h1>
        <p className={styles.reveal} style={{ animationDelay: "0.18s" }}>
          Our Mechanical Face Seal Series is designed for high-pressure use. Made from top-quality
          materials, these seals resist wear, abrasion, and extreme temperatures — ideal for demanding
          machinery like hydraulic systems and construction equipment.
        </p>
        <div className={`${styles.actions} ${styles.reveal}`} style={{ animationDelay: "0.3s" }}>
          <Link to="/shop">
            <Button variant="primary">
              See our products <IconArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/rfq">
            <Button variant="ghost" className={styles.ghostOnDark}>
              Start an RFQ
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
