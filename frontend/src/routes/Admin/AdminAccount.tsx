import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "../../lib/adminApi";
import { useAuthStore } from "../../store/auth";
import s from "./Admin.module.css";

export function AdminAccount() {
  const user = useAuthStore((st) => st.user);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const change = useMutation({
    mutationFn: (next: string) => adminApi.resetUserPassword(user!.id, next),
    onSuccess: () => {
      setDone(true);
      setPw("");
      setConfirm("");
      setLocalErr(null);
    },
    onError: (e) => setLocalErr((e as Error).message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setDone(false);
    setLocalErr(null);
    if (pw.length < 8) return setLocalErr("Password must be at least 8 characters.");
    if (pw !== confirm) return setLocalErr("Passwords do not match.");
    change.mutate(pw);
  }

  return (
    <>
      <h1 className={s.h1}>My account</h1>

      <div className={s.card} style={{ padding: "var(--space-5)", maxWidth: 520, marginBottom: "var(--space-5)" }}>
        <div className={s.miniRow}><span>Email</span><span className={s.miniVal}>{user?.email}</span></div>
        <div className={s.miniRow}><span>Name</span><span className={s.miniVal}>{user?.full_name ?? "—"}</span></div>
        <div className={s.miniRow}><span>Role</span><span className={s.miniVal}>{user?.is_admin ? "Administrator" : "User"}</span></div>
      </div>

      <form
        className={s.card}
        style={{ padding: "var(--space-5)", maxWidth: 520 }}
        onSubmit={submit}
      >
        <h2 style={{ marginTop: 0 }}>Change password</h2>

        <div className={s.field}>
          <label htmlFor="np">New password</label>
          <input
            id="np"
            className={s.input}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </div>
        <div className={s.field} style={{ marginTop: "var(--space-3)" }}>
          <label htmlFor="cp">Confirm new password</label>
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

        {localErr && <p className={s.error}>{localErr}</p>}
        {done && <p style={{ color: "var(--color-success)", fontWeight: 600 }}>Password updated.</p>}

        <div className={s.row} style={{ marginTop: "var(--space-4)" }}>
          <button className={s.btn} type="submit" disabled={change.isPending}>
            {change.isPending ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </>
  );
}
