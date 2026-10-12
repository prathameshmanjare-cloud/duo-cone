import { useState } from "react";
import { downloadExport } from "../../lib/adminApi";
import { Icon } from "./ui";
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
    <>
      {(["csv", "pdf"] as const).map((format) => (
        <button
          key={format}
          type="button"
          className={`${s.btn} ${s.btnGhost}`}
          disabled={busy !== null}
          onClick={() => run(format)}
          aria-label={`Export ${format.toUpperCase()}`}
        >
          <Icon name="download" size={15} />
          {busy === format ? "Exporting…" : format.toUpperCase()}
        </button>
      ))}
      {err && <span className={s.error} style={{ margin: 0 }}>{err}</span>}
    </>
  );
}
