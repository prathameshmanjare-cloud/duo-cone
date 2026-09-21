import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { api } from "../../lib/api";
import { useSession } from "../../store/session";
import styles from "./Auth.module.css";

type Mode = "login" | "register";

function AuthScreen({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/account";
  const { login, register } = useSession();

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register({
          email: form.email,
          password: form.password,
          full_name: form.full_name || undefined,
          company_name: form.company_name || undefined,
        });
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>{mode === "login" ? "Log in" : "Create account"}</h1>
        <form onSubmit={onSubmit}>
          {mode === "register" && (
            <>
              <label>
                Full name
                <input
                  type="text"
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                />
              </label>
              <label>
                Company
                <input
                  type="text"
                  autoComplete="organization"
                  value={form.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                />
              </label>
            </>
          )}
          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </Button>
        </form>
        <p className={styles.foot}>
          {mode === "login" ? (
            <>
              <Link to="/forgot-password">Forgot password?</Link> ·{" "}
              <Link to="/register">Create account</Link>
            </>
          ) : (
            <Link to="/login">Already have an account? Log in</Link>
          )}
        </p>
      </div>
    </div>
  );
}

export const Login = () => <AuthScreen mode="login" />;
export const Register = () => <AuthScreen mode="register" />;

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Forgot password</h1>
        {sent ? (
          <p>
            If an account exists for <strong>{email}</strong>, a password reset link has been
            sent. Check your inbox (and spam folder) — the link expires in 30 minutes.
          </p>
        ) : (
          <form onSubmit={onSubmit}>
            <label>
              Email
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" style={{ width: "100%" }} disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <p className={styles.foot}>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1>Reset password</h1>
          <p>
            This link is missing its token. Contact{" "}
            <a href="mailto:sale@duo-cone.com">sale@duo-cone.com</a> for assistance.
          </p>
          <p className={styles.foot}>
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.resetPassword(token, password);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "This reset link is invalid or has expired. Request a new one."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Reset password</h1>
        <form onSubmit={onSubmit}>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Saving…" : "Set new password"}
          </Button>
        </form>
        <p className={styles.foot}>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
};
