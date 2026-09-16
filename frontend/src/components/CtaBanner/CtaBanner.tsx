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
            <a
              className={styles.contact}
              href={`https://wa.me/${PHONE_HREF.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconWhatsApp /> {PHONE_DISPLAY}
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

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.45 1.33 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.9 9.9 0 0 0 12.04 2Zm0 1.67c2.21 0 4.28.86 5.84 2.42a8.2 8.2 0 0 1 2.42 5.87c0 4.56-3.71 8.27-8.28 8.27a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.39c0-4.57 3.71-8.28 8.27-8.28Zm-2.47 4.4c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02 0 1.2.87 2.35.99 2.51.12.16 1.7 2.6 4.19 3.64.58.25 1.04.4 1.4.51.59.19 1.12.16 1.55.1.47-.07 1.45-.59 1.66-1.17.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.72-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.77.96-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01Z" />
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
