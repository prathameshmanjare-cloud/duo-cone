import { COMPANY, COMPANY_ADDRESS, MAP_EMBED_URL } from "../../lib/company";
import { Reveal } from "../Reveal/Reveal";
import styles from "./CtaBanner.module.css";

const PHONE_DISPLAY = COMPANY.phoneDisplay;
const PHONE_HREF = COMPANY.phoneHref;
const EMAIL = COMPANY.email;
const ADDRESS = COMPANY_ADDRESS;
const MAP_EMBED = MAP_EMBED_URL;

export function CtaBanner() {
  return (
    <section className={styles.section} aria-labelledby="cta-title">
      <div className={styles.grid}>
        <Reveal className={styles.panel}>
          <span className={styles.eyebrow}>Let&rsquo;s work together</span>
          <h2 id="cta-title" className={styles.title}>
            Get in touch to start your next project<span>.</span>
          </h2>
          <p className={styles.copy}>
            Questions, a part number to cross-reference, or a bulk requirement? Our
            German-based engineering team gives expert guidance and tailored seal
            solutions, and replies within one business day.
          </p>
          <div className={styles.contacts}>
            <a className={styles.contact} href={PHONE_HREF}>
              <IconPhone /> {PHONE_DISPLAY}
            </a>
            <a className={styles.contact} href={`mailto:${EMAIL}`}>
              <IconMail /> {EMAIL}
            </a>
          </div>
        </Reveal>

        <Reveal className={styles.mapCard} delay={0.12}>
          <iframe
            src={MAP_EMBED}
            title={`Map showing ${ADDRESS}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <span className={styles.mapCaption}>Headquarters &amp; home of engineering</span>
        </Reveal>
      </div>
    </section>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}
