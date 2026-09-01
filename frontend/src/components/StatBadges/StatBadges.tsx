import { useEffect, useRef, useState } from "react";
import styles from "./StatBadges.module.css";

interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  format?: (n: number) => string;
}

const STATS: Stat[] = [
  { value: 24, suffix: "h", label: "Express RFQ turnaround" },
  { value: 72, suffix: "h", label: "Shipping from Germany" },
  { value: 2100, suffix: "+", label: "Seals in stock", format: (n) => n.toLocaleString("en-US") },
  { value: 24, suffix: "mo", label: "Warranty on every seal" },
];

const DURATION = 900;

function CountUp({ stat, start }: { stat: Stat; start: boolean }) {
  const [n, setN] = useState(0);
  const prefersReduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!start) return;

    if (prefersReduced || typeof requestAnimationFrame === "undefined") {
      setN(stat.value);
      return;
    }
    setN(0);

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(stat.value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const fallback = window.setTimeout(() => setN(stat.value), DURATION + 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [start, stat.value, prefersReduced]);

  const shown = stat.format ? stat.format(n) : String(n);
  return (
    <span className={styles.value}>
      {stat.prefix}
      {shown}
      {stat.suffix}
    </span>
  );
}

export function StatBadges() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.wrap} aria-label="Key facts">
      <div ref={ref} className={`${styles.grid} ${visible ? styles.in : ""}`}>
        {STATS.map((s, i) => (
          <div key={s.label} className={styles.item} style={{ transitionDelay: `${i * 90}ms` }}>
            <CountUp stat={s} start={visible} />
            <span className={styles.label}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
