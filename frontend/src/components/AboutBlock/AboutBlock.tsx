import { useEffect, useRef, useState } from "react";
import { Link, useLang, useT } from "../../lib/i18n";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import { Button } from "../Button/Button";
import { IconArrowRight, IconCheck } from "../Icon/Icon";
import productImg from "../../assets/product/do-cut.webp";
import styles from "./AboutBlock.module.css";

const POINTS = {
  en: [
    "Premium wear- and corrosion-resistant materials",
    "Short delivery times from our German warehouse",
    "A service level built to impress on every enquiry",
  ],
  de: [
    "Hochwertige verschleiß- und korrosionsbeständige Werkstoffe",
    "Kurze Lieferzeiten aus unserem Lager in Deutschland",
    "Ein Service, der bei jeder Anfrage überzeugt",
  ],
};

const STATS = {
  en: [
    { k: "17+", v: "Years of experience" },
    { k: "Worldwide", v: "Delivery network" },
    { k: "2,100+", v: "Seal references" },
  ],
  de: [
    { k: "17+", v: "Jahre Erfahrung" },
    { k: "Weltweit", v: "Liefernetz" },
    { k: "2.100+", v: "Dichtungsreferenzen" },
  ],
};

const CERTS = ["ISO 9001", "RoHS", "REACH", "CE"];

export function AboutBlock() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const t = useT();
  const lang = useLang();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxRaw = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const parallax = useSpring(parallaxRaw, { stiffness: 60, damping: 20, mass: 0.4 });
  const haloRotate = useTransform(scrollYProgress, [0, 1], [0, 90]);

  return (
    <section className={styles.section} aria-labelledby="about-heading" ref={sectionRef}>
      <div className={`${styles.inner} ${shown ? styles.in : ""}`}>
        <div className={styles.content}>
          <span className={styles.kicker}>
            <span className={styles.flagStripe} aria-hidden="true" />
            {t({ en: "Stocked & shipped from Germany", de: "Lager & Versand ab Deutschland" })}
          </span>
          <h2 id="about-heading">
            {lang === "de" ? (
              <>
                <span>Ihr</span> <span>Spezialist</span> <span>aus Deutschland</span>
              </>
            ) : (
              <>
                <span>Your</span> <span>German</span> <span>specialist</span>
              </>
            )}
          </h2>
          <p className={styles.lead}>
            {t({
              en: "We are a German specialist for high-performance mechanical face seals. With years of experience and German-engineered support, we deliver durable, wear-resistant solutions for mining, construction, agriculture, and defense, stocked and shipped from Germany.",
              de: "Wir sind ein deutscher Spezialist für Hochleistungs-Laufwerksdichtungen. Mit langjähriger Erfahrung und technischem Support aus Deutschland liefern wir langlebige, verschleißfeste Lösungen für Bergbau, Bau, Landwirtschaft und Verteidigung – mit Lager und Versand ab Deutschland.",
            })}
          </p>

          <ul className={styles.points}>
            {POINTS[lang].map((p) => (
              <li key={p}>
                <span className={styles.tick}>
                  <IconCheck size={15} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className={styles.stats}>
            {STATS[lang].map((s) => (
              <div key={s.k} className={styles.stat}>
                <strong>{s.k}</strong>
                <span>{s.v}</span>
              </div>
            ))}
          </div>

          <div className={styles.trust}>
            <span className={styles.trustLabel}>{t({ en: "Certified", de: "Zertifiziert" })}</span>
            <ul>
              {CERTS.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <div className={styles.actions}>
            <Link to="/about-us/">
              <Button variant="primary">
                {t({ en: "More about us", de: "Mehr über uns" })} <IconArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/contact/" className={styles.textLink}>
              {t({ en: "Talk to our team", de: "Sprechen Sie mit uns" })}
            </Link>
          </div>
        </div>

        <motion.div
          className={styles.blueprint}
          style={reduce ? undefined : { y: parallax }}
          aria-hidden="true"
        >
          <span className={styles.bpGrid} />
          <motion.span
            className={styles.bpRing}
            style={reduce ? undefined : { rotate: haloRotate }}
          />
          <span className={styles.scan} />

          <div className={styles.bpStage}>
            <img src={productImg} alt={t({ en: "DO type duo cone mechanical face seal, cut view", de: "Duo-Cone-Laufwerksdichtung Typ DO, Schnittansicht" })} className={styles.product} width={921} height={487} loading="lazy" decoding="async" />

            <svg
              className={styles.leaders}
              viewBox="0 0 400 320"
              preserveAspectRatio="none"
              fill="none"
            >
              <path className={styles.leader} d="M138 92 L52 46" />
              <path className={styles.leader} d="M262 118 L360 74" />
              <path className={styles.leader} d="M150 232 L60 280" />
              <path className={styles.leader} d="M272 214 L360 262" />
            </svg>

            <span className={`${styles.tag} ${styles.tag1}`}>
              <b>Ø 180 mm</b>
              <i>{t({ en: "nominal bore", de: "Nennbohrung" })}</i>
            </span>
            <span className={`${styles.tag} ${styles.tag2}`}>
              <b>{t({ en: "Hardened face", de: "Gehärtete Fläche" })}</b>
              <i>58–62 HRC</i>
            </span>
            <span className={`${styles.tag} ${styles.tag3}`}>
              <b>{t({ en: "Elastomer ring", de: "Elastomerring" })}</b>
              <i>FKM / NBR</i>
            </span>
            <span className={`${styles.tag} ${styles.tag4}`}>
              <b>Rz 0.2 µm</b>
              <i>{t({ en: "lapped finish", de: "geläppt" })}</i>
            </span>
          </div>

          <span className={styles.titleBlock}>
            <b>{t({ en: "DUO CONE · DF TYPE", de: "DUO CONE · TYP DF" })}</b>
            <span>DIN ISO 2768&#8209;m · SHEET 1/1</span>
          </span>
        </motion.div>
      </div>
    </section>
  );
}
