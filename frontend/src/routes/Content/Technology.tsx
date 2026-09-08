import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { Button } from "../../components/Button/Button";
import { IconArrowRight } from "../../components/Icon/Icon";
import { COMPANY } from "../../lib/company";
import heroImg from "../../assets/industries/heavy.jpg";
import castImg from "../../assets/technology/centrifugal-casting.png";
import cncImg from "../../assets/technology/cnc-lapping.png";
import moldImg from "../../assets/technology/molding.png";
import grindImg from "../../assets/technology/grinding.png";
import heatImg from "../../assets/technology/heat-treatment.png";
import coatImg from "../../assets/technology/coating.png";
import s from "./Technology.module.css";

type AnatomyKey = "metal" | "toric" | "lapped" | "cavity";

const ANATOMY: Record<
  AnatomyKey,
  { n: string; tab: string; badge: string; title: string; desc: string; s1: [string, string]; s2: [string, string] }
> = {
  metal: {
    n: "Component 01",
    tab: "Metal sealing ring",
    badge: "Spec: Ni-Hard 4 / 15-3 chromium",
    title: "High-wear resistant alloy matrix",
    desc: "Engineered to withstand direct contact against hyper-abrasive quartz, crushed granite and coal slurry. The hardened carbide network holds hardness under sustained friction temperatures above 200 °C.",
    s1: ["Hardness scale", "60 – 72 HRC"],
    s2: ["Service life", "> 12,000 op. hours"],
  },
  toric: {
    n: "Component 02",
    tab: "Toric ring",
    badge: "Elastomer spec: ASTM D2000",
    title: "Toric elastomeric spring ring",
    desc: "Acts at once as an elastic energiser and a static seal. It holds calibrated axial force to keep the metal faces together, even under aggressive shaft deflection and dynamic shock.",
    s1: ["Durometer", "70 ± 5 Shore A"],
    s2: ["Range", "−60 °C to +200 °C"],
  },
  lapped: {
    n: "Component 03",
    tab: "Lapped interface",
    badge: "Optical tolerance: DIN 5401",
    title: "Micro-precision lapped contact band",
    desc: "Superfinished with multi-stage monocrystalline diamond abrasives to a calibrated band of helium light-band flatness. A microscopic oil meniscus halts abrasive slurry while eliminating friction burn.",
    s1: ["Roughness", "< 0.13 µm Ra"],
    s2: ["Flatness", "≤ 2 light bands"],
  },
  cavity: {
    n: "Component 04",
    tab: "Housing geometry",
    badge: "Tolerance: ISO H8 / F7 housing",
    title: "Engineered housing & cavity seating",
    desc: "Precision-angled ramps built to ISO geometric tolerancing stop toric slippage, eliminate axial cocking and absorb the torsional spikes generated during earthmoving manoeuvres.",
    s1: ["Chamfer", "15° – 30°"],
    s2: ["Retention", "Zero-slip"],
  },
};

const TECHS = [
  {
    n: "01",
    img: castImg,
    tag: "1600 °C induction",
    title: "Centrifugal casting",
    desc: "Molten Ni-Hard cast iron is spun into cylindrical dies at thousands of RPM. Centrifugal force drives out air pockets and voids, pushing impurities to the bore for an ultra-dense, homogeneous carbide microstructure.",
    chips: ["Void-free density", "Continuous grain alignment"],
  },
  {
    n: "02",
    img: cncImg,
    tag: "2 helium light bands",
    title: "Precision CNC & optical lapping",
    desc: "Robotic CNC lathes profile the sealing contours to micrometre repeatability. Three-stage orbital lapping with diamond slurry then yields a mirror finish, verified by monochromatic light-band interferometry.",
    chips: ["Ra < 0.13 µm", "Hydrodynamic boundary wedge"],
  },
  {
    n: "03",
    img: moldImg,
    tag: "Vulcanisation press · NBR & FKM",
    title: "Compression rubber moulding",
    desc: "Toric rings are formulated and moulded under strict temperature cycles for uniform elasticity, minimal compression set and long-term axial spring load across thermal swings.",
    chips: ["NBR −40 → +100 °C", "HNBR ozone-resistant", "FKM −20 → +200 °C", "Silicone −60 °C"],
  },
  {
    n: "04",
    img: grindImg,
    tag: "Centerless grinding · ±0.005 mm",
    title: "Precision grinding",
    desc: "Centerless external, bore and face grinding hold tight diametrical concentricity. This kills wobble and prevents localised toric pinching under shock loading.",
    chips: ["Diametrical concentricity ±0.005 mm"],
  },
  {
    n: "05",
    img: heatImg,
    tag: "Vacuum furnace · cryogenic",
    title: "Heat treatment",
    desc: "Tailored metallurgical transformation delivers the exact balance of core shatter toughness and contact-face abrasion resistance.",
    chips: ["Sub-zero cryogenic", "Induction hardening", "Tempering", "Gas nitriding", "Laser hardening"],
  },
  {
    n: "06",
    img: coatImg,
    tag: "Tribological coating · MoS₂ & WS₂",
    title: "Surface treatments & coatings",
    desc: "Electrochemical and dry-film tribological treatments guard against corrosion, fretting wear and dry-startup galling.",
    chips: ["MoS₂ dry lubricant", "WS₂ 0.03 µ friction", "CED electro-coating", "Zn passivation > 500 h salt spray"],
  },
];

