import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { IconArrowRight } from "../../components/Icon/Icon";
import { COMPANY } from "../../lib/company";
import miningImg from "../../assets/industries/mining.jpg";
import constructionImg from "../../assets/industries/construction.jpg";
import agriImg from "../../assets/industries/agri.jpg";
import recImg from "../../assets/industries/rec.jpg";
import forestImg from "../../assets/industries/forest.jpg";
import militaryImg from "../../assets/industries/military.jpg";
import heavyImg from "../../assets/industries/heavy.jpg";
import cementImg from "../../assets/industries/cement.jpg";
import waterImg from "../../assets/industries/water.jpg";
import ucImg from "../../assets/industries/uc.jpg";
import pumpImg from "../../assets/industries/pump.jpg";
import tunelImg from "../../assets/industries/tunel.jpg";
import doImg from "../../assets/product/do-cut.png";
import dfImg from "../../assets/product/df-cut.png";
import s from "./Industries.module.css";

const INDUSTRIES = [
  {
    n: "01",
    img: miningImg,
    label: "Mining · extreme abrasion",
    title: "Mining & quarrying",
    desc: "Continuous rotary sealing in slurry, granite dust, quartz sand and mechanical shock for tracked excavators, dumpers and drill rigs.",
    tag: "DIN 3760 · DO type",
    wide: true,
  },
  {
    n: "02",
    img: constructionImg,
    label: "Civil",
    title: "Construction",
    desc: "Track rollers, front idlers and slew gearboxes on earthmoving machinery under muddy submersion and vibration.",
    tag: "DO type",
  },
  {
    n: "03",
    img: agriImg,
    label: "Agri",
    title: "Agricultural",
    desc: "Harvesters, power tillers and disc harrows working in fertiliser, clay and moist peat.",
    tag: "DO · NBR toric",
  },
  {
    n: "04",
    img: recImg,
    label: "Recycle",
    title: "Recycling",
    desc: "Severe particulate protection for industrial shredders, compactors and balers.",
    tag: "DF type",
  },
  {
    n: "05",
    img: forestImg,
    label: "Forestry harvest",
    title: "Forestry machinery",
    desc: "Stops wrapping fibres, damp peat loam and acidic timber sap from reaching axle planetary drives and wheel-hub seals.",
    tag: "DIN 3760 · DO",
    wide: true,
  },
  {
    n: "06",
    img: militaryImg,
    label: "Defense",
    title: "Military & defense",
    desc: "High-reliability track suspension arms, final-drive wheel hubs and amphibious vehicles across −40 °C to +55 °C.",
    tag: "DF · FKM springs",
  },
  {
    n: "07",
    img: heavyImg,
    label: "Heavy eng components",
    title: "Drive components & gearboxes",
    desc: "Direct OEM replacement for final drives, transfer cases, central rotary joints and vertical roller-mill planetary reducers.",
    tag: "DO · DIN 3760",
    wide: true,
  },
  {
    n: "08",
    img: cementImg,
    label: "Cement",
    title: "Cement milling",
    desc: "High-temperature protection against ultra-fine clinker dust and silica-powder ingress.",
    tag: "DF · high heat",
  },
  {
    n: "09",
    img: waterImg,
    label: "Water",
    title: "Waste water treatment",
    desc: "Corrosive fluid and slurry decanters, submerged agitators and filter-press drives.",
    tag: "DF · acid resist",
  },
  {
    n: "10",
    img: ucImg,
    label: "Chassis",
    title: "Undercarriage systems",
    desc: "Forged steel track rollers, carrier rollers and front-idler bearing housings with oil-filled-for-life cavities.",
    tag: "DO · standard OEM",
  },
  {
    n: "11",
    img: pumpImg,
    label: "Pumps & fluid handling",
    title: "Heavy industrial pumps",
    desc: "Zero-leakage face sealing for abrasive dredge pumps, mineral slurry transport, high-viscosity gear pumps and screw feeders.",
    tag: "DO / DF · to 0.5 MPa",
    wide: true,
  },
  {
    n: "12",
    img: tunelImg,
    label: "High-criticality spec",
    title: "Tunnel boring machines (TBM)",
    desc: "Subterranean disc cutters, main-drive centre bearing chambers and hyperbaric face seals for up to 5.0 bar hydrostatic head.",
    tag: "DF · diamond ring",
    wide: true,
    dark: true,
  },
];

interface MatrixRow {
  n: string;
  industry: string;
  machinery: string;
  cavity: string;
  pressure: string;
  type: string;
}

