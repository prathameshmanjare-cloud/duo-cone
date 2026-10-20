import { useEffect, useState } from "react";
import { Link, useT } from "../../lib/i18n";
import { Button } from "../Button/Button";
import { loadAnalytics } from "../../lib/analytics";
import styles from "./CookieConsent.module.css";

const STORAGE_KEY = "duocone-cookie-consent";

export function CookieConsent() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted") {
      loadAnalytics();
    } else if (stored !== "declined") {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    loadAnalytics();
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label={t({ en: "Cookie consent", de: "Cookie-Einwilligung" })}>
      <p>
        {t({
          en: "We use cookies to run this site and, with your consent, to understand how it's used via Google Analytics. See our ",
          de: "Wir verwenden Cookies für den Betrieb dieser Website und, mit Ihrer Einwilligung, um über Google Analytics zu verstehen, wie sie genutzt wird. Details in unserer ",
        })}
        <Link to="/cookie-policy/">{t({ en: "Cookie Policy", de: "Cookie-Richtlinie" })}</Link>
        {t({ en: " for details.", de: "." })}
      </p>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={decline}>{t({ en: "Decline", de: "Ablehnen" })}</Button>
        <Button variant="primary" onClick={accept}>{t({ en: "Accept", de: "Akzeptieren" })}</Button>
      </div>
    </div>
  );
}
