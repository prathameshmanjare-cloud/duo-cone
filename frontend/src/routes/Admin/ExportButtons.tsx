import { useState } from "react";
import { downloadExport } from "../../lib/adminApi";
import s from "./Admin.module.css";

type Resource = "products" | "orders" | "rfqs" | "users" | "brands" | "categories";

export function ExportButtons({
  resource,
  params = {},
}: {
  resource: Resource;
  params?: Record<string, string | number | boolean | undefined>;
}) {
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(format: "csv" | "pdf") {
    setBusy(format);
    setErr(null);
    try {
      await downloadExport(resource, format, params);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <span className={s.actions}>
      <button className={`${s.btn} ${s.btnGhost}`} disabled={busy !== null} onClick={() => run("csv")}>
        {busy === "csv" ? "…" : "Export CSV"}
      </button>
      <button className={`${s.btn} ${s.btnGhost}`} disabled={busy !== null} onClick={() => run("pdf")}>
        {busy === "pdf" ? "…" : "Export PDF"}
      </button>
      {err && <span className={s.error}>{err}</span>}
    </span>
  );
}
