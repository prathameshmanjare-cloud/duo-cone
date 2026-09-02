import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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

type Item = { name: string; img: string; blurb: string };

const ITEMS: Item[] = [
  { name: "Mining", img: mining, blurb: "Face seals for excavators & haul trucks in abrasive ground" },
  { name: "Construction", img: construction, blurb: "Sealing for hydraulic systems on loaders & excavators" },
  { name: "Agricultural", img: agri, blurb: "Wear-resistant seals for tractors & harvesters" },
  { name: "Recycling", img: rec, blurb: "Reliable sealing in shredders & baling lines" },
  { name: "Forestry", img: forest, blurb: "Seals for harvesters & forwarders in mud and debris" },
  { name: "Military", img: military, blurb: "Defense-grade sealing for tracked & wheeled vehicles" },
  { name: "Heavy Engineering", img: heavy, blurb: "Custom face seals for gearboxes & drivetrains" },
  { name: "Cement Milling", img: cement, blurb: "Sealing for mills & kilns under dust and heat" },
  { name: "Waste Water", img: water, blurb: "Corrosion-resistant seals for pumps & treatment plants" },
  { name: "Undercarriage", img: uc, blurb: "Track roller & idler seals for crawler machines" },
  { name: "Pump & Valves", img: pump, blurb: "Face seals for industrial pumps & valve actuators" },
  { name: "Tunnel Boring", img: tunel, blurb: "Main-drive sealing for TBM cutter heads" },
];

const N = ITEMS.length;
const AUTO_MS = 3800;
const VISIBLE = 3; // cards shown each side of center
const ease = [0.22, 1, 0.36, 1] as const;

/** shortest signed distance from active on the ring */
function offsetOf(i: number, active: number) {
  let d = i - active;
  if (d > N / 2) d -= N;
  if (d < -N / 2) d += N;
  return d;
}

export function Industries() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);

  const go = useCallback((dir: number) => {
    setActive((i) => (i + dir + N) % N);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || !inView || paused) return;
    const id = window.setInterval(() => go(1), AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduce, inView, paused, go]);

  // keyboard arrows when focused within
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  }

  // pointer drag
  const drag = useRef<{ x: number; done: boolean } | null>(null);
  function onPointerDown(e: React.PointerEvent) {
    drag.current = { x: e.clientX, done: false };
    setPaused(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.done) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 60) {
      go(dx < 0 ? 1 : -1);
      d.done = true;
    }
  }
  function onPointerUp() {
    drag.current = null;
    setPaused(false);
  }

  const current = ITEMS[active];

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

      <div
        ref={ref}
        className={`${styles.coverflow} ${inView ? styles.in : ""}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        role="group"
        aria-roledescription="carousel"
        aria-label="Industries"
        tabIndex={0}
      >
        <span className={styles.ghost} aria-hidden="true">
          {String(active + 1).padStart(2, "0")}
        </span>

        <div className={styles.stage}>
          {ITEMS.map((it, i) => {
            const off = offsetOf(i, active);
            const abs = Math.abs(off);
            const hidden = abs > VISIBLE;
            const isActive = off === 0;
            const style: React.CSSProperties = reduce
              ? {
                  transform: "translate(-50%, -50%)",
                  opacity: isActive ? 1 : 0,
                  pointerEvents: isActive ? "auto" : "none",
                }
              : {
                  transform: `translate(-50%, -50%) translateX(${off * 42}%) translateZ(${
                    -abs * 130
                  }px) rotateY(${off * -34}deg) scale(${isActive ? 1 : 0.92})`,
                  opacity: hidden ? 0 : 1 - abs * 0.16,
                  zIndex: N - abs,
                  filter: isActive ? "none" : "brightness(0.62) saturate(0.85)",
                  pointerEvents: hidden ? "none" : "auto",
                };

            return (
              <button
                key={it.name}
                type="button"
                className={`${styles.card} ${isActive ? styles.cardOn : ""}`}
                style={style}
                aria-hidden={hidden}
                aria-label={isActive ? undefined : `Show ${it.name}`}
                tabIndex={hidden ? -1 : 0}
                onClick={() => (isActive ? undefined : setActive(i))}
              >
                <img src={it.img} alt={`${it.name} equipment`} className={styles.shot} draggable={false} />
                <span className={styles.cardScrim} aria-hidden="true" />
                <span className={styles.cardNum} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.cardName}>{it.name}</span>
                {isActive && <span className={styles.cardGlow} aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        {/* caption */}
        <div className={styles.caption}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -16 }}
              transition={{ duration: 0.34, ease }}
              className={styles.captionInner}
            >
              <span className={styles.captionCount}>
                {String(active + 1).padStart(2, "0")} <i>/ {String(N).padStart(2, "0")}</i>
              </span>
              <h3 className={styles.captionName}>{current.name}</h3>
              <p className={styles.captionBlurb}>{current.blurb}</p>
              <Link to="/industries" className={styles.captionLink}>
                Explore applications <IconArrowRight size={16} />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={styles.dots}>
          {ITEMS.map((it, i) => (
            <button
              key={it.name}
              type="button"
              className={`${styles.dot} ${i === active ? styles.dotOn : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Show ${it.name}`}
              aria-current={i === active}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
