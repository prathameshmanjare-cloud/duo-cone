import { Fragment, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Link, useLang, useT } from "../../lib/i18n";
import { motion, useReducedMotion } from "framer-motion";
import { IconCheck, IconArrowRight } from "../Icon/Icon";
import { ProductSearch } from "../ProductSearch/ProductSearch";
import dfImg from "../../assets/product/df-cut.webp";
import doImg from "../../assets/product/do-cut.webp";
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
    to: "/shop/?seal_type=DF",
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
      "Lifetime sealing for hydraulics and final drives",
    ],
    to: "/shop/?seal_type=DO",
  },
];

const TYPES_DE: SealType[] = [
  {
    code: "DF",
    title: "Typ DF",
    image: dfImg,
    blurb:
      "Laufwerksdichtung mit einem einzelnen Gummi-Anpressring. Weit verbreitet an älteren John-Deere-Maschinen. Die einfache Einpressmontage macht Reparaturen im Feld schnell; die Abmessungen entsprechen exakt der OEM-Referenz.",
    chips: ["Ein Anpressring", "OEM-gleicher Ø", "58–62 HRC", "24 Monate Gewährleistung"],
    features: [
      "Einfache Einpressmontage für schnelle Reparatur",
      "Ersetzt alle OEM-Referenzen vom Typ DF",
      "Dichtflächen aus NI-HARD (ASTM A532) / SAE 52100",
    ],
    to: "/shop/?seal_type=DF",
  },
  {
    code: "DO",
    title: "Typ DO",
    image: doImg,
    blurb:
      "Die am weitesten verbreitete Duo-Cone-Bauform, abgedichtet durch zwei O-Ringe – für raue Einsätze unter hohem Druck. Korrosionsbeständiges Metall und Elastomere sorgen für eine dauerhafte Abdichtung in Antrieben von Bergbau- und Baumaschinen.",
    chips: ["Zwei O-Ringe", "Hochdruck", "Korrosionsbeständig", "5.000–8.000 h Lebensdauer"],
    features: [
      "Zwei O-Ringe für härteste Bedingungen",
      "Korrosionsbeständiger Metall- und Elastomersatz",
      "Dauerhafte Abdichtung für Hydraulik und Endantriebe",
    ],
    to: "/shop/?seal_type=DO",
  },
];

const HEADLINE = {
  en: ["DF", "&", "DO", "mechanical", "face", "seals"],
  de: ["Laufwerksdichtungen", "Typ", "DF", "&", "DO"],
};

function onHeroMove(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export function SealTypes() {
  const reduce = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const t = useT();
  const lang = useLang();
  const types = lang === "de" ? TYPES_DE : TYPES;

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
            {t({ en: "Two proven designs", de: "Zwei bewährte Bauformen" })}
          </span>
          <h1 id="seal-types-heading" aria-label={HEADLINE[lang].join(" ")}>
            {HEADLINE[lang].map((w, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span className={styles.word} aria-hidden="true">
                  <span
                    className={`${styles.wordInner} ${w === "DF" || w === "DO" ? styles.accent : ""}`}
                    style={{ "--d": `${120 + i * 70}ms` } as CSSProperties}
                  >
                    {w}
                  </span>
                </span>
              </Fragment>
            ))}
          </h1>
          <p className={styles.rise} style={{ "--d": "560ms" } as CSSProperties}>
            <span>{t({ en: "Both built from the same premium, wear-resistant materials.", de: "Beide aus denselben hochwertigen, verschleißfesten Werkstoffen." })}</span>{" "}
            <span className={styles.line}>{t({ en: "The loading element is what sets them apart.", de: "Der Unterschied liegt im Anpresselement." })}</span>
          </p>
        </div>
        <div className={`${styles.searchWrap} ${styles.rise}`} style={{ "--d": "700ms" } as CSSProperties}>
          <ProductSearch className={styles.search} placeholder={t({ en: "Search by part no., SKU or OEM ref…", de: "Nach Teilenummer, Artikelnr. oder OEM-Ref. suchen…" })} />
        </div>
        <div className={`${styles.heroMeta} ${styles.rise}`} style={{ "--d": "840ms" } as CSSProperties}>
          <span className={styles.shipBadge}>
            <span className={styles.dot} /> {t({ en: "Ships within 24 hours", de: "Versand innerhalb von 24 Stunden" })}
          </span>
          <span className={styles.metaLine}>{t({ en: "Universal OEM fit", de: "Passend für alle gängigen OEM-Referenzen" })}</span>
        </div>
      </header>

      <div ref={gridRef} className={`${styles.grid} ${shown ? styles.in : ""}`}>
        {types.map((ty, i) => (
          <motion.article
            key={ty.code}
            className={styles.card}
            style={{ transitionDelay: `${i * 110}ms` }}
            whileHover={reduce ? undefined : { y: -8 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <div className={styles.media}>
              <span className={styles.badge}>{ty.code}</span>
              {/* first screen of the home page: load right away */}
              <img
                src={ty.image}
                alt={t({ en: `${ty.title} Duo Cone mechanical face seal, cut view`, de: `Duo-Cone-Laufwerksdichtung ${ty.title}, Schnittansicht` })}
                width={921}
                height={487}
                fetchPriority={i === 0 ? "high" : undefined}
              />
              <div className={styles.mediaGlow} aria-hidden="true" />
            </div>

            <div className={styles.body}>
              <h2>{ty.title}</h2>
              <p className={styles.blurb}>{ty.blurb}</p>

              <ul className={styles.chips}>
                {ty.chips.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>

              <ul className={styles.features}>
                {ty.features.map((f) => (
                  <li key={f}>
                    <IconCheck size={16} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link to={ty.to} className={styles.cta}>
                {t({ en: `Explore ${ty.code} seals`, de: `${ty.code}-Dichtungen ansehen` })} <IconArrowRight size={16} />
              </Link>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
