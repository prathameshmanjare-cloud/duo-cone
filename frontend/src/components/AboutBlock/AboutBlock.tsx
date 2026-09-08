import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import { Button } from "../Button/Button";
import { IconArrowRight, IconCheck } from "../Icon/Icon";
import productImg from "../../assets/product/do-cut.png";
import styles from "./AboutBlock.module.css";

const POINTS = [
  "Premium wear- and corrosion-resistant materials",
  "Short delivery times from our German warehouse",
  "A service level built to impress on every enquiry",
];

const STATS = [
  { k: "20+", v: "Years of experience" },
  { k: "EU-wide", v: "Delivery network" },
  { k: "2,100+", v: "Seal references" },
];

const CERTS = ["ISO 9001", "RoHS", "REACH", "CE"];

export function AboutBlock() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

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
            Made in Germany
          </span>
          <h2 id="about-heading">
            <span>Leading</span> <span>German</span> <span>producer</span>
          </h2>
          <p className={styles.lead}>
            We are a German manufacturer of high-performance mechanical face seals. With years of
            experience and advanced technology, we deliver durable, wear-resistant solutions for mining,
            construction, agriculture, and defense.
          </p>

          <ul className={styles.points}>
            {POINTS.map((p) => (
              <li key={p}>
                <span className={styles.tick}>
                  <IconCheck size={15} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className={styles.stats}>
            {STATS.map((s) => (
              <div key={s.k} className={styles.stat}>
                <strong>{s.k}</strong>
                <span>{s.v}</span>
              </div>
            ))}
          </div>

          <div className={styles.trust}>
            <span className={styles.trustLabel}>Certified</span>
            <ul>
              {CERTS.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <div className={styles.actions}>
            <Link to="/about">
              <Button variant="primary">
                More about us <IconArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/contact" className={styles.textLink}>
              Talk to our team
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
            <img src={productImg} alt="" className={styles.product} />

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
              <i>nominal bore</i>
            </span>
            <span className={`${styles.tag} ${styles.tag2}`}>
              <b>Hardened face</b>
              <i>58–62 HRC</i>
            </span>
            <span className={`${styles.tag} ${styles.tag3}`}>
              <b>Elastomer ring</b>
              <i>FKM / NBR</i>
            </span>
            <span className={`${styles.tag} ${styles.tag4}`}>
              <b>Rz 0.2 µm</b>
              <i>lapped finish</i>
            </span>
          </div>

          <span className={styles.titleBlock}>
            <b>DUO CONE · DF TYPE</b>
            <span>MADE IN GERMANY · DIN ISO 2768&#8209;m · SHEET 1/1</span>
          </span>
        </motion.div>
      </div>
    </section>
  );
}
