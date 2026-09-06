import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button/Button";
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

export const ForgotPassword = () => (
  <div className={styles.page}>
    <div className={styles.card}>
      <h1>Forgot password</h1>
      <p>
        Password reset by email isn't available yet. Contact{" "}
        <a href="mailto:sales@duo-cone.com">sales@duo-cone.com</a> and our team will
        help you regain access.
      </p>
      <p className={styles.foot}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  </div>
);

export const ResetPassword = () => (
  <div className={styles.page}>
    <div className={styles.card}>
      <h1>Reset password</h1>
      <p>
        This link is no longer valid. Contact{" "}
        <a href="mailto:sales@duo-cone.com">sales@duo-cone.com</a> for assistance.
      </p>
      <p className={styles.foot}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  </div>
);
