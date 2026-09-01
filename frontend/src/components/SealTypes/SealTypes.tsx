import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { IconCheck, IconArrowRight } from "../Icon/Icon";
import dfImg from "../../assets/product/df-cut.png";
import doImg from "../../assets/product/do-cut.png";
import styles from "./SealTypes.module.css";

interface SealType {
  code: string;
  title: string;
  image: string;
  blurb: string;
  chips: string[];
  features: string[];
  to: string;
}

const TYPES: SealType[] = [
  {
    code: "DF",
    title: "DF Type",
    image: dfImg,
    blurb:
      "Mechanical face seal with a single rubber loading ring. Widely used on older John Deere machines — the simple press-in mount makes field repair fast, with fitment matched exactly to the OEM reference.",
    chips: ["Single load ring", "OEM-matched Ø", "58–62 HRC", "24-mo warranty"],
    features: [
      "Easy press-in mounting for quick repair",
      "Replaces all OEM DF-type references",
      "NI-HARD (ASTM A532) / SAE 52100 seal faces",
    ],
    to: "/shop?seal_type=DF",
  },
  {
    code: "DO",
    title: "DO Type",
    image: doImg,
    blurb:
      "The most common Duo Cone design, sealed by two O-rings for harsh, high-pressure duty. Anti-corrosive metal and elastomers deliver a lifetime sealing solution in mining and construction drivetrains.",
    chips: ["Twin O-ring", "High-pressure", "Anti-corrosive", "5,000–8,000 h life"],
    features: [
      "Two O-rings for the most demanding conditions",
      "Corrosion-resistant metal and elastomer set",
      "Lifetime sealing for hydraulics & final drives",
    ],
    to: "/shop?seal_type=DO",
  },
];

export function SealTypes() {
  const reduce = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.section} aria-labelledby="seal-types-heading">
      <div className={styles.head}>
        <span className={styles.kicker}>Two proven designs</span>
        <h2 id="seal-types-heading">DF &amp; DO mechanical face seals</h2>
        <p>
          Both built from the same premium, wear-resistant materials — the loading element is what sets
          them apart.
        </p>
      </div>

      <div ref={gridRef} className={`${styles.grid} ${shown ? styles.in : ""}`}>
        {TYPES.map((t, i) => (
          <motion.article
            key={t.code}
            className={styles.card}
            style={{ transitionDelay: `${i * 110}ms` }}
            whileHover={reduce ? undefined : { y: -8 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <div className={styles.media}>
              <span className={styles.badge}>{t.code}</span>
              <img src={t.image} alt={`${t.title} Duo Cone mechanical face seal, cut view`} loading="lazy" />
              <div className={styles.mediaGlow} aria-hidden="true" />
            </div>

            <div className={styles.body}>
              <h3>{t.title}</h3>
              <p className={styles.blurb}>{t.blurb}</p>

              <ul className={styles.chips}>
                {t.chips.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>

              <ul className={styles.features}>
                {t.features.map((f) => (
                  <li key={f}>
                    <IconCheck size={16} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link to={t.to} className={styles.cta}>
                Explore {t.code} seals <IconArrowRight size={16} />
              </Link>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
