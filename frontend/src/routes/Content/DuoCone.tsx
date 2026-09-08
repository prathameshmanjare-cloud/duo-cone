import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { IconArrowRight } from "../../components/Icon/Icon";
import heroImg from "../../assets/industries/heavy.jpg";
import fitDrive from "../../assets/industries/mining.jpg";
import fitHub from "../../assets/industries/construction.jpg";
import fitGearbox from "../../assets/industries/tunel.jpg";
import s from "./DuoCone.module.css";

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
  {
    n: "03",
    title: "Housing ramps",
    body: "Precision-angled seats in the axle or hub. The ramp geometry locates each toric ring, sets the spring force and stops the ring from slipping or twisting under shock.",
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

/* Rajas animation slots — where a duo cone seal sits in the machine */
const FITMENTS = [
  {
    poster: fitDrive,
    title: "Final drive",
    body: "Sealing the planetary output of crawler and wheel loaders against crushed rock and coal dust.",
  },
  {
    poster: fitHub,
    title: "Wheel hub and track roller",
    body: "Keeping grease in and grit out of undercarriage rollers, idlers and rigid-truck wheel ends.",
  },
  {
    poster: fitGearbox,
    title: "Tunnel-boring gearbox",
    body: "Holding back groundwater and bentonite slurry at the main drive of a TBM cutter head.",
  },
];

const SPECS = [
  { label: "Outer diameter", value: "50 to 1420 mm" },
  { label: "Surface speed", value: "up to 10 m/s" },
  { label: "Face flatness", value: "within 2 helium light bands" },
  { label: "Temperature", value: "−60 °C to +200 °C" },
];

export function DuoCone() {
  return (
    <div className={s.page}>
      <Helmet>
        <title>What is a Duo Cone Seal | DuoCone</title>
        <meta
          name="description"
          content="A duo cone seal is a heavy-duty metal face seal built from two lapped metal rings and two elastomeric toric rings. Learn how it works and where it fits in the drive line."
        />
      </Helmet>

      {/* hero */}
      <section className={`${s.section} ${s.hero}`}>
        <span className={s.gridDeco} aria-hidden="true" />
        <div className={s.heroInner}>
          <span className={s.kicker}>
            <span className={s.dot} /> DUO-CONE · Face seal technology
          </span>
          <h1 className={s.h1}>What is a duo cone seal?</h1>
          <p className={s.lead}>
            A duo cone seal, also called a duo-cone or toric face seal, is a rugged rotary seal for
            the dirtiest parts of a machine. Two lapped metal rings run face to face, energised by
            two rubber toric rings, and together they lock lubricant inside the drive while shutting
            mud, water and abrasives out.
          </p>
          <figure className={s.heroFigure}>
            <img src={heroImg} alt="Duo cone mechanical face seal on heavy earthmoving equipment" loading="lazy" />
            <span className={s.heroTag}>Metal face seal · sealed-for-life drive line</span>
          </figure>
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

        <div className={s.partGrid}>
          {PARTS.map((p) => (
            <article key={p.n} className={s.partCard}>
              <span className={s.partNo}>{p.n}</span>
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

        <div className={s.funcGrid}>
          {FUNCTION.map((f) => (
            <div key={f.k} className={s.funcRow}>
              <span className={s.funcKey}>{f.k}</span>
              <p className={s.funcVal}>{f.v}</p>
            </div>
          ))}
        </div>

        <div className={s.specStrip}>
          {SPECS.map((sp) => (
            <div key={sp.label} className={s.spec}>
              <span className={s.specValue}>{sp.value}</span>
              <span className={s.specLabel}>{sp.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* where it fits — Rajas animations */}
      <section className={`${s.section} ${s.tint}`}>
        <header className={s.head}>
          <span className={s.overline}>[ Where it fits ]</span>
          <h2>Three places you will find a duo cone seal</h2>
          <p className={s.sub}>
            Short animations showing the seal in its working position inside the assembly.
          </p>
        </header>

        <div className={s.fitGrid}>
          {FITMENTS.map((f) => (
            <figure key={f.title} className={s.fitCard}>
              <div className={s.fitMedia}>
                {/*
                  Rajas animation goes here. Drop the file in src/assets and swap
                  this block for:
                  <video src={clip} poster={f.poster} controls preload="none" playsInline />
                */}
                <img src={f.poster} alt={f.title} loading="lazy" />
                <span className={s.playBadge} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className={s.fitFlag}>Animation coming soon</span>
              </div>
              <figcaption>
                <strong>{f.title}</strong>
                <p>{f.body}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* cta */}
      <section className={s.section}>
        <div className={s.cta}>
          <h2>Need a duo cone seal matched to your machine?</h2>
          <p>
            Send us the OEM number or the bore, and our engineers return an exact-fit equivalent with
            a binding quotation inside 24 hours.
          </p>
          <div className={s.ctaActions}>
            <Link to="/rfq">
              <Button variant="primary">
                Start an RFQ <IconArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/cross-reference" className={s.ctaLink}>
              Cross-reference a part number
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DuoCone;