const LAB = [
  {
    n: "R&D Module 01",
    meta: "v ≤ 10 m/s",
    title: "High-speed sliding surface velocity",
    desc: "Balanced micro-groove profiles that channel cooling oil into hydrodynamic film barriers during high-RPM continuous transit.",
  },
  {
    n: "R&D Module 02",
    meta: "FEA tribo-model",
    title: "Wear-life tribology modelling",
    desc: "Lifecycle algorithms simulating quartz sand, taconite and mud ingress to predict seal-envelope failure before it happens in the field.",
  },
  {
    n: "R&D Module 03",
    meta: "Viscoelasticity",
    title: "Elastomeric stress relaxation",
    desc: "Polymer chains formulated to resist permanent compression set across sub-zero arctic and ultra-high desert thermal swings.",
  },
  {
    n: "R&D Module 04",
    meta: "Nano-barrier",
    title: "Slurry protection coatings",
    desc: "Plasma-sprayed nanoceramic shields across the seal ramp zone to repel dense iron-ore tailings and abrasive gravel buildup.",
  },
  {
    n: "R&D Module 05",
    meta: "Carbide matrix",
    title: "Ni-Hard alloy optimisation",
    desc: "Refinement of molybdenum and nickel ratios to eradicate micro-chipping while amplifying fracture toughness on heavy track drives.",
  },
];

const TESTS = [
  {
    n: "T1",
    title: "Mud packing test",
    tag: "Contamination",
    items: ["Mud-submerged wear and leakage under a contamination load"],
  },
  {
    n: "T2",
    title: "Heat generation test",
    tag: "Thermal",
    items: ["Time, pressure and surface speed in lubrication, measuring the heat the face pair generates"],
  },
  {
    n: "T3",
    title: "Elastomeric test",
    tag: "Rubber science",
    items: [
      "Oil compatibility",
      "Face-load variation against time and temperature",
      "O-ring squeezing",
      "O-ring contraction",
    ],
  },
  {
    n: "T4",
    title: "P-V test",
    tag: "Tribology",
    items: ["Pressure against velocity at linear speed", "Wear, galling and spilling"],
  },
  {
    n: "T5",
    title: "Seal endurance testing",
    tag: "Lifecycle rig",
    items: [
      "Endurance rig running at set speed and temperature",
      "Up to 1000 rpm to reach 10 m/s linear speed",
      "Up to 1000 kgf axial load",
      "Seal sizes 200 to 1000 mm outer diameter",
    ],
  },
];

const MARKERS = [
  { id: "01", top: "26%", left: "20%", title: "Lapped mirror face", value: "< 0.13 µm Ra flatness", tone: "cyan" },
  { id: "02", top: "52%", left: "72%", title: "Ni-Hard alloy matrix", value: "60 – 70 HRC martensitic", tone: "amber" },
  { id: "03", top: "76%", left: "38%", title: "Toric elastomer", value: "ISO 3601 calibrated", tone: "green" },
] as const;

const METRICS = [
  { label: "Tolerance", value: 0.002, decimals: 3, suffix: " mm" },
  { label: "Hardness", value: 68, decimals: 0, suffix: " HRC" },
  { label: "Velocity", value: 10, decimals: 0, suffix: " m/s" },
];

const EASE = [0.22, 1, 0.36, 1] as const;
const vp = { once: true, amount: 0.2 } as const;

