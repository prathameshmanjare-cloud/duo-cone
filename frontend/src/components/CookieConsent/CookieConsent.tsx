import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../Button/Button";
import { loadAnalytics } from "../../lib/analytics";
import styles from "./CookieConsent.module.css";

const STORAGE_KEY = "duocone-cookie-consent";

export function CookieConsent() {
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
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p>
        We use cookies to run this site and, with your consent, to understand how it's used via Google
        Analytics. See our <Link to="/cookie-policy">Cookie Policy</Link> for details.
      </p>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={decline}>Decline</Button>
        <Button variant="primary" onClick={accept}>Accept</Button>
      </div>
    </div>
  );
}
