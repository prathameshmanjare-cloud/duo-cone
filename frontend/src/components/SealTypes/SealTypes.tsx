import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { IconCheck, IconArrowRight } from "../Icon/Icon";
import { ProductSearch } from "../ProductSearch/ProductSearch";
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
      "Mechanical face seal with a single rubber loading ring. Widely used on older John Deere machines. The simple press-in mount makes field repair fast, with fitment matched exactly to the OEM reference.",
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

const HEADLINE = ["DF", "&", "DO", "mechanical", "face", "seals"];

function onHeroMove(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

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
      <header className={styles.hero} onMouseMove={onHeroMove}>
        <div className={styles.decor} aria-hidden="true">
          <span className={styles.gridBg} />
          <span className={`${styles.orb} ${styles.orbBlue}`} />
          <span className={`${styles.orb} ${styles.orbGold}`} />
          <span className={styles.spotlight} />
        </div>

        <div className={styles.heroCopy}>
          <span className={styles.kicker} style={{ "--d": "0ms" } as CSSProperties}>
            Two proven designs
          </span>
          <h1 id="seal-types-heading" aria-label="DF & DO mechanical face seals">
            {HEADLINE.map((w, i) => (
              <span key={i} className={styles.word} aria-hidden="true">
                <span
                  className={`${styles.wordInner} ${w === "DF" || w === "DO" ? styles.accent : ""}`}
                  style={{ "--d": `${120 + i * 70}ms` } as CSSProperties}
                >
                  {w}
                </span>
              </span>
            ))}
          </h1>
          <p className={styles.rise} style={{ "--d": "560ms" } as CSSProperties}>
            <span>Both built from the same premium, wear-resistant materials.</span>{" "}
            <span className={styles.line}>The loading element is what sets them apart.</span>
          </p>
        </div>
        <div className={`${styles.searchWrap} ${styles.rise}`} style={{ "--d": "700ms" } as CSSProperties}>
          <ProductSearch className={styles.search} placeholder="Search by part no., SKU or OEM ref…" />
        </div>
        <div className={`${styles.heroMeta} ${styles.rise}`} style={{ "--d": "840ms" } as CSSProperties}>
          <span className={styles.shipBadge}>
            <span className={styles.dot} /> Ships within 24 hours
          </span>
          <span className={styles.metaLine}>DF · DO · Universal</span>
        </div>
      </header>

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