const MATRIX: MatrixRow[] = [
  { n: "01", industry: "Mining", machinery: "Hydraulic excavator, shovel, dumper", cavity: "Final drive hub · slew gear", pressure: "0.3 – 0.5 MPa", type: "DO · 15Cr3Mo" },
  { n: "02", industry: "Construction", machinery: "Crawler dozer, compactor, crane", cavity: "Track roller · tension idler", pressure: "0.3 MPa", type: "DO · cast alloy" },
  { n: "03", industry: "Agricultural", machinery: "Combine harvester, heavy tiller", cavity: "Bogie hub · rotor journal", pressure: "0.2 – 0.3 MPa", type: "DO · NBR toric" },
  { n: "04", industry: "Recycling", machinery: "Scrap baler, granulator", cavity: "Shredder drum · ram pivot", pressure: "0.4 MPa", type: "DF · trapezoidal" },
  { n: "05", industry: "Forestry", machinery: "Timber harvester, forwarder", cavity: "Tandem bogie axle spindle", pressure: "0.3 MPa", type: "DO · hardened" },
  { n: "06", industry: "Military", machinery: "Tracked IFV, battle tank, logistics", cavity: "Road-wheel hub · portal axle", pressure: "0.4 – 0.5 MPa", type: "DF · FKM springs" },
  { n: "07", industry: "Heavy components", machinery: "Planetary drives, reducers", cavity: "Output flange · central joint", pressure: "0.3 MPa", type: "DO · DIN 3760" },
  { n: "08", industry: "Cement milling", machinery: "Vertical roller mill, ball mill", cavity: "Roller trunnion · drive reducer", pressure: "0.4 MPa", type: "DF · high heat" },
  { n: "09", industry: "Waste water", machinery: "Decanter centrifuge, aerator", cavity: "Rotating bowl spindle", pressure: "0.3 – 0.5 MPa", type: "DF · acid resist" },
  { n: "10", industry: "Undercarriage", machinery: "Track rollers, carrier rollers", cavity: "Internal oil-reservoir cavity", pressure: "0.3 MPa", type: "DO · standard OEM" },
  { n: "11", industry: "Pumps & valves", machinery: "Slurry centrifugal, screw pump", cavity: "Impeller shaft bearing housing", pressure: "0.5 MPa", type: "DO / DF combination" },
  { n: "12", industry: "Tunnel boring", machinery: "TBM cutterhead, screw conveyor", cavity: "Main bearing · disc-cutter hub", pressure: "0.5 MPa (5 bar)", type: "DF · diamond elast" },
];

const CONFIG_INDUSTRIES = MATRIX.map((r) => r.industry);
const DF_INDUSTRIES = new Set(["Recycling", "Military", "Cement milling", "Waste water", "Tunnel boring"]);

