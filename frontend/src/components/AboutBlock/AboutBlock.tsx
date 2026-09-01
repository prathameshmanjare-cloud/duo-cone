import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import { Button } from "../Button/Button";
import { IconArrowRight, IconCheck } from "../Icon/Icon";
import productImg from "../../assets/product/do-cut.png";

const ringImg = "/hero-bg.svg";
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
  const ringRotate = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section className={styles.section} aria-labelledby="about-heading" ref={sectionRef}>
      <div className={`${styles.inner} ${shown ? styles.in : ""}`}>
        <div className={styles.content}>
          <span className={styles.kicker}>Made in Germany</span>
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
              <div key={s.k}>
                <strong>{s.k}</strong>
                <span>{s.v}</span>
              </div>
            ))}
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
          className={styles.visual}
          style={reduce ? undefined : { y: parallax }}
          aria-hidden="true"
        >
          <motion.img
            src={ringImg}
            alt=""
            className={styles.ring}
            style={reduce ? undefined : { rotate: ringRotate }}
          />
          <div className={styles.card}>
            <img src={productImg} alt="" className={styles.product} />
          </div>
          <span className={`${styles.chip} ${styles.chipA}`}>ISO-grade materials</span>
          <span className={`${styles.chip} ${styles.chipB}`}>24-month warranty</span>
          <span className={`${styles.chip} ${styles.chipC}`}>Ships in 72h</span>
        </motion.div>
      </div>
    </section>
  );
}
