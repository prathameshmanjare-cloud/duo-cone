import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { IconArrowRight } from "../../components/Icon/Icon";
import { COMPANY, COMPANY_ADDRESS } from "../../lib/company";
import heroImg from "../../assets/industries/tunel.jpg";
import s from "./About.module.css";
import ds from "./DuoCone.module.css";

const PILLARS = [
  {
    n: "01",
    kicker: "Inventory",
    title: "Immediate availability",
    body: "A comprehensive inventory of standard DO and DF types physically stocked in Engelskirchen, ready to halt field-equipment downtime the day you call.",
  },
  {
    n: "02",
    kicker: "Velocity",
    title: "24-hour responsiveness",
    body: "Our technical desk returns binding quotations, cross-reference matrices and CAD cross-section validation within one working day.",
  },
  {
    n: "03",
    kicker: "Consultancy",
    title: "Direct specialist service",
    body: "Talk straight to senior sealing engineers. No call switches, no uninformed ticket queues. Get metallurgical answers immediately.",
  },
  {
    n: "04",
    kicker: "Network",
    title: "Pan-European reach",
    body: "Optimised ground dispatch across Germany and the EU, plus priority air courier for emergency global mining and tunnelling operations.",
  },
];

const STATS = [
  { value: 17, suffix: "+", label: "years of experience" },
  { value: 1320, suffix: "+", label: "completed projects" },
  { value: 16000, suffix: "m²", label: "of production space" },
  { value: 110, suffix: "%", label: "customer satisfaction" },
];

/* Metal + toric ring build-up of a duo cone face seal */
const PARTS = [
  {
    n: "01",
    title: "Two metal sealing rings",
    body: "Identical hardened cast-iron rings. Their front faces are lapped optically flat and run against each other as the dynamic sealing interface.",
  },
  {
    n: "02",
    title: "Two elastomeric toric rings",
    body: "Round-section rubber rings seated on angled housing ramps. They hold the metal faces together with a calibrated axial load and seal statically against the housing and the metal ring.",
  },
];

/* How the seal actually works */
const FUNCTION = [
  {
    k: "Face contact under load",
    v: "The compressed toric rings push the two lapped metal faces together. Contact pressure stays roughly constant as the faces wear, so the seal keeps working for its full service life.",
  },
  {
    k: "Hydrodynamic oil film",
    v: "A microscopic film of gear oil is drawn between the rotating faces. It carries the load, removes friction heat and prevents metal-to-metal galling.",
  },
  {
    k: "Contamination exclusion",
    v: "The outer edge of the face contact wipes mud, water, sand and slurry away from the sealed cavity. Nothing abrasive reaches the bearings.",
  },
  {
    k: "Self-adjusting alignment",
    v: "The toric rings let each metal ring float and tilt slightly, so the faces stay parallel through shaft deflection, axle flex and thermal movement.",
  },
];

const SPECS = [
  { label: "Outer diameter", value: "50 to 1420 mm" },
  { label: "Surface speed", value: "up to 10 m/s" },
  { label: "Face flatness", value: "within 2 helium light bands" },
  { label: "Temperature", value: "−60 °C to +200 °C" },
];

function useInViewOnce<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

function StatCount({ to, run }: { to: number; run: boolean }) {
  const [n, setN] = useState(0);
  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (!run) return;
    if (reduce || typeof requestAnimationFrame === "undefined") {
      setN(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to, reduce]);
  return <>{n.toLocaleString("en-US")}</>;
}

const STEPS = [
  {
    n: "01",
    title: "Cast metallurgy control",
    body: "High-alloy chilled cast iron (Ni-Hard) formulations with a martensitic microstructure for abrasion resistance.",
  },
  {
    n: "02",
    title: "Elastomer compound science",
    body: "NBR, HNBR, FKM (Viton) and silicone load rings formulated for near-zero permanent set from −40 °C to +200 °C.",
  },
  {
    n: "03",
    title: "Field application diagnostics",
    body: "Feedback from heavy earthmoving and continuous tunnel-boring fleets feeds back into ongoing seal-geometry refinement.",
  },
];

