import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "../../components/Button/Button";
import styles from "./Content.module.css";

export function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <div className={styles.page}>
      <Helmet><title>Contact | DuoCon</title></Helmet>
      <h1>Contact Us</h1>
      <p className={styles.intro}>
        Email <a href="mailto:sales@duo-cone.com">sales@duo-cone.com</a> · WhatsApp available · Germany-based support.
      </p>

      {sent ? (
        <p>Thanks — we've received your message and will reply within 1 business day.</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: POST /api/v1/contact
            setSent(true);
          }}
          style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: 480 }}
        >
          <input required placeholder="Name" aria-label="Name" style={{ padding: 10, border: "1px solid var(--color-border)", borderRadius: 8 }} />
          <input required type="email" placeholder="Email" aria-label="Email" style={{ padding: 10, border: "1px solid var(--color-border)", borderRadius: 8 }} />
          <textarea required rows={5} placeholder="Message" aria-label="Message" style={{ padding: 10, border: "1px solid var(--color-border)", borderRadius: 8 }} />
          <Button type="submit">Send message</Button>
        </form>
      )}
    </div>
  );
}
