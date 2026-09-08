import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../Button/Button";
import { IconArrowRight } from "../Icon/Icon";
import slideWelcome from "../../assets/industries/heavy.jpg";
import slideTech from "../../assets/industries/tunel.jpg";
import slideIndustries from "../../assets/industries/mining.jpg";
import slideSupport from "../../assets/industries/cement.jpg";
import styles from "./HeroSlider.module.css";

type Slide = {
  img: string;
  eyebrow: string;
  nav: string;
  title: string;
  copy: string;
  chips: string[];
  cta: string;
  to: string;
  secondary?: { label: string; to: string };
};

const SLIDES: Slide[] = [
  {
    img: slideWelcome,
    eyebrow: "DUO-CONE",
    nav: "Welcome",
    title: "Welcome to DUO-CONE",
    copy: "German-engineered mechanical face seals (DF and DO type) for the heaviest duty on earth. Stocked in Engelskirchen, shipped within 72 hours.",
    chips: ["DF & DO type", "72h dispatch", "DIN EN ISO 9001"],
    cta: "Browse the shop",
    to: "/shop",
  },
  {
    img: slideTech,
    eyebrow: "Engineering",
    nav: "Technology",
    title: "Innovation & Technology",
    copy: "Centrifugal casting, optical face lapping and proprietary elastomer science. Every seal validated on our own endurance rigs.",
    chips: ["Ra < 0.13 µm", "Optical lapping", "Endurance rigs"],
    cta: "Explore the technology",
    to: "/technology",
    secondary: { label: "About us", to: "/about" },
  },
  {
    img: slideIndustries,
    eyebrow: "Field-proven",
    nav: "Industries",
    title: "Reliability & Industries",
    copy: "Mining, construction, tunnel boring, forestry, defense and cement. Zero-leakage sealing where downtime is not an option.",
    chips: ["12 sectors", "Zero leakage", "0.5 MPa rated"],
    cta: "See the industries",
    to: "/industries",
  },
  {
    img: slideSupport,
    eyebrow: "Partnership",
    nav: "Support",
    title: "Manufacture & Technical Support",
    copy: "Direct access to senior sealing engineers, CAD cross-section validation and binding quotations inside 24 hours.",
    chips: ["24h quotation", "CAD validation", "Made in Germany"],
    cta: "Contact us",
    to: "/contact",
    secondary: { label: "Start a partnership", to: "/rfq" },
  },
];

const INTERVAL = 6500;

function prefersReduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = SLIDES.length;
  const reduce = prefersReduced();

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (reduce || paused) return;
    timer.current = window.setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => window.clearTimeout(timer.current);
  }, [index, paused, reduce, count]);

  // lightweight pointer parallax via CSS custom properties
  const rootRef = useRef<HTMLElement>(null);
  const raf = useRef<number | undefined>(undefined);
  function onMove(e: MouseEvent<HTMLElement>) {
    if (reduce || !rootRef.current) return;
    const r = rootRef.current.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      rootRef.current?.style.setProperty("--px", nx.toFixed(3));
      rootRef.current?.style.setProperty("--py", ny.toFixed(3));
    });
  }
  function resetParallax() {
    rootRef.current?.style.setProperty("--px", "0");
    rootRef.current?.style.setProperty("--py", "0");
  }

  return (
    <section
      ref={rootRef}
      className={styles.slider}
      aria-roledescription="carousel"
      aria-label="DUO-CONE highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseMove={onMove}
      onMouseLeave={() => {
        setPaused(false);
        resetParallax();
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={styles.stage}>
        {SLIDES.map((s, i) => (
          <div
            key={s.title}
            className={`${styles.slide} ${i === index ? styles.active : ""}`}
            data-kb={i % 2}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${s.title}`}
            aria-hidden={i !== index}
          >
            <img className={styles.bg} src={s.img} alt="" loading={i === 0 ? "eager" : "lazy"} />
          </div>
        ))}
        <div className={styles.scrim} aria-hidden="true" />
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />
        <div className={styles.topFade} aria-hidden="true" />
      </div>

      <div className={styles.inner}>
        <span className={styles.corner} data-c="tl" aria-hidden="true" />
        <span className={styles.corner} data-c="br" aria-hidden="true" />
        <span className={styles.ghostNum} aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>

        {SLIDES.map((s, i) => {
          const on = i === index;
          const words = s.title.split(" ");
          return (
            <div
              key={s.title}
              className={`${styles.content} ${on ? styles.contentOn : ""}`}
              style={{ "--words": words.length } as CSSProperties}
              aria-hidden={!on}
            >
              <span className={styles.eyebrow}>
                <span className={styles.tick} /> {String(i + 1).padStart(2, "0")} · {s.eyebrow}
              </span>

              <h1 className={styles.title} aria-label={s.title}>
                {words.map((w, wi) => (
                  <span key={wi} className={styles.wordMask}>
                    <span
                      className={`${styles.word} ${w === "&" ? styles.amp : ""}`}
                      style={{ "--wi": wi } as CSSProperties}
                    >
                      {w}
                    </span>
                  </span>
                ))}
              </h1>

              <p className={styles.copy}>{s.copy}</p>

              <div className={styles.actions}>
                <Link to={s.to} tabIndex={on ? 0 : -1}>
                  <Button variant="primary">
                    {s.cta} <IconArrowRight size={18} />
                  </Button>
                </Link>
                {s.secondary && (
                  <Link to={s.secondary.to} className={styles.secondary} tabIndex={on ? 0 : -1}>
                    {s.secondary.label}
                  </Link>
                )}
              </div>

              <ul className={styles.chips}>
                {s.chips.map((c) => (
                  <li key={c} className={styles.chip}>
                    <span className={styles.chipDot} /> {c}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <button type="button" className={`${styles.arrow} ${styles.prev}`} onClick={prev} aria-label="Previous slide">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>
      <button type="button" className={`${styles.arrow} ${styles.nextBtn}`} onClick={next} aria-label="Next slide">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      <div className={styles.rail}>
        <div className={styles.count}>
          <span className={styles.countNow}>{String(index + 1).padStart(2, "0")}</span>
          <span className={styles.countAll}>/ {String(count).padStart(2, "0")}</span>
        </div>
        <div className={styles.track} role="tablist" aria-label="Choose slide">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={s.title}
              className={`${styles.seg} ${i === index ? styles.segOn : ""}`}
              onClick={() => go(i)}
            >
              <span className={styles.segLabel}>{s.nav}</span>
              <span className={styles.segBar}>
                {i === index && (
                  <span
                    key={reduce ? "static" : index}
                    className={reduce ? styles.segFillStatic : styles.segFill}
                    style={
                      reduce
                        ? undefined
                        : {
                            animationDuration: `${INTERVAL}ms`,
                            animationPlayState: paused ? "paused" : "running",
                          }
                    }
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
