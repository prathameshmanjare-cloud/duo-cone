import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { IconArrowRight } from "../../components/Icon/Icon";
import { COMPANY, COMPANY_ADDRESS, MAP_EMBED_URL, MAP_LINK_URL } from "../../lib/company";
import heroImg from "../../assets/industries/tunel.jpg";
import metrologyImg from "../../assets/industries/pump.jpg";
import doImg from "../../assets/product/do-cut.png";
import dfImg from "../../assets/product/df-cut.png";
import s from "./About.module.css";

const METRICS = [
  { value: "72h", label: "Dispatch from our Germany hub", tag: "READY" },
  { value: "24h", label: "Guaranteed quotation turnaround", tag: "SLA" },
  { value: "50–1420 mm", label: "Outer diameter range in stock", tag: "RANGE" },
  { value: "1:1", label: "OEM exact-fit equivalents", tag: "100%" },
];

const OEMS = ["CAT", "Komatsu", "Liebherr", "Hitachi", "John Deere", "Goetze", "SKF", "Trelleborg"];

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
    body: "Talk straight to senior sealing engineers — no call switches, no uninformed ticket queues. Get metallurgical answers immediately.",
  },
  {
    n: "04",
    kicker: "Network",
    title: "Pan-European reach",
    body: "Optimised ground dispatch across Germany and the EU, plus priority air courier for emergency global mining and tunnelling operations.",
  },
];

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
  return (
    <div className={s.page}>
      <Helmet>
        <title>About Us | DuoCon</title>
        <meta
          name="description"
          content="DUO-CONE is a specialised German manufacturer and distributor of heavy-duty mechanical face seals, shipping from Engelskirchen with 24-hour quotations and 72-hour dispatch."
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

      {/* 2 — facility metrics */}
      <section className={s.section}>
        <header className={s.head}>
          <span className={s.overline}>[ Capability matrix ]</span>
          <h2>Specialised facility metrics</h2>
        </header>

        <div className={s.metricGrid}>
          {METRICS.map((m) => (
            <div key={m.label} className={s.metric}>
              <span className={s.metricTag}>{m.tag}</span>
              <span className={s.metricValue}>{m.value}</span>
              <span className={s.metricLabel}>{m.label}</span>
            </div>
          ))}
        </div>

        <div className={s.editorial}>
          <span className={s.miniKicker}>
            <span className={s.dot} /> Engineered for heavy extremes
          </span>
          <p>
            Our precision duo-cone seals stop mud, slurry, sand and moisture reaching final drives,
            wheel hubs, track rollers and tunnel-boring gearboxes. DUO-CONE covers replacement
            compatibility across the major platforms:
          </p>
          <div className={s.chips}>
            {OEMS.map((o) => (
              <span key={o} className={s.chip}>
                {o}
              </span>
            ))}
          </div>
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

      {/* 4 — logistics hub */}
      <section className={`${s.section} ${s.dark}`}>
        <header className={s.head}>
          <span className={s.miniKicker}>
            <span className={s.dot} /> Central distribution platform
          </span>
          <h2 className={s.onDark}>Engelskirchen, Germany</h2>
          <p className={s.subDark}>Strategic European logistics location serving the core industrial corridors.</p>
        </header>

        <div className={s.mapCard}>
          <a className={s.mapLink} href={MAP_LINK_URL} target="_blank" rel="noreferrer">
            Open in Maps ↗
          </a>
          <iframe src={MAP_EMBED_URL} title={`Map showing ${COMPANY_ADDRESS}`} loading="lazy" />
          <span className={s.radar} aria-hidden="true">
            <span /> <span /> <span />
          </span>
          <span className={s.mapCaption}>
            <b>Central logistics headquarters</b>
            {COMPANY.street} · {COMPANY.postcodeCity}
          </span>
        </div>

        <div className={s.logi}>
          <div className={s.logiRow}>
            <span className={s.logiKey}>Operating hours (CET)</span>
            <span className={s.logiVal}>{COMPANY.hours}</span>
          </div>
          <div className={s.logiRow}>
            <span className={s.logiKey}>Daily dispatch partners</span>
            <span className={s.logiVal}>DHL Express · Dachser Logistics</span>
          </div>
          <div className={s.logiRow}>
            <span className={s.logiKey}>Direct desk</span>
            <a className={s.logiVal} href={`mailto:${COMPANY.email}`}>
              {COMPANY.email}
            </a>
          </div>
        </div>
      </section>

      {/* 5 — people / metrology */}
      <section className={s.section}>
        <header className={s.head}>
          <span className={s.overline}>[ Metrology &amp; QA ]</span>
          <h2>People behind the precision</h2>
        </header>

        <div className={s.metrology}>
          <figure className={s.scanFrame}>
            <img
              src={metrologyImg}
              alt="Quality engineer inspecting duo-cone seal mating faces under monochromatic light"
              loading="lazy"
            />
            <span className={s.corner} data-c="tl" />
            <span className={s.corner} data-c="tr" />
            <span className={s.corner} data-c="bl" />
            <span className={s.corner} data-c="br" />
            <span className={s.scanLine} data-tone="amber" aria-hidden="true" />
            <span className={s.scanTag}>589 nm sodium-vapour interference · ≤ 2 light bands</span>
          </figure>

          <div className={s.metrologyBody}>
            <h3>Optical flatness protocol</h3>
            <p>
              Every sealing face is precision-lapped to an optical mirror finish. Flatness is verified
              with monochromatic helium and sodium light bands (≤ 2 bands) and surface roughness
              Ra ≤ 0.2 µm — guaranteeing an instant hydrodynamic oil wedge under load.
            </p>
            <div className={s.checks}>
              <span>✓ DIN EN ISO 9001</span>
              <span>✓ Zero runout tolerance</span>
            </div>
          </div>
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

      {/* 7 — geometry architecture */}
      <section className={s.section}>
        <header className={s.head}>
          <span className={s.overline}>[ Core portfolio ]</span>
          <h2>Geometry architecture</h2>
          <p className={s.sub}>The two foundational mechanical face seal platforms.</p>
        </header>

        <div className={s.typeGrid}>
          <article className={s.typeCard}>
            <div className={s.typeHead}>
              <span className={s.typeName}>DO type [toric]</span>
              <span className={`${s.typeBadge} ${s.badgeBlue}`}>Most common</span>
            </div>
            <figure className={s.typeImg}>
              <img src={doImg} alt="DO type mechanical face seal with dual elastomeric O-rings" loading="lazy" />
              <span className={s.typeDim}>Ø 50 – 1420 mm</span>
            </figure>
            <p>
              Standard heavy-machinery seal using two precision toric O-rings. Ideal for track
              rollers, final drives and excavators in severe conditions.
            </p>
            <Link to="/category/duo-cone" className={s.typeLink}>
              Explore DO range <IconArrowRight size={16} />
            </Link>
          </article>

          <article className={s.typeCard}>
            <div className={s.typeHead}>
              <span className={s.typeName}>DF type [flange]</span>
              <span className={`${s.typeBadge} ${s.badgeAmber}`}>Specialised fit</span>
            </div>
            <figure className={s.typeImg}>
              <img src={dfImg} alt="DF type mechanical face seal with trapezoidal elastomer profile" loading="lazy" />
              <span className={s.typeDim}>Trapezoidal profile</span>
            </figure>
            <p>
              Trapezoidal elastomer design for older and specific OEM architectures (e.g. John Deere).
              Simplifies assembly where housing geometry rules out toric rings.
            </p>
            <Link to="/category/duo-cone" className={s.typeLink}>
              Explore DF range <IconArrowRight size={16} />
            </Link>
          </article>
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
