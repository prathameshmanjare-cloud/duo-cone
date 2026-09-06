import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import s from "./Admin.module.css";

const LAST_EMAIL_KEY = "duocone-admin-email";

export function AdminLogin() {
  const { status, login, hydrate } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(LAST_EMAIL_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    if (status === "authed") navigate("/admin", { replace: true });
  }, [status, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password, remember);
      try {
        if (remember) localStorage.setItem(LAST_EMAIL_KEY, email);
        else localStorage.removeItem(LAST_EMAIL_KEY);
      } catch {
        /* storage unavailable — ignore */
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.authPage}>
      <div className={s.authCard}>
        <aside className={s.authAside}>
          <div className={s.authBrandRow}>
            <BrandMark />
            DuoCone CMS
          </div>
          <h2>Run the storefront from one place.</h2>
          <p>
            Prices, stock, catalog, orders, RFQs and customers — manage everything
            for the DuoCone mechanical face seal shop.
          </p>
          <div className={s.authPoints}>
            <span className={s.authPoint}><Dot /> Live stock &amp; price control</span>
            <span className={s.authPoint}><Dot /> Orders &amp; quote requests</span>
            <span className={s.authPoint}><Dot /> CSV &amp; PDF exports</span>
          </div>
        </aside>

        <main className={s.authMain}>
          <h1>Sign in</h1>
          <p className={s.lede}>Admin access only.</p>

          <form onSubmit={onSubmit} method="post" action="/admin/login" autoComplete="on">
            <div className={s.authField}>
              <label htmlFor="email">Email</label>
              <div className={s.authControl}>
                <IconMail />
                <input
                  id="email"
                  name="email"
                  className={s.authInput}
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="you@duo-cone.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={s.authField}>
              <label htmlFor="password">Password</label>
              <div className={s.authControl}>
                <IconLock />
                <input
                  id="password"
                  name="password"
                  className={s.authInput}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  autoFocus={email !== ""}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={s.pwToggle}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className={s.authRow}>
              <label className={s.remember}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <button type="button" className={s.linkBtn} onClick={() => setShowHelp((v) => !v)}>
                Forgot password?
              </button>
            </div>

            {error && <div className={s.error}>{error}</div>}

            <button className={s.authSubmit} type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {showHelp && (
            <div className={s.helpPanel}>
              Ask another admin to set a new password for you from{" "}
              <strong>Users → Reset PW</strong>. If you are the only admin, reset it
              from the server shell:
              <code>python -m scripts.create_admin --email YOUR_EMAIL --password NEW_PASSWORD</code>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="var(--color-secondary)" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.5" fill="var(--color-secondary)" />
    </svg>
  );
}
function Dot() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
