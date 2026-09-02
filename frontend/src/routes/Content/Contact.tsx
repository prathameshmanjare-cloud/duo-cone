import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { api } from "../../lib/api";
import { IconArrowRight, IconCheck } from "../../components/Icon/Icon";
import styles from "./Contact.module.css";

interface ContactValues {
  name: string;
  company: string;
  email: string;
  phone: string;
  product: string;
  message: string;
  agree: boolean;
  /** honeypot — must stay empty */
  website: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ mode: "onBlur" });

  async function onSubmit(v: ContactValues) {
    setError(null);
    if (v.website) return; // bot
    try {
      await api.submitContact({
        name: v.name,
        company: v.company || undefined,
        email: v.email,
        phone: v.phone || undefined,
        product: v.product || undefined,
        message: v.message,
      });
      setSent(true);
      reset();
    } catch {
      setError("We couldn't send your message right now. Please email sales@duo-cone.com.");
    }
  }

  return (
    <div className={styles.wrap}>
      <Helmet>
        <title>Contact | DuoCon</title>
        <meta name="description" content="Get in touch with DuoCon — mechanical face seal specialists based in Germany. We reply within one business day." />
      </Helmet>

      <header className={styles.head}>
        <span className={styles.kicker}>Contact</span>
        <h1>We're here to answer your questions and support you.</h1>
        <p>
          Questions or need support? Reach out by phone, email, or the form below —
          our German-based team replies within one business day.
        </p>
      </header>

      <div className={styles.layout}>
        {/* ---------- form ---------- */}
        <div className={styles.formCard}>
          {sent ? (
            <div className={styles.success} role="status">
              <span className={styles.successIcon}>
                <IconCheck size={26} />
              </span>
              <h2>Message sent</h2>
              <p>Thanks for reaching out. We've received your message and will reply within one business day.</p>
              <button type="button" className={styles.linkBtn} onClick={() => setSent(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                className={styles.hp}
                aria-hidden="true"
                {...register("website")}
              />

              <div className={styles.row}>
                <div className={`${styles.field} ${errors.name ? styles.invalid : ""}`}>
                  <input id="c-name" placeholder=" " {...register("name", { required: "Enter your name" })} />
                  <label htmlFor="c-name">First &amp; last name</label>
                  {errors.name && <span className={styles.error}>{errors.name.message}</span>}
                </div>
                <div className={styles.field}>
                  <input id="c-company" placeholder=" " {...register("company")} />
                  <label htmlFor="c-company">Company name</label>
                </div>
              </div>

              <div className={styles.row}>
                <div className={`${styles.field} ${errors.email ? styles.invalid : ""}`}>
                  <input
                    id="c-email"
                    type="email"
                    placeholder=" "
                    {...register("email", {
                      required: "Enter your email",
                      pattern: { value: EMAIL_RE, message: "Enter a valid email" },
                    })}
                  />
                  <label htmlFor="c-email">Email address</label>
                  {errors.email && <span className={styles.error}>{errors.email.message}</span>}
                </div>
                <div className={styles.field}>
                  <input id="c-phone" type="tel" placeholder=" " {...register("phone")} />
                  <label htmlFor="c-phone">Phone number</label>
                </div>
              </div>

              <div className={styles.field}>
                <input id="c-product" placeholder=" " {...register("product")} />
                <label htmlFor="c-product">Product name or OEM part number</label>
              </div>

              <div className={`${styles.field} ${errors.message ? styles.invalid : ""}`}>
                <textarea
                  id="c-message"
                  rows={5}
                  placeholder=" "
                  {...register("message", {
                    required: "Enter a message",
                    minLength: { value: 10, message: "A little more detail helps us help you" },
                  })}
                />
                <label htmlFor="c-message">Your message</label>
                {errors.message && <span className={styles.error}>{errors.message.message}</span>}
              </div>

              <label className={`${styles.agree} ${errors.agree ? styles.agreeInvalid : ""}`}>
                <input type="checkbox" {...register("agree", { required: true })} />
                <span>
                  I agree to the{" "}
                  <Link to="/privacy-policy" target="_blank">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {error && <p className={styles.formError}>{error}</p>}

              <button type="submit" className={styles.submit} disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send message"}
                {!isSubmitting && <IconArrowRight size={17} />}
              </button>
            </form>
          )}
        </div>

        {/* ---------- contact details ---------- */}
        <aside className={styles.aside}>
          <span className={styles.asideBadge}>Replies within 24h</span>
          <h2>Contact details</h2>

          <ul className={styles.details}>
            <li>
              <span className={styles.dIcon}><IconPhone /></span>
              <div>
                <b>Phone</b>
                <a href="tel:+4915510386300">+49 155 10386300</a>
              </div>
            </li>
            <li>
              <span className={styles.dIcon}><IconMail /></span>
              <div>
                <b>Email</b>
                <a href="mailto:sales@duo-cone.com">sales@duo-cone.com</a>
              </div>
            </li>
            <li>
              <span className={styles.dIcon}><IconClock /></span>
              <div>
                <b>Working hours</b>
                <span>Mon – Fri · 08:00 – 18:00 CET</span>
              </div>
            </li>
          </ul>

          <div className={styles.madeIn}>
            <span className={styles.flag} aria-hidden="true" />
            Engineered &amp; made in Germany
          </div>
        </aside>
      </div>
    </div>
  );
}
