import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useMotionTemplate, useReducedMotion } from "framer-motion";
import { IconArrowRight } from "../Icon/Icon";
import styles from "./Industries.module.css";

import mining from "../../assets/industries/mining.jpg";
import construction from "../../assets/industries/construction.jpg";
import agri from "../../assets/industries/agri.jpg";
import rec from "../../assets/industries/rec.jpg";
import forest from "../../assets/industries/forest.jpg";
import military from "../../assets/industries/military.jpg";
import heavy from "../../assets/industries/heavy.jpg";
import cement from "../../assets/industries/cement.jpg";
import water from "../../assets/industries/water.jpg";
import uc from "../../assets/industries/uc.jpg";
import pump from "../../assets/industries/pump.jpg";
import tunel from "../../assets/industries/tunel.jpg";

type Item = { name: string; img: string; blurb: string; big?: boolean };

const ITEMS: Item[] = [
  { name: "Mining", img: mining, blurb: "Face seals for excavators & haul trucks in abrasive ground", big: true },
  { name: "Construction", img: construction, blurb: "Sealing for hydraulic systems on loaders & excavators" },
  { name: "Agricultural", img: agri, blurb: "Wear-resistant seals for tractors & harvesters" },
  { name: "Recycling", img: rec, blurb: "Reliable sealing in shredders & baling lines" },
  { name: "Forestry", img: forest, blurb: "Seals for harvesters & forwarders in mud and debris" },
  { name: "Military", img: military, blurb: "Defense-grade sealing for tracked & wheeled vehicles", big: true },
  { name: "Heavy Engineering", img: heavy, blurb: "Custom face seals for gearboxes & drivetrains" },
  { name: "Cement Milling", img: cement, blurb: "Sealing for mills & kilns under dust and heat" },
  { name: "Waste Water", img: water, blurb: "Corrosion-resistant seals for pumps & treatment plants", big: true },
  { name: "Undercarriage", img: uc, blurb: "Track roller & idler seals for crawler machines" },
  { name: "Pump & Valves", img: pump, blurb: "Face seals for industrial pumps & valve actuators" },
  { name: "Tunnel Boring", img: tunel, blurb: "Main-drive sealing for TBM cutter heads" },
];

const ease = [0.22, 1, 0.36, 1] as const;

function Tile({ item, index }: { item: Item; index: number }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(240px circle at ${mx}% ${my}%, rgba(253, 196, 0, 0.35), transparent 70%)`;

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  }

  return (
    <motion.article
      className={`${styles.cell} ${item.big ? styles.big : ""}`}
      style={{ animationDelay: `${index * 55}ms` }}
      initial={reduce ? undefined : "rest"}
      whileHover={reduce ? undefined : "hover"}
    >
      <Link to="/industries" className={styles.tile} onMouseMove={onMove} aria-label={item.name}>
        <motion.img
          src={item.img}
          alt={`${item.name} equipment`}
          loading="lazy"
          className={styles.img}
          variants={{ rest: { scale: 1 }, hover: { scale: 1.12 } }}
          transition={{ duration: 0.7, ease }}
        />
        <span className={styles.scrim} aria-hidden="true" />
        {!reduce && (
          <motion.span className={styles.spotlight} style={{ background: spotlight }} aria-hidden="true" />
        )}

        <span className={styles.index} aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className={styles.caption}>
          <div className={styles.captionRow}>
            <span className={styles.name}>{item.name}</span>
            <motion.span
              className={styles.go}
              variants={{ rest: { opacity: 0, x: -6 }, hover: { opacity: 1, x: 0 } }}
              transition={{ duration: 0.3, ease }}
            >
              <IconArrowRight size={16} />
            </motion.span>
          </div>
          <motion.p
            className={styles.blurb}
            variants={{
              rest: { opacity: 0, height: 0, marginTop: 0 },
              hover: { opacity: 1, height: "auto", marginTop: 6 },
            }}
            transition={{ duration: 0.35, ease }}
          >
            {item.blurb}
          </motion.p>
        </div>

        <motion.span
          className={styles.bar}
          aria-hidden="true"
          variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
          transition={{ duration: 0.4, ease }}
        />
      </Link>
    </motion.article>
  );
}

export function Industries() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
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
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.section} aria-labelledby="industries-heading">
      <div className={styles.head}>
        <div>
          <span className={styles.kicker}>Where our seals work</span>
          <h2 id="industries-heading">Trusted across industries</h2>
          <p className={styles.sub}>Twelve demanding sectors — one sealing standard.</p>
        </div>
        <Link to="/industries" className={styles.headLink}>
          All industries <IconArrowRight size={16} />
        </Link>
      </div>

      <div ref={ref} className={`${styles.grid} ${shown ? styles.in : ""}`}>
        {ITEMS.map((it, i) => (
          <Tile key={it.name} item={it} index={i} />
        ))}
      </div>
    </section>
  );
}
