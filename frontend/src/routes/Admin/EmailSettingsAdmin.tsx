import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { adminApi, type SecretFingerprint } from "../../lib/adminApi";
import { usePrefersReducedMotion } from "./motionPrefs";
import s from "./Admin.module.css";

function fmt(fp: SecretFingerprint): string {
  if (!fp.configured) return "not set";
  if (fp.ends) return `${fp.starts}…${fp.ends} (${fp.length} chars)`;
  return `${fp.starts}… (${fp.length} chars)`;
}

export function EmailSettingsAdmin() {
  const reduceMotion = usePrefersReducedMotion();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "settings", "email"],
    queryFn: adminApi.getEmailSettings,
  });

  const [testTo, setTestTo] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);

  const sendTest = useMutation({
    mutationFn: (to: string) => adminApi.sendTestEmail(to),
    onSuccess: (r) =>
      setTestResult(
        r.sent
          ? `Sent via "${r.provider}" provider. Check the inbox (or server logs if provider is "console").`
          : `Send failed via "${r.provider}" provider — check server logs.`
      ),
    onError: (e) => setTestResult((e as Error).message),
  });

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
    >
      <h1 className={s.h1}>Email &amp; SMTP settings</h1>
      <p className={s.muted} style={{ marginTop: -8, marginBottom: "var(--space-5)" }}>
        Configured via environment variables on the server. This page shows the effective
        configuration (secrets masked) and lets you send a test message. There is no runtime
        override store yet — to change a value, update the server's env vars and redeploy.
      </p>

      {isLoading && <p className={s.muted}>Loading…</p>}
      {error && <p className={s.error}>{(error as Error).message}</p>}

      {data && (
        <div className={s.card} style={{ padding: "var(--space-5)" }}>
          <div className={s.formGrid}>
            <Field label="Configured provider" value={data.provider} />
            <Field label="Effective provider" value={data.effective_provider} hint="falls back to 'console' (log only) when the selected provider has no credentials" />
            <Field label="From address" value={data.email_from} />
            <Field label="From name" value={data.email_from_name} />
            <Field label="Sales email" value={data.sales_email} />
            <Field label="SendGrid API key" value={fmt(data.sendgrid_api_key)} />
            <Field label="Mailgun API key" value={fmt(data.mailgun_api_key)} />
            <Field label="Mailgun domain" value={data.mailgun_domain ?? "—"} />
            <Field label="SMTP host" value={data.smtp_host ?? "—"} />
            <Field label="SMTP port" value={String(data.smtp_port)} />
            <Field label="SMTP user" value={data.smtp_user ?? "—"} />
            <Field label="SMTP password" value={fmt(data.smtp_password)} />
            <Field label="SMTP STARTTLS" value={data.smtp_starttls ? "yes" : "no"} />
            <Field label="SMTP implicit TLS (SSL)" value={data.smtp_ssl ? "yes" : "no"} />
          </div>
        </div>
      )}

      <div className={s.card} style={{ padding: "var(--space-5)", marginTop: "var(--space-5)" }}>
        <h2 style={{ marginTop: 0 }}>Send a test email</h2>
        <p className={s.muted}>
          Sends a short message through the effective provider above, so you can verify
          credentials without digging through server logs.
        </p>
        <form
          className={s.toolbar}
          onSubmit={(e) => {
            e.preventDefault();
            setTestResult(null);
            if (testTo.trim()) sendTest.mutate(testTo.trim());
          }}
        >
          <input
            className={s.input}
            type="email"
            placeholder="you@example.com"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            required
          />
          <motion.button
            className={s.btn}
            type="submit"
            disabled={sendTest.isPending}
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          >
            {sendTest.isPending ? "Sending…" : "Send test email"}
          </motion.button>
        </form>
        {testResult && <p className={s.muted} style={{ marginTop: "var(--space-3)" }}>{testResult}</p>}
      </div>
    </motion.div>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={s.field}>
      <label>{label}</label>
      <input className={s.input} value={value} readOnly title={hint} />
    </div>
  );
}
