import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { adminApi, type SecretFingerprint } from "../../lib/adminApi";
import { usePrefersReducedMotion } from "./motionPrefs";
import s from "./Admin.module.css";

const TEMPLATE_PLACEHOLDERS: Record<string, string[]> = {
  order_confirmation: ["customer_name", "order_id", "total", "items"],
  inquiry_received: ["customer_name", "message", "email"],
  rfq_received: ["customer_name", "order_id", "email", "items"],
};

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
          : `Send failed via "${r.provider}" provider${r.error ? `: ${r.error}` : " — check server logs."}`
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
            <Field label="SendGrid API key" value={fmt(data.sendgrid_api_key)} secret />
            <Field label="Mailgun API key" value={fmt(data.mailgun_api_key)} secret />
            <Field label="Mailgun domain" value={data.mailgun_domain ?? "—"} />
            <Field label="SMTP host" value={data.smtp_host ?? "—"} />
            <Field label="SMTP port" value={String(data.smtp_port)} />
            <Field label="SMTP user" value={data.smtp_user ?? "—"} />
            <Field label="SMTP password" value={fmt(data.smtp_password)} secret />
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

      <NotificationRecipient reduceMotion={reduceMotion} />
      <EmailTemplates reduceMotion={reduceMotion} />
    </motion.div>
  );
}

function NotificationRecipient({ reduceMotion }: { reduceMotion: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings", "notifications"],
    queryFn: adminApi.getNotificationSettings,
  });
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (data) setValue(data.is_override ? data.notify_email : "");
  }, [data]);

  const save = useMutation({
    mutationFn: (v: string) => adminApi.updateNotificationSettings(v.trim() || null),
    onSuccess: (r) => {
      qc.setQueryData(["admin", "settings", "notifications"], r);
      setSaved(r.is_override ? `Saved — internal alerts now go to ${r.notify_email}.` : "Cleared — falling back to the sales email.");
    },
    onError: (e) => setSaved((e as Error).message),
  });

  return (
    <div className={s.card} style={{ padding: "var(--space-5)", marginTop: "var(--space-5)" }}>
      <h2 style={{ marginTop: 0 }}>Notification recipient</h2>
      <p className={s.muted}>
        Internal alerts for new orders and new inquiries go here. Leave blank to fall back to the
        sales email above{data?.notify_email ? ` (currently ${data.notify_email})` : ""}.
      </p>
      <form
        className={s.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(null);
          save.mutate(value);
        }}
      >
        <input
          className={s.input}
          type="email"
          placeholder="alerts@example.com"
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          disabled={isLoading}
        />
        <motion.button
          className={s.btn}
          type="submit"
          disabled={save.isPending}
          whileHover={reduceMotion ? undefined : { scale: 1.03 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        >
          {save.isPending ? "Saving…" : "Save"}
        </motion.button>
      </form>
      {saved && <p className={s.muted} style={{ marginTop: "var(--space-3)" }}>{saved}</p>}
    </div>
  );
}

function EmailTemplates({ reduceMotion }: { reduceMotion: boolean }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "email-templates"],
    queryFn: adminApi.listEmailTemplates,
  });
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className={s.card} style={{ padding: "var(--space-5)", marginTop: "var(--space-5)" }}>
      <h2 style={{ marginTop: 0 }}>Templates</h2>
      <p className={s.muted}>
        Editable subject and HTML body for the transactional emails the site sends. Keys are
        fixed — only subject/body can be edited.
      </p>
      {isLoading && <p className={s.muted}>Loading…</p>}
      {error && <p className={s.error}>{(error as Error).message}</p>}
      <div className={s.attentionList}>
        {(data ?? []).map((tpl) => (
          <div key={tpl.key}>
            <button
              type="button"
              className={s.btn}
              style={{ width: "100%", justifyContent: "space-between", display: "flex" }}
              onClick={() => setOpenKey(openKey === tpl.key ? null : tpl.key)}
            >
              <span>
                <strong>{tpl.key}</strong> — {tpl.subject}
              </span>
              <span>{openKey === tpl.key ? "▲" : "▼"}</span>
            </button>
            <AnimatePresence initial={false}>
              {openKey === tpl.key && (
                <motion.div
                  initial={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <TemplateEditor templateKey={tpl.key} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateEditor({ templateKey }: { templateKey: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "email-templates", templateKey],
    queryFn: () => adminApi.getEmailTemplate(templateKey),
  });
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setSubject(data.subject);
      setHtmlBody(data.html_body);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => adminApi.updateEmailTemplate(templateKey, { subject, html_body: htmlBody }),
    onSuccess: (r) => {
      qc.setQueryData(["admin", "email-templates", templateKey], r);
      qc.invalidateQueries({ queryKey: ["admin", "email-templates"] });
      setSaved("Saved.");
    },
    onError: (e) => setSaved((e as Error).message),
  });

  const placeholders = TEMPLATE_PLACEHOLDERS[templateKey] ?? [];

  if (isLoading) return <p className={s.muted}>Loading…</p>;

  return (
    <div style={{ padding: "var(--space-4) 0" }}>
      {placeholders.length > 0 && (
        <p className={s.muted} style={{ fontSize: "0.85em" }}>
          Available: {placeholders.map((p) => `{{${p}}}`).join(", ")}
        </p>
      )}
      <div className={s.field}>
        <label>Subject</label>
        <input className={s.input} value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div className={s.field} style={{ marginTop: "var(--space-3)" }}>
        <label>HTML body</label>
        <textarea
          className={s.textarea}
          style={{ minHeight: 180, fontFamily: "monospace", fontSize: "0.85em" }}
          value={htmlBody}
          onChange={(e) => setHtmlBody(e.target.value)}
        />
      </div>
      <div className={s.field} style={{ marginTop: "var(--space-3)" }}>
        <label>Live preview</label>
        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-3)",
            maxHeight: 240,
            overflow: "auto",
          }}
          dangerouslySetInnerHTML={{ __html: htmlBody }}
        />
      </div>
      <div className={s.toolbar} style={{ marginTop: "var(--space-3)" }}>
        <motion.button
          className={s.btn}
          type="button"
          disabled={save.isPending}
          onClick={() => {
            setSaved(null);
            save.mutate();
          }}
        >
          {save.isPending ? "Saving…" : "Save template"}
        </motion.button>
        {saved && <span className={s.muted}>{saved}</span>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  hint,
  secret,
}: {
  label: string;
  value: string;
  hint?: string;
  secret?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const isSet = secret && value !== "not set";
  const shown = secret && isSet && !revealed ? "•".repeat(Math.min(value.length, 20)) : value;
  return (
    <div className={s.field}>
      <label>{label}</label>
      <div className={s.row} style={{ gap: 6 }}>
        <input className={s.input} value={shown} readOnly title={hint} style={{ flex: 1 }} />
        {secret && isSet && (
          <button
            type="button"
            className={s.btnGhost}
            style={{ padding: "6px 10px", fontSize: "0.8rem" }}
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? "Hide" : "Show"}
          </button>
        )}
      </div>
    </div>
  );
}
