import { useEffect, useRef, useState } from "react";
import { useT } from "../../lib/i18n";
import styles from "./StatBadges.module.css";

interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: { en: string; de: string };
  /** thousands separator in the page language */
  grouped?: boolean;
}

const STATS: Stat[] = [
  { value: 12, suffix: "h", label: { en: "Express RFQ turnaround", de: "Express-Angebot" } },
  { value: 24, suffix: "h", label: { en: "Shipping from Germany", de: "Versand ab Deutschland" } },
  { value: 2100, suffix: "+", label: { en: "Seals in stock", de: "Dichtungen auf Lager" }, grouped: true },
  { value: 5000, suffix: " h+", label: { en: "Assurance on every unit", de: "Lebensdauer je Dichtung" }, grouped: true },
];

const DURATION = 900;

function CountUp({ stat, start, locale }: { stat: Stat; start: boolean; locale: string }) {
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

  const shown = stat.grouped ? n.toLocaleString(locale) : String(n);
  return (
    <span className={styles.value}>
      {stat.prefix}
      {shown}
      {stat.suffix}
    </span>
  );
}

export function StatBadges() {
  const t = useT();
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
    <section className={styles.wrap} aria-label={t({ en: "Key facts", de: "Kennzahlen" })}>
      <div ref={ref} className={`${styles.grid} ${visible ? styles.in : ""}`}>
        {STATS.map((s, i) => (
          <div key={s.label.en} className={styles.item} style={{ transitionDelay: `${i * 90}ms` }}>
            <CountUp stat={s} start={visible} locale={t({ en: "en-US", de: "de-DE" })} />
            <span className={styles.label}>{t(s.label)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
