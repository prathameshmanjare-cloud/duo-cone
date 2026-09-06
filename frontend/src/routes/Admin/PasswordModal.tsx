import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import s from "./Admin.module.css";

export function PasswordModal({
  title,
  subject,
  busy,
  error,
  onSubmit,
  onClose,
}: {
  title: string;
  subject: string;
  busy?: boolean;
  error?: string | null;
  onSubmit: (password: string) => void;
  onClose: () => void;
}) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLocalErr(null);
    if (pw.length < 8) return setLocalErr("Password must be at least 8 characters.");
    if (pw !== confirm) return setLocalErr("Passwords do not match.");
    onSubmit(pw);
  }

  return createPortal(
    <div className={s.modalWrap} onMouseDown={onClose}>
      <form className={s.modal} onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{title}</h2>
        <p className={s.sub}>{subject}</p>

        <div className={s.field}>
          <label htmlFor="np">New password</label>
          <input
            id="np"
            className={s.input}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
          />
        </div>
        <div className={s.field} style={{ marginTop: "var(--space-3)" }}>
          <label htmlFor="cp">Confirm password</label>
          <input
            id="cp"
            className={s.input}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <label className={s.row} style={{ marginTop: "var(--space-3)", fontSize: "0.88rem" }}>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show
          passwords
        </label>

        {(localErr || error) && <p className={s.error}>{localErr || error}</p>}

        <div className={s.modalActions}>
          <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={s.btn} disabled={busy}>
            {busy ? "Saving…" : "Set password"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
