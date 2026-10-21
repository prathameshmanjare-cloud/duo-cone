import { useEffect, useRef, useState } from "react";
import { Link, useLang, useT } from "../../lib/i18n";
import { Button } from "../../components/Button/Button";
import { IconArrowRight } from "../../components/Icon/Icon";
import { COMPANY, COMPANY_ADDRESS } from "../../lib/company";
import heroImg from "../../assets/industries/tunel.webp";
import s from "./About.module.css";
import { Seo } from "../../components/Seo/Seo";
import { pageTitle } from "../../lib/seo";
import { DE_SEO } from "../../content/de";
import ds from "./DuoCone.module.css";

const PILLARS = [
  {
    n: "01",
    kicker: "Inventory",
    title: "Immediate availability",
    body: "A comprehensive inventory of standard DO and DF types physically stocked in Leverkusen, ready to halt field-equipment downtime the day you call.",
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

// German versions of the lists above (same order)
const DE = {
  pillars: [
    ["Bestand", "Sofortige Verfügbarkeit", "Ein umfassender Bestand an Standard-DO- und -DF-Typen liegt physisch auf Lager – bereit, Ihren Maschinenstillstand noch am Tag Ihres Anrufs zu beenden."],
    ["Tempo", "Antwort in 24 Stunden", "Unser technisches Team liefert verbindliche Angebote, Querverweislisten und CAD-Querschnittsprüfungen innerhalb eines Werktags."],
    ["Beratung", "Direkter Spezialisten-Service", "Sprechen Sie direkt mit erfahrenen Dichtungsingenieuren – ohne Warteschleifen und Ticket-Systeme. Metallurgische Antworten sofort."],
    ["Netzwerk", "Europaweite Reichweite", "Optimierter Landversand in Deutschland und der EU sowie Express-Luftfracht für dringende Bergbau- und Tunnelprojekte weltweit."],
  ],
  stats: ["Jahre Erfahrung", "abgeschlossene Projekte", "Produktionsfläche", "Kundenzufriedenheit"],
  parts: [
    ["Zwei Metall-Dichtringe", "Identische Ringe aus gehärtetem Gusseisen. Ihre Stirnflächen sind optisch plan geläppt und laufen als dynamische Dichtfläche gegeneinander."],
    ["Zwei torische Elastomerringe", "Gummiringe mit rundem Querschnitt auf schrägen Gehäuserampen. Sie pressen die Metallflächen mit definierter Axialkraft zusammen und dichten statisch gegen Gehäuse und Metallring ab."],
  ],
  function: [
    ["Flächenkontakt unter Last", "Die komprimierten torischen Ringe drücken die geläppten Flächen zusammen. Der Anpressdruck bleibt auch bei Verschleiß nahezu konstant – die Dichtung arbeitet über ihre gesamte Lebensdauer."],
    ["Hydrodynamischer Ölfilm", "Ein mikroskopisch dünner Getriebeölfilm bildet sich zwischen den drehenden Flächen. Er trägt die Last, führt Reibungswärme ab und verhindert Fressen von Metall auf Metall."],
    ["Schmutzabweisung", "Die Außenkante der Kontaktfläche streift Schlamm, Wasser, Sand und Schlämme vom abgedichteten Raum ab. Nichts Abrasives erreicht die Lager."],
    ["Selbstausrichtung", "Die torischen Ringe lassen jeden Metallring leicht schwimmen und kippen – die Flächen bleiben bei Wellendurchbiegung, Achsverformung und Wärmedehnung parallel."],
  ],
  specs: [
    ["Außendurchmesser", "50 bis 1420 mm"],
    ["Gleitgeschwindigkeit", "bis 10 m/s"],
    ["Planheit", "innerhalb von 2 Helium-Lichtbändern"],
    ["Temperatur", "−60 °C bis +200 °C"],
  ],
  steps: [
    ["Kontrollierte Gussmetallurgie", "Hochlegiertes Hartguss-Eisen (Ni-Hard) mit martensitischem Gefüge für hohe Abriebfestigkeit."],
    ["Elastomer-Rezepturen", "Anpressringe aus NBR, HNBR, FKM (Viton) und Silikon mit nahezu keinem bleibenden Verformungsrest von −40 °C bis +200 °C."],
    ["Felddiagnose", "Rückmeldungen aus schweren Erdbewegungs- und Tunnelvortriebsflotten fließen in die laufende Optimierung der Dichtungsgeometrie ein."],
  ],
};

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
  // the prerendered HTML carries the final number; after hydration it drops
  // to 0 so the count-up can run when the stats scroll into view
  const [n, setN] = useState(to);
  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (!reduce) setN(0);
  }, [reduce]);
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
  const t = useT();
  const lang = useLang();
  const de = lang === "de";
  const pillars = de ? PILLARS.map((p, i) => ({ ...p, kicker: DE.pillars[i][0], title: DE.pillars[i][1], body: DE.pillars[i][2] })) : PILLARS;
  const stats = de ? STATS.map((st, i) => ({ ...st, label: DE.stats[i] })) : STATS;
  const parts = de ? PARTS.map((p, i) => ({ ...p, title: DE.parts[i][0], body: DE.parts[i][1] })) : PARTS;
  const fn = de ? DE.function.map(([k, v]) => ({ k, v })) : FUNCTION;
  const specs = de ? DE.specs.map(([label, value]) => ({ label, value })) : SPECS;
  const steps = de ? STEPS.map((st, i) => ({ ...st, title: DE.steps[i][0], body: DE.steps[i][1] })) : STEPS;
  return (
    <div className={s.page}>
      <Seo
        title={t({ en: pageTitle("About Us – Mechanical Face Seal Specialists"), de: DE_SEO.about.title })}
        description={t({
          en: "DUO-CONE is a specialised German supplier and distributor of heavy-duty mechanical face seals, shipping from Leverkusen with 24-hour quotations and 24-hour dispatch.",
          de: DE_SEO.about.description,
        })}
      />

      {/* 1 — cinematic hero */}
      <section className={`${s.section} ${s.dark} ${s.hero}`}>
        <span className={s.gridDeco} aria-hidden="true" />
        <div className={s.heroInner}>
          <span className={s.pill}>
            <span className={s.dot} /> {t({ en: "German-engineered support since day one", de: "Technischer Support aus Deutschland vom ersten Tag an" })}
          </span>
          <h1 className={s.h1}>
            {t({ en: "Precision & availability.", de: "Präzision & Verfügbarkeit." })}
            <br />
            <span>{t({ en: "Direct from Germany.", de: "Direkt aus Deutschland." })}</span>
          </h1>

          <figure className={s.scanFrame}>
            <img src={heroImg} alt={t({ en: "DUO-CONE heavy-duty mechanical face seals", de: "DUO-CONE-Laufwerksdichtungen für schwere Einsätze" })} width={1230} height={820} loading="lazy" />
            <span className={s.corner} data-c="tl" />
            <span className={s.corner} data-c="tr" />
            <span className={s.corner} data-c="bl" />
            <span className={s.corner} data-c="br" />
            <span className={s.scanLine} aria-hidden="true" />
            <span className={s.scanTag}>{t({ en: "Live metrology bench · Station 04", de: "Messplatz live · Station 04" })}</span>
            <span className={s.scanMeta}>{t({ en: "Alloy: Ni-Hard / 15Cr-3Mo · Hardness 60–66 HRC", de: "Legierung: Ni-Hard / 15Cr-3Mo · Härte 60–66 HRC" })}</span>
          </figure>

          <p className={s.lead}>
            {t({
              en: "DUO-CONE is a specialised German supplier and global distributor of heavy-duty mechanical face seals. From our central warehouse in Leverkusen we keep immediate availability and direct engineering support for customers across Europe and worldwide.",
              de: "DUO-CONE ist ein spezialisierter deutscher Anbieter und weltweiter Distributor von Hochleistungs-Laufwerksdichtungen. Aus unserem Zentrallager halten wir sofortige Verfügbarkeit und direkten technischen Support für Kunden in Europa und weltweit bereit.",
            })}
          </p>

          <div className={s.heroActions}>
            <Link to="/rfq/">
              <Button variant="primary">
                {t({ en: "Get express offer (24h)", de: "Express-Angebot (24 h)" })} <IconArrowRight size={18} />
              </Button>
            </Link>
            <a className={s.callBtn} href={COMPANY.phoneHref}>
              {t({ en: "Call", de: "Anrufen:" })} {COMPANY.phoneDisplay}
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
          {stats.map((st, i) => (
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
          <span className={s.overline}>{t({ en: "[ Construction ]", de: "[ Aufbau ]" })}</span>
          <h2>{t({ en: "Four parts, one sealed joint", de: "Vier Teile, eine dichte Verbindung" })}</h2>
          <p className={s.sub}>
            {t({
              en: "Every duo cone seal is a symmetrical pair. One half turns with the shaft, the other stays with the housing, and the two are mirror images of each other.",
              de: "Jede Duo-Cone-Dichtung ist ein symmetrisches Paar. Eine Hälfte dreht sich mit der Welle, die andere bleibt im Gehäuse – beide sind Spiegelbilder voneinander.",
            })}
          </p>
        </header>

        <div className={ds.partGrid}>
          {parts.map((p) => (
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
          <span className={s.overline}>{t({ en: "[ Functionality ]", de: "[ Funktion ]" })}</span>
          <h2>{t({ en: "How a duo cone seal works", de: "So funktioniert eine Duo-Cone-Dichtung" })}</h2>
          <p className={s.sub}>
            {t({
              en: "The seal has no lip and never touches the shaft. All of the sealing happens at the two polished metal faces pressed together in the middle.",
              de: "Die Dichtung hat keine Lippe und berührt die Welle nie. Abgedichtet wird ausschließlich an den beiden polierten Metallflächen, die in der Mitte aneinandergepresst werden.",
            })}
          </p>
        </header>

        <div className={ds.funcGrid}>
          {fn.map((f) => (
            <div key={f.k} className={ds.funcRow}>
              <span className={ds.funcKey}>{f.k}</span>
              <p className={ds.funcVal}>{f.v}</p>
            </div>
          ))}
        </div>

        <div className={ds.specStrip}>
          {specs.map((sp) => (
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
          <span className={s.overline}>{t({ en: "[ Value proposition ]", de: "[ Ihr Vorteil ]" })}</span>
          <h2>{t({ en: "The DUO-CONE advantage", de: "Der DUO-CONE-Vorteil" })}</h2>
          <p className={s.sub}>{t({ en: "Built to eliminate industrial downtime and streamline heavy parts procurement.", de: "Entwickelt, um Stillstände zu vermeiden und die Beschaffung von Schwerlastteilen zu vereinfachen." })}</p>
        </header>

        <div className={s.pillars}>
          {pillars.map((p) => (
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
          <span className={s.overline}>{t({ en: "[ Industrial ecosystem ]", de: "[ Qualitätskreislauf ]" })}</span>
          <h2>{t({ en: "Closed-loop quality", de: "Geschlossener Qualitätskreislauf" })}</h2>
          <p className={s.sub}>{t({ en: "Connecting European metallurgy directly with field performance.", de: "Europäische Metallurgie, direkt verbunden mit der Praxis im Einsatz." })}</p>
        </header>

        <div className={s.steps}>
          {steps.map((st) => (
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
          <span className={s.dot} /> {t({ en: "Rapid response guarantee", de: "Schnelle Antwort garantiert" })}
        </span>
        <h2 className={s.onDark}>{t({ en: "Let’s engineer your sealing solution.", de: "Lassen Sie uns Ihre Dichtungslösung entwickeln." })}</h2>
        <p className={s.subDark}>
          {t({
            en: "Send us your OEM part number, sample dimensions or drawing. Our application specialists in Leverkusen return your quotation within 24 hours.",
            de: "Senden Sie uns Ihre OEM-Teilenummer, Musterabmessungen oder eine Zeichnung. Unsere Anwendungsspezialisten senden Ihnen innerhalb von 24 Stunden ein Angebot.",
          })}
        </p>
        <div className={s.heroActions}>
          <Link to="/rfq/">
            <Button variant="primary">
              {t({ en: "Express offer (24h)", de: "Express-Angebot (24 h)" })} <IconArrowRight size={18} />
            </Button>
          </Link>
          <a className={s.callBtn} href={COMPANY.phoneHref}>
            {t({ en: "Direct hotline:", de: "Direkte Hotline:" })} {COMPANY.phoneDisplay}
          </a>
        </div>
        <p className={s.legal}>
          {COMPANY.legalName} · {COMPANY_ADDRESS} · {COMPANY.certification}{" "}
          {t({
            en: "certified facility. All trademarks are the property of their respective OEM owners.",
            de: "zertifizierter Standort. Alle Marken sind Eigentum ihrer jeweiligen OEM-Inhaber.",
          })}
        </p>
      </section>
    </div>
  );
}
