import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import styles from "./Auth.module.css";

export function AuthForm({
  title,
  fields,
  submitLabel,
  footer,
}: {
  title: string;
  fields: { name: string; type: string; label: string }[];
  submitLabel: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>{title}</h1>
        <form onSubmit={(e) => e.preventDefault()}>
          {fields.map((f) => (
            <label key={f.name}>
              {f.label}
              <input type={f.type} name={f.name} required />
            </label>
          ))}
          <Button type="submit" style={{ width: "100%" }}>{submitLabel}</Button>
        </form>
        {footer}
      </div>
    </div>
  );
}

export const Login = () => (
  <AuthForm
    title="Log in"
    fields={[
      { name: "email", type: "email", label: "Email" },
      { name: "password", type: "password", label: "Password" },
    ]}
    submitLabel="Log in"
    footer={
      <p className={styles.foot}>
        <Link to="/forgot-password">Forgot password?</Link> · <Link to="/register">Create account</Link>
      </p>
    }
  />
);

export const Register = () => (
  <AuthForm
    title="Create account"
    fields={[
      { name: "fullName", type: "text", label: "Full name" },
      { name: "company", type: "text", label: "Company" },
      { name: "email", type: "email", label: "Email" },
      { name: "password", type: "password", label: "Password" },
    ]}
    submitLabel="Create account"
    footer={<p className={styles.foot}><Link to="/login">Already have an account? Log in</Link></p>}
  />
);

export const ForgotPassword = () => (
  <AuthForm
    title="Forgot password"
    fields={[{ name: "email", type: "email", label: "Email" }]}
    submitLabel="Send reset link"
    footer={<p className={styles.foot}><Link to="/login">Back to login</Link></p>}
  />
);

export const ResetPassword = () => (
  <AuthForm
    title="Reset password"
    fields={[{ name: "password", type: "password", label: "New password" }]}
    submitLabel="Reset password"
  />
);
