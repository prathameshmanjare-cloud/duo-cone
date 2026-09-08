import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { IconArrowRight } from "../../components/Icon/Icon";
import { COMPANY } from "../../lib/company";
import heroImg from "../../assets/industries/heavy.jpg";
import castImg from "../../assets/industries/mining.jpg";
import cncImg from "../../assets/industries/construction.jpg";
import moldImg from "../../assets/industries/pump.jpg";
import grindImg from "../../assets/industries/cement.jpg";
import heatImg from "../../assets/industries/forest.jpg";
import coatImg from "../../assets/industries/tunel.jpg";
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
    desc: "Superfinished with multi-stage monocrystalline diamond abrasives to a calibrated band of helium light-band flatness — a microscopic oil meniscus halts abrasive slurry while eliminating friction burn.",
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

const MARKERS = [
  { id: "01", top: "26%", left: "20%", title: "Lapped mirror face", value: "< 0.13 µm Ra flatness", tone: "cyan" },
  { id: "02", top: "52%", left: "72%", title: "Ni-Hard alloy matrix", value: "60 – 70 HRC martensitic", tone: "amber" },
  { id: "03", top: "76%", left: "38%", title: "Toric elastomer", value: "ISO 3601 calibrated", tone: "green" },
] as const;

export function Technology() {
  const [part, setPart] = useState<AnatomyKey>("metal");
  const a = ANATOMY[part];

  return (
    <div className={s.page}>
      <Helmet>
        <title>Technology | DuoCon</title>
        <meta
          name="description"
          content="How DUO-CONE mechanical face seals are engineered: centrifugal casting, precision CNC and optical lapping, elastomer moulding, grinding, heat treatment and tribological coatings."
        />
      </Helmet>

      {/* 1 — hero */}
      <section className={`${s.section} ${s.dark} ${s.hero}`}>
        <span className={s.dotGrid} aria-hidden="true" />
        <div className={s.heroInner}>
          <span className={s.pill}>
            <span className={s.dot} /> Manufacturing metallurgy &amp; tribology
          </span>
          <h1 className={s.h1}>Engineered at the molecular &amp; micron level.</h1>
          <p className={s.lead}>
            Every DUO-CONE mechanical face seal is the outcome of specialised metallurgy, proprietary
            centrifugal casting, precision lapping and rigorous elastomer formulation — designed to
            resist abrasive slurry, extreme load and high sliding velocities.
          </p>

          <div className={s.blueprint}>
            <figure className={s.scanFrame}>
              <img src={heroImg} alt="DUO-CONE precision-engineered mechanical face seals" loading="lazy" />
              <span className={s.corner} data-c="tl" />
              <span className={s.corner} data-c="tr" />
              <span className={s.corner} data-c="bl" />
              <span className={s.corner} data-c="br" />
              <span className={s.scanLine} aria-hidden="true" />
              <span className={s.feedTag}>
                <span className={s.liveDot} /> Live optical sensor feed · 4K metrology
              </span>
              {MARKERS.map((m) => (
                <span
                  key={m.id}
                  className={s.marker}
                  data-tone={m.tone}
                  style={{ top: m.top, left: m.left }}
                >
                  <span className={s.markerPin}>{m.id}</span>
                  <span className={s.markerTip}>
                    <b>{m.title}</b>
                    {m.value}
                  </span>
                </span>
              ))}
            </figure>
            <div className={s.metricStrip}>
              <div>
                <span>Tolerance</span>
                <strong>0.002 mm</strong>
              </div>
              <div>
                <span>Hardness</span>
                <strong>68 HRC</strong>
              </div>
              <div>
                <span>Velocity</span>
                <strong>10 m/s</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — interactive anatomy */}
      <section className={s.section}>
        <header className={s.head}>
          <span className={s.overline}>[ Cross-section engineering ]</span>
          <h2>Interactive seal anatomy</h2>
          <p className={s.sub}>
            Pick a component to see how complementary mechanical forces guarantee zero leakage under
            high particulate intrusion.
          </p>
        </header>

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
                <span className={s.tabNo}>{ANATOMY[k].n}</span>
                <span className={s.tabName}>{ANATOMY[k].tab}</span>
              </button>
            ))}
          </div>

          <div className={s.anatomyCard}>
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
          </div>
        </div>
      </section>

      {/* 3 — 6 core technologies */}
      <section className={`${s.section} ${s.tint}`}>
        <header className={s.head}>
          <span className={s.overline}>[ Process architecture ]</span>
          <h2>The 6 core technologies</h2>
          <p className={s.sub}>
            From molten-alloy centrifugal pouring to optical helium testing, every phase reflects
            rigorous German manufacturing standards.
          </p>
        </header>

        <div className={s.techGrid}>
          {TECHS.map((t) => (
            <article key={t.n} className={s.techCard}>
              <figure className={s.techMedia}>
                <img src={t.img} alt={t.title} loading="lazy" />
                <span className={s.scanLine} data-tone="amber" aria-hidden="true" />
                <span className={s.phase}>Phase [{t.n}/06]</span>
                <span className={s.techTag}>{t.tag}</span>
              </figure>
              <div className={s.techBody}>
                <h3>
                  {t.n} {t.title}
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
            </article>
          ))}
        </div>
      </section>

      {/* 4 — research lab */}
      <section className={`${s.section} ${s.dark}`}>
        <header className={s.head}>
          <span className={s.miniKicker}>
            <span className={s.dot} /> Pending patents / ongoing development
          </span>
          <h2 className={s.onDark}>DUO-CONE research lab</h2>
          <p className={s.subDark}>
            Continuously testing metallurgy under extreme simulation inside our Engelskirchen
            facilities.
          </p>
        </header>

        <div className={s.labGrid}>
          {LAB.map((l) => (
            <div key={l.n} className={s.labCard}>
              <div className={s.labTop}>
                <span className={s.labNo}>{l.n}</span>
                <span className={s.labMeta}>{l.meta}</span>
              </div>
              <strong>{l.title}</strong>
              <p>{l.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 — CTA */}
      <section className={s.section}>
        <div className={s.cta}>
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
        </div>
      </section>
    </div>
  );
}