export function About() {
  const [statsRef, statsSeen] = useInViewOnce<HTMLDivElement>();
  return (
    <div className={s.page}>
      <Helmet>
        <title>About Us | DuoCone</title>
        <meta
          name="description"
          content="DUO-CONE is a specialised German manufacturer and distributor of heavy-duty mechanical face seals, shipping from Engelskirchen with 24-hour quotations and 24-hour dispatch."
        />
      </Helmet>

      {/* 1 — cinematic hero */}
      <section className={`${s.section} ${s.dark} ${s.hero}`}>
        <span className={s.gridDeco} aria-hidden="true" />
        <div className={s.heroInner}>
          <span className={s.pill}>
            <span className={s.dot} /> German engineering since day one
          </span>
          <h1 className={s.h1}>
            Precision &amp; availability.
            <br />
            <span>Direct from Germany.</span>
          </h1>

          <figure className={s.scanFrame}>
            <img src={heroImg} alt="DUO-CONE heavy-duty mechanical face seals engineered in Germany" loading="lazy" />
            <span className={s.corner} data-c="tl" />
            <span className={s.corner} data-c="tr" />
            <span className={s.corner} data-c="bl" />
            <span className={s.corner} data-c="br" />
            <span className={s.scanLine} aria-hidden="true" />
            <span className={s.scanTag}>Live metrology bench · Station 04 · Germany</span>
            <span className={s.scanMeta}>Alloy: Ni-Hard / 15Cr-3Mo · Hardness 60–66 HRC</span>
          </figure>

          <p className={s.lead}>
            DUO-CONE is a specialised German manufacturer and global distributor of heavy-duty
            mechanical face seals. From our central warehouse in Engelskirchen we keep immediate
            availability and direct engineering support for customers across Europe and worldwide.
          </p>

          <div className={s.heroActions}>
            <Link to="/rfq">
              <Button variant="primary">
                Get express offer (24h) <IconArrowRight size={18} />
              </Button>
            </Link>
            <a className={s.callBtn} href={COMPANY.phoneHref}>
              Call {COMPANY.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* 2 — key stats */}
      <section className={s.section}>
        <div
          ref={statsRef}
          className={`${s.stats} ${statsSeen ? s.statsIn : ""}`}
        >
          {STATS.map((st, i) => (
            <div key={st.label} className={s.stat} style={{ transitionDelay: `${i * 90}ms` }}>
              <span className={s.statValue}>
                <StatCount to={st.value} run={statsSeen} />
                <span className={s.statSuffix}>{st.suffix}</span>
              </span>
              <span className={s.statLabel}>{st.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* build-up */}
      <section className={`${s.section} ${s.tint}`}>
        <header className={s.head}>
          <span className={s.overline}>[ Construction ]</span>
          <h2>Four parts, one sealed joint</h2>
          <p className={s.sub}>
            Every duo cone seal is a symmetrical pair. One half turns with the shaft, the other stays
            with the housing, and the two are mirror images of each other.
          </p>
        </header>

        <div className={ds.partGrid}>
          {PARTS.map((p) => (
            <article key={p.n} className={ds.partCard}>
              <span className={ds.partNo}>{p.n}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* functionality */}
      <section className={s.section}>
        <header className={s.head}>
          <span className={s.overline}>[ Functionality ]</span>
          <h2>How a duo cone seal works</h2>
          <p className={s.sub}>
            The seal has no lip and never touches the shaft. All of the sealing happens at the two
            polished metal faces pressed together in the middle.
          </p>
        </header>

        <div className={ds.funcGrid}>
          {FUNCTION.map((f) => (
            <div key={f.k} className={ds.funcRow}>
              <span className={ds.funcKey}>{f.k}</span>
              <p className={ds.funcVal}>{f.v}</p>
            </div>
          ))}
        </div>

        <div className={ds.specStrip}>
          {SPECS.map((sp) => (
            <div key={sp.label} className={ds.spec}>
              <span className={ds.specValue}>{sp.value}</span>
              <span className={ds.specLabel}>{sp.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3 — advantage pillars */}
      <section className={`${s.section} ${s.tint}`}>
        <header className={s.head}>
          <span className={s.overline}>[ Value proposition ]</span>
          <h2>The DUO-CONE advantage</h2>
          <p className={s.sub}>Built to eliminate industrial downtime and streamline heavy parts procurement.</p>
        </header>

        <div className={s.pillars}>
          {PILLARS.map((p) => (
            <article key={p.n} className={s.pillar}>
              <div className={s.pillarTop}>
                <span className={s.pillarNo}>
                  {p.n} // {p.kicker}
                </span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 6 — closed-loop quality */}
      <section className={`${s.section} ${s.tint}`}>
        <header className={s.head}>
          <span className={s.overline}>[ Industrial ecosystem ]</span>
          <h2>Closed-loop quality</h2>
          <p className={s.sub}>Connecting European metallurgy directly with field performance.</p>
        </header>

        <div className={s.steps}>
          {STEPS.map((st) => (
            <div key={st.n} className={s.step}>
              <span className={s.stepNo}>{st.n}</span>
              <div>
                <strong>{st.title}</strong>
                <p>{st.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8 — final CTA */}
      <section className={`${s.section} ${s.dark} ${s.finalCta}`}>
        <span className={s.miniKicker}>
          <span className={s.dot} /> Rapid response guarantee
        </span>
        <h2 className={s.onDark}>Let&rsquo;s engineer your sealing solution.</h2>
        <p className={s.subDark}>
          Send us your OEM part number, sample dimensions or drawing. Our application specialists in
          Engelskirchen return your quotation within 24 hours.
        </p>
        <div className={s.heroActions}>
          <Link to="/rfq">
            <Button variant="primary">
              Express offer (24h) <IconArrowRight size={18} />
            </Button>
          </Link>
          <a className={s.callBtn} href={COMPANY.phoneHref}>
            Direct hotline: {COMPANY.phoneDisplay}
          </a>
        </div>
        <p className={s.legal}>
          {COMPANY.legalName} · {COMPANY_ADDRESS} · {COMPANY.certification} certified facility. All
          trademarks are the property of their respective OEM owners.
        </p>
      </section>
    </div>
  );
}