/* ---------- animated count-up ---------- */
function CountUp({ to, decimals, suffix }: { to: number; decimals: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const [text, setText] = useState(() => (0).toFixed(decimals) + suffix);

  useEffect(() => {
    if (reduce) {
      setText(to.toFixed(decimals) + suffix);
      return;
    }
    if (!inView) return;
    const controls = animate(mv, to, { duration: 1.4, ease: EASE });
    const unsub = mv.on("change", (v) => setText(v.toFixed(decimals) + suffix));
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, reduce, to, decimals, suffix, mv]);

  return <span ref={ref}>{text}</span>;
}

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
const gridItem = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function Technology() {
  const [part, setPart] = useState<AnatomyKey>("metal");
  const a = ANATOMY[part];
  const reduce = useReducedMotion();
  const words = "Engineered at the molecular & micron level.".split(" ");

  return (
    <div className={s.page}>
      <Helmet>
        <title>Technology | DuoCone</title>
        <meta
          name="description"
          content="How DUO-CONE mechanical face seals are engineered: centrifugal casting, precision CNC and optical lapping, elastomer moulding, grinding, heat treatment and tribological coatings."
        />
      </Helmet>

      {/* 1 — hero */}
      <section className={`${s.section} ${s.dark} ${s.hero}`}>
        <span className={s.dotGrid} aria-hidden="true" />
        <span className={`${s.orb} ${s.orbA}`} aria-hidden="true" />
        <span className={`${s.orb} ${s.orbB}`} aria-hidden="true" />

        <motion.div
          className={s.heroInner}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.span
            className={s.pill}
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
          >
            <span className={s.dot} /> Manufacturing metallurgy &amp; tribology
          </motion.span>

          <h1 className={s.h1} aria-label="Engineered at the molecular & micron level.">
            {words.map((w, i) => (
              <motion.span
                key={i}
                className={s.word}
                variants={{
                  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
                  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: EASE, delay: i * 0.05 } },
                }}
              >
                {w === "&" ? <em className={s.amp}>&amp;</em> : w}
                {i < words.length - 1 ? " " : ""}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className={s.lead}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
          >
            Every DUO-CONE mechanical face seal is the outcome of specialised metallurgy, proprietary
            centrifugal casting, precision lapping and rigorous elastomer formulation, designed to
            resist abrasive slurry, extreme load and high sliding velocities.
          </motion.p>

          <motion.div
            className={s.blueprint}
            variants={{ hidden: { opacity: 0, scale: 0.94 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: EASE } } }}
          >
            <figure className={s.scanFrame}>
              <span className={s.ringGlow} aria-hidden="true" />
              <img src={heroImg} alt="DUO-CONE precision-engineered mechanical face seals" loading="lazy" />
              <span className={s.corner} data-c="tl" />
              <span className={s.corner} data-c="tr" />
              <span className={s.corner} data-c="bl" />
              <span className={s.corner} data-c="br" />
              <span className={s.scanLine} aria-hidden="true" />
              <span className={s.feedTag}>
                <span className={s.liveDot} /> Live optical sensor feed · 4K metrology
              </span>
              {MARKERS.map((m, i) => (
                <motion.span
                  key={m.id}
                  className={s.marker}
                  data-tone={m.tone}
                  style={{ top: m.top, left: m.left }}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.5 + i * 0.15 }}
                >
                  <span className={s.markerPin}>{m.id}</span>
                  <span className={s.markerTip}>
                    <b>{m.title}</b>
                    {m.value}
                  </span>
                </motion.span>
              ))}
            </figure>

            <div className={s.metricStrip}>
              {METRICS.map((m) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={vp}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <span>{m.label}</span>
                  <strong>
                    <CountUp to={m.value} decimals={m.decimals} suffix={m.suffix} />
                  </strong>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 2 — interactive anatomy */}
      <section className={s.section}>
        <RevealHead
          overline="[ Cross-section engineering ]"
          title="Interactive seal anatomy"
          sub="Pick a component to see how complementary mechanical forces guarantee zero leakage under high particulate intrusion."
        />

        <div className={s.anatomy}>
          <div className={s.tabs} role="tablist" aria-label="Seal components">
            {(Object.keys(ANATOMY) as AnatomyKey[]).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={part === k}
                className={`${s.tab} ${part === k ? s.tabActive : ""}`}
                onClick={() => setPart(k)}
              >
                {part === k && (
                  <motion.span
                    layoutId="anatomyTab"
                    className={s.tabHighlight}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                )}
                <span className={s.tabNo}>{ANATOMY[k].n}</span>
                <span className={s.tabName}>{ANATOMY[k].tab}</span>
              </button>
            ))}
          </div>

          <div className={s.anatomyStage}>
            <AnimatePresence mode="wait">
              <motion.div
                key={part}
                className={s.anatomyCard}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <span className={s.anatomyBadge}>{a.badge}</span>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
                <div className={s.anatomyStats}>
                  <div>
                    <span>{a.s1[0]}</span>
                    <strong>{a.s1[1]}</strong>
                  </div>
                  <div>
                    <span>{a.s2[0]}</span>
                    <strong>{a.s2[1]}</strong>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 3 — 6 core technologies */}
      <section className={`${s.section} ${s.tint}`}>
        <RevealHead
          overline="[ Process architecture ]"
          title="The 6 core technologies"
          sub="From molten-alloy centrifugal pouring to optical helium testing, every phase reflects rigorous German manufacturing standards."
        />

        <motion.div
          className={s.techGrid}
          variants={gridStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          {TECHS.map((t) => (
            <motion.article
              key={t.n}
              className={s.techCard}
              variants={gridItem}
              whileHover={reduce ? undefined : { y: -8 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <figure className={s.techMedia}>
                <img src={t.img} alt={t.title} loading="lazy" />
                <span className={s.sheen} aria-hidden="true" />
                <span className={s.phase}>Phase [{t.n}/06]</span>
                <span className={s.techTag}>{t.tag}</span>
              </figure>
              <div className={s.techBody}>
                <h3>
                  <span className={s.techNo}>{t.n}</span> {t.title}
                </h3>
                <p>{t.desc}</p>
                <div className={s.chips}>
                  {t.chips.map((c) => (
                    <span key={c} className={s.chip}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* 4 — research lab */}
      <section className={`${s.section} ${s.tint}`}>
        <RevealHead
          kicker="Pending patents / ongoing development"
          title="DUO-CONE research lab"
          sub="Continuously testing metallurgy under extreme simulation inside our Engelskirchen facilities."
        />

        <motion.div
          className={s.labGrid}
          variants={gridStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          {LAB.map((l, i) => (
            <motion.div
              key={l.n}
              className={s.labCard}
              variants={gridItem}
              whileHover={reduce ? undefined : { y: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <span className={s.labBeam} aria-hidden="true" />
              <span className={s.labIndex} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className={s.labTop}>
                <span className={s.labNo}>{l.n}</span>
                <span className={s.labMeta}>{l.meta}</span>
              </div>
              <strong>{l.title}</strong>
              <p>{l.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 4b — seal life testing */}
      <section className={s.section}>
        <RevealHead
          overline="[ Validation ]"
          title="Seal life testing"
          sub="Which tests we run on every duo cone face seal before it leaves Engelskirchen."
        />

        <motion.div
          className={s.testGrid}
          variants={gridStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          {TESTS.map((t, i) => (
            <motion.article key={t.n} className={s.testCard} variants={gridItem}>
              <span className={s.testGhost} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className={s.testTop}>
                <span className={s.testBadge}>{t.n}</span>
                <span className={s.testTag}>{t.tag}</span>
              </div>
              <h3>{t.title}</h3>
              <ul className={s.testList}>
                {t.items.map((it) => (
                  <li key={it}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </motion.div>

        <motion.figure
          className={s.pressureFrame}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {/*
            3D seal-pressure model placeholder. Drop the CAD / FEA export
            (glTF, MP4 loop or high-res still) into src/assets and replace
            this block with the viewer or <video>.
          */}
          <div className={s.pressureViz} aria-hidden="true">
            <span className={s.pressureCore} />
            <span className={s.pressureRing} />
            <span className={s.pressureRing} />
            <span className={s.pressureRing} />
            <span className={s.pressureGrid} />
          </div>
          <figcaption>
            <span className={s.pressureKicker}>[ FEA · contact model ]</span>
            <strong>Contact-pressure simulation</strong>
            <span className={s.pressureText}>
              Finite-element map of face load and hydrodynamic film across the sealing band.
            </span>
            <div className={s.pressureScale} aria-hidden="true">
              <span>low</span>
              <span className={s.pressureBar} />
              <span>peak</span>
            </div>
            <span className={s.pressureSoon}>3D model coming soon</span>
          </figcaption>
        </motion.figure>
      </section>

      {/* 5 — CTA */}
      <section className={s.section}>
        <motion.div
          className={s.cta}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span className={s.ctaShimmer} aria-hidden="true" />
          <span className={s.overline}>[ Direct engineering desk ]</span>
          <h2>Specific dimensional or metallurgical requirements?</h2>
          <p>
            Our senior seal engineers help with custom mould prototyping, CAD cross-referencing,
            material pairings and express OEM batch production.
          </p>
          <div className={s.ctaActions}>
            <Link to="/rfq">
              <Button variant="primary">
                Request 24h technical RFQ <IconArrowRight size={18} />
              </Button>
            </Link>
            <a className={s.callBtn} href={COMPANY.phoneHref}>
              Call {COMPANY.phoneDisplay}
            </a>
          </div>
          <div className={s.ctaStrip}>
            <span>Standard dispatch: 72 hours</span>
            <span>{COMPANY.certification}</span>
            <span>100% optical test</span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

/* ---------- animated section header ---------- */
function RevealHead({
  overline,
  kicker,
  title,
  sub,
  onDark,
}: {
  overline?: string;
  kicker?: string;
  title: string;
  sub: string;
  onDark?: boolean;
}) {
  return (
    <motion.header
      className={s.head}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {overline && <span className={s.overline}>{overline}</span>}
      {kicker && (
        <span className={s.miniKicker}>
          <span className={s.dot} /> {kicker}
        </span>
      )}
      <h2 className={onDark ? s.onDark : undefined}>{title}</h2>
      <p className={onDark ? s.subDark : s.sub}>{sub}</p>
    </motion.header>
  );
}