export function Industries() {
  const [q, setQ] = useState("");
  const [cfgIndustry, setCfgIndustry] = useState(CONFIG_INDUSTRIES[0]);
  const [result, setResult] = useState<null | "DO" | "DF">(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return MATRIX;
    return MATRIX.filter((r) =>
      `${r.industry} ${r.machinery} ${r.cavity} ${r.type}`.toLowerCase().includes(t)
    );
  }, [q]);

  return (
    <div className={s.page}>
      <Helmet>
        <title>Industries | DuoCon</title>
        <meta
          name="description"
          content="The severe-duty industries and drive assemblies where DUO-CONE mechanical face seals guarantee zero leakage — mining, construction, forestry, defense, cement, tunnel boring and more."
        />
      </Helmet>

      {/* 1 — hero */}
      <section className={`${s.section} ${s.dark} ${s.hero}`}>
        <span className={s.dotGrid} aria-hidden="true" />
        <div className={s.heroInner}>
          <span className={s.pill}>
            <span className={s.dot} /> Industries &amp; applications · DIN 3760 compliant
          </span>
          <h1 className={s.h1}>Engineered for every environment.</h1>
          <p className={s.lead}>
            Explore the severe-duty industries, drive assemblies and extreme mobile machinery where
            DUO-CONE mechanical face seals guarantee zero leakage and absolute bearing-cavity
            isolation.
          </p>

          <div className={s.metricsBar}>
            <div>
              <span>Metallurgy</span>
              <strong>High-chrome cast alloy</strong>
              <em>60 – 66 HRC hardness</em>
            </div>
            <div>
              <span>Pressure tolerance</span>
              <strong>0.3 to 0.5 MPa</strong>
              <em>continuous operation</em>
            </div>
            <div>
              <span>Surface finish</span>
              <strong>Ra ≤ 0.2 µm lapped</strong>
              <em>optical band flatness</em>
            </div>
          </div>

          <div className={s.heroActions}>
            <a className={s.primaryLink} href="#industry-grid">
              Explore industries <IconArrowRight size={16} />
            </a>
            <a className={s.ghostLink} href="#configurator">
              Find your seal
            </a>
          </div>
        </div>
      </section>

      {/* 2 — industry grid */}
      <section className={s.section} id="industry-grid">
        <header className={s.head}>
          <span className={s.overline}>[ Section 01 · global sectors ]</span>
          <h2>Explore by industry</h2>
          <p className={s.sub}>
            Precision mechanical face seals tailored for abrasive, submerged, high-temperature and
            continuous impact load profiles.
          </p>
        </header>

        <div className={s.grid}>
          {INDUSTRIES.map((it) => (
            <article
              key={it.n}
              className={`${s.card} ${it.wide ? s.cardWide : ""} ${it.dark ? s.cardDark : ""}`}
            >
              <figure className={s.cardMedia}>
                <img src={it.img} alt={it.title} loading="lazy" />
                <span className={s.cardIndex}>
                  {it.n} / {it.label}
                </span>
              </figure>
              <div className={s.cardBody}>
                <h3>{it.title}</h3>
                <p>{it.desc}</p>
                <div className={s.cardFoot}>
                  <a href="#matrix">
                    Inspect specs <IconArrowRight size={14} />
                  </a>
                  <span>{it.tag}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3 — application matrix */}
      <section className={`${s.section} ${s.tint}`} id="matrix">
        <header className={s.head}>
          <span className={s.overline}>[ Section 02 · technical reference ]</span>
          <h2>Explore the application range</h2>
          <p className={s.sub}>
            12 industries, primary machinery, target sealing cavity, pressure range and recommended
            product path.
          </p>
          <input
            className={s.search}
            placeholder="Filter machinery, cavity or seal type…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </header>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Industry</th>
                <th>Primary machinery</th>
                <th>Sealing cavity</th>
                <th>Pressure</th>
                <th>Recommended type</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.n}>
                  <td className={s.tNum}>{r.n}</td>
                  <td className={s.tStrong}>{r.industry}</td>
                  <td>{r.machinery}</td>
                  <td className={s.tMono}>{r.cavity}</td>
                  <td className={s.tMono}>{r.pressure}</td>
                  <td>
                    <span className={s.typeBadge}>{r.type}</span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className={s.muted}>
                    No match for “{q}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4 — machine to seal */}
      <section className={`${s.section} ${s.dark}`}>
        <header className={s.head}>
          <span className={s.miniKicker}>
            <span className={s.dot} /> Complete traceability
          </span>
          <h2 className={s.onDark}>From machine to seal</h2>
          <p className={s.subDark}>
            Engineering integrity through three physical stages: the mobile chassis, the planetary
            gear housing and the optical-precision seal interface.
          </p>
        </header>

        <div className={s.stages}>
          <div className={s.stage}>
            <span className={s.stageNo}>Stage 01 · macro environment</span>
            <strong>The machine</strong>
            <p>Massive structural chassis generating severe multi-axial deflection and continuous vibration.</p>
            <em>Ambient: −40 °C to +55 °C</em>
          </div>
          <div className={s.stage}>
            <span className={s.stageNo}>Stage 02 · reduction system</span>
            <strong>The hub component</strong>
            <p>High-torque planetary hub reducer needing absolute lubrication retention and a mud barrier.</p>
            <em>Dynamic shaft deflection: ±0.5 mm</em>
          </div>
          <div className={`${s.stage} ${s.stageAccent}`}>
            <span className={s.stageNo}>Stage 03 · contact interface</span>
            <strong>DUO-CONE face seal</strong>
            <p>Twin cast-alloy rings lapped within 2 optical light bands form a hydrodynamic film that never fails.</p>
            <em>Contact band: Ra ≤ 0.2 µm</em>
          </div>
        </div>
      </section>

      {/* 5 — configurator */}
      <section className={s.section} id="configurator">
        <header className={s.head}>
          <span className={s.overline}>[ Section 03 · selection protocol ]</span>
          <h2>Find your application</h2>
          <p className={s.sub}>
            Pick your industry to see the matching German-engineered mechanical face seal path.
          </p>
        </header>

        <div className={s.configurator}>
          <label className={s.cfgField}>
            <span>01 · Select industry</span>
            <select value={cfgIndustry} onChange={(e) => { setCfgIndustry(e.target.value); setResult(null); }}>
              {CONFIG_INDUSTRIES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            className={s.cfgBtn}
            onClick={() => setResult(DF_INDUSTRIES.has(cfgIndustry) ? "DF" : "DO")}
          >
            View matching product
          </button>

          {result && (
            <div className={s.cfgResult}>
              <span className={s.cfgChip}>{result}</span>
              <div>
                <strong>
                  {result === "DF"
                    ? "Matched: DUO-CONE type DF (diamond spring)"
                    : "Matched: DUO-CONE type DO (toric O-ring)"}
                </strong>
                <span>
                  {result === "DF"
                    ? "Trapezoidal housing grip · 0.5 MPa (5 bar) rating · sub-surface / slurry ready"
                    : "15Cr3Mo cast-alloy rings · DIN 3760 compliant · continuous 0.3 MPa rating"}
                </span>
              </div>
              <Link to="/category/duo-cone" className={s.cfgLink}>
                View range <IconArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 6 — DO vs DF */}
      <section className={`${s.section} ${s.tint}`}>
        <header className={s.head}>
          <span className={s.overline}>[ Section 04 · core product families ]</span>
          <h2>Found your application?</h2>
          <p className={s.sub}>
            Two proven configurations to match standard OEM housing profiles or direct square-bore
            press fits.
          </p>
        </header>

        <div className={s.typeGrid}>
          <article className={s.typeCard}>
            <div className={s.typeHead}>
              <span>DO type · toric O-ring</span>
              <span className={`${s.badge} ${s.badgeBlue}`}>Standard OEM</span>
            </div>
            <figure className={s.typeImg}>
              <img src={doImg} alt="DUO-CONE DO type seal" loading="lazy" />
            </figure>
            <dl className={s.spec}>
              <div><dt>Elastomer section</dt><dd>Toric / circular O-ring</dd></div>
              <div><dt>Housing profile</dt><dd>Ramped 8° – 15° chamfered cavity</dd></div>
              <div><dt>Max pressure</dt><dd>0.3 MPa (3.0 bar)</dd></div>
              <div><dt>Diameter</dt><dd>50 mm to 1,000 mm</dd></div>
              <div><dt>Typical machinery</dt><dd>Track rollers, front idlers, final drives</dd></div>
            </dl>
            <Link to="/category/duo-cone" className={s.typeLink}>
              Explore DO specifications <IconArrowRight size={16} />
            </Link>
          </article>

          <article className={s.typeCard}>
            <div className={s.typeHead}>
              <span>DF type · diamond spring</span>
              <span className={`${s.badge} ${s.badgeAmber}`}>High pressure</span>
            </div>
            <figure className={s.typeImg}>
              <img src={dfImg} alt="DUO-CONE DF type seal" loading="lazy" />
            </figure>
            <dl className={s.spec}>
              <div><dt>Elastomer section</dt><dd>Diamond / trapezoidal gasket</dd></div>
              <div><dt>Housing profile</dt><dd>Straight cylindrical bore (no ramp)</dd></div>
              <div><dt>Max pressure</dt><dd>0.5 MPa (5.0 bar)</dd></div>
              <div><dt>Diameter</dt><dd>100 mm to 1,200 mm</dd></div>
              <div><dt>Typical machinery</dt><dd>TBM cutters, heavy conveyors, centrifuges</dd></div>
            </dl>
            <Link to="/category/duo-cone" className={s.typeLink}>
              Explore DF specifications <IconArrowRight size={16} />
            </Link>
          </article>
        </div>
      </section>

      {/* 7 — final CTA */}
      <section className={`${s.section} ${s.dark} ${s.finalCta}`}>
        <span className={s.miniKicker}>
          <span className={s.dot} /> Direct factory contact
        </span>
        <h2 className={s.onDark}>Find the right seal for your application.</h2>
        <p className={s.subDark}>
          Our German application engineers provide CAD step files, cross-reference dimensional
          validation and rapid express quotes.
        </p>
        <div className={s.heroActions}>
          <Link to="/rfq">
            <Button variant="primary">
              Get express offer <IconArrowRight size={18} />
            </Button>
          </Link>
          <a className={s.ghostLink} href={COMPANY.phoneHref}>
            {COMPANY.phoneDisplay}
          </a>
          <a className={s.ghostLink} href={`mailto:${COMPANY.email}`}>
            {COMPANY.email}
          </a>
        </div>
      </section>
    </div>
  );
}
