import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { IconArrowRight, IconCheck } from "../../components/Icon/Icon";
import productImg from "../../assets/product/df-cut.png";
import styles from "./Technology.module.css";

/* ---- lightweight line icons ---- */
const I = {
  cast: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h14l-2 6H7L5 3zM7 9c0 6 2 12 5 12s5-6 5-12" />
      <path d="M9 13h6" />
    </svg>
  ),
  lathe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="12" r="5" />
      <path d="M9 12h.01M14 12h7M4 20h16M4 4h4" />
    </svg>
  ),
  mold: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="8" rx="2" />
      <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 16v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />
    </svg>
  ),
  grind: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
    </svg>
  ),
  heat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2s5 4.5 5 9a5 5 0 0 1-10 0c0-1.7.7-3.2 1.5-4.4C9 8 12 6 12 2z" />
      <path d="M12 21a3 3 0 0 0 3-3c0-1.5-1.5-3-3-4-1.5 1-3 2.5-3 4a3 3 0 0 0 3 3z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
};

const CAPABILITIES = [
  {
    icon: I.cast,
    title: "Centrifugal casting with Ni-Hard cast iron",
    body: "A specialised casting method for producing high-strength, wear-resistant cylindrical components, particularly in Ni-Hard cast iron.",
  },
  {
    icon: I.lathe,
    title: "Precision machining & lapping",
    body: "Computer-controlled CNC turning for precise part shaping, plus spherical, flat and finish lapping for extremely fine surfaces and tight tolerances.",
  },
  {
    icon: I.mold,
    title: "Compression rubber moulding",
    body: "Expertise in moulding high-performance elastomers — NBR, HNBR, FKM and silicone — critical for durable seals and industrial components.",
  },
  {
    icon: I.grind,
    title: "Precision grinding",
    body: "Centreless, bore and surface grinding to guarantee exact dimensions and superior surface finishes.",
  },
  {
    icon: I.heat,
    title: "Heat treatment",
    body: "Hardening, tempering, cryogenic treatment, induction hardening, carburising, gas nitriding, laser treatment and plug quenching — tuned for demanding applications.",
  },
  {
    icon: I.shield,
    title: "Surface treatments",
    body: "Shot blasting, amorphous phosphating, CED coating, MoS₂ and WS₂ coatings, and Zn passivation to improve durability in harsh environments.",
  },
];

const RESEARCH = [
  "Solutions for high-speed surface performance up to 10 m/s.",
  "Models for predicting wear life on contact surfaces.",
  "Research in elastomeric variable-load stress relaxation.",
  "Innovative surface treatments tailored for demanding applications.",
  "Functional integrity of Ni-Hard cast alloys and sealing surfaces in abrasive conditions.",
];

const STATS = [
  { k: "10 m/s", v: "Surface speed capability" },
  { k: "58–62 HRC", v: "Hardened seal faces" },
  { k: "6", v: "In-house process families" },
];

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setShown(true);
    const io = new IntersectionObserver(
      (e) => e[0].isIntersecting && (setShown(true), io.disconnect()),
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown] as const;
}

export function Technology() {
  const [heroRef, heroIn] = useInView<HTMLDivElement>();
  const [capRef, capIn] = useInView<HTMLDivElement>();
  const [innoRef, innoIn] = useInView<HTMLDivElement>();

  return (
    <div className={styles.wrap}>
      <Helmet>
        <title>Technology | DuoCon</title>
        <meta
          name="description"
          content="DuoCon's advanced manufacturing: centrifugal Ni-Hard casting, precision machining and lapping, compression rubber moulding, grinding, heat and surface treatments — engineered for surface speeds up to 10 m/s."
        />
      </Helmet>

      {/* ---------- hero ---------- */}
      <div className={`${styles.hero} ${heroIn ? styles.in : ""}`} ref={heroRef}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Technology</span>
          <h1>
            Advanced manufacturing processes at <span>DuoCon</span>.
          </h1>
          <p>
            We are committed to cutting-edge manufacturing techniques that deliver top-tier sealing
            solutions and components — from centrifugal casting to precision lapping, heat treatment
            and engineered surface coatings.
          </p>
          <div className={styles.heroActions}>
            <Link to="/shop">
              <Button variant="primary">
                See our products <IconArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/rfq">
              <Button variant="ghost">Start an RFQ</Button>
            </Link>
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <span className={styles.bpGrid} />
          <span className={styles.bpRing} />
          <img src={productImg} alt="" className={styles.bpProduct} />
          <span className={styles.bpTag}>Ni-HARD · 58–62 HRC · Rz 0.2 µm</span>
        </div>
      </div>

      {/* ---------- stats ---------- */}
      <div className={styles.stats}>
        {STATS.map((s) => (
          <div key={s.k} className={styles.stat}>
            <strong>{s.k}</strong>
            <span>{s.v}</span>
          </div>
        ))}
      </div>

      {/* ---------- capabilities ---------- */}
      <section className={styles.section} ref={capRef}>
        <header className={styles.sectionHead}>
          <span className={styles.kicker}>Manufacturing capabilities</span>
          <h2>Six process families, all in-house</h2>
        </header>
        <div className={`${styles.capGrid} ${capIn ? styles.in : ""}`}>
          {CAPABILITIES.map((c, i) => (
            <article
              key={c.title}
              className={styles.cap}
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <span className={styles.capNum}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.capIcon}>{c.icon}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- innovation ---------- */}
      <section className={`${styles.innovation} ${innoIn ? styles.in : ""}`} ref={innoRef}>
        <div className={styles.innoCopy}>
          <span className={styles.kicker}>Innovation</span>
          <h2>Manufacturing &amp; technological development</h2>
          <p>
            Innovation is at the heart of DuoCon. We foster a culture of forward-thinking and
            continuous improvement across all operations. Our sealing solutions are the result of
            rigorous research and patented technologies — for superior performance and reliability in
            the most challenging conditions.
          </p>
          <div className={styles.innoHighlights}>
            <div>
              <b>Advanced sealing solutions</b>
              <span>Engineered to perform at surface speeds of up to 10 m/s, even in the most severe environments.</span>
            </div>
            <div>
              <b>Collaborative innovation</b>
              <span>We work closely with suppliers, customers and employees to develop solutions that meet evolving needs.</span>
            </div>
          </div>
        </div>

        <div className={styles.research}>
          <span className={styles.researchTag}>Ongoing research · patents pending</span>
          <ul>
            {RESEARCH.map((r) => (
              <li key={r}>
                <span className={styles.tick}>
                  <IconCheck size={14} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- closing ---------- */}
      <div className={styles.closing}>
        <p>
          At DuoCon, we are dedicated to pioneering new technologies that provide a competitive edge
          and meet the ever-changing demands of our customers.
        </p>
        <Link to="/shop">
          <Button variant="primary">
            See our products <IconArrowRight size={18} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
