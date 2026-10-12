import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "../../lib/adminApi";
import { useAuthStore } from "../../store/auth";
import { PageHeader } from "./ui";
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
      <PageHeader title="My account" subtitle="Your profile and sign-in details." />

      <div className={`${s.card} ${s.cardPad} ${s.narrow}`}>
        <h2 className={s.panelTitle}>Profile</h2>
        <div className={s.miniRow}><span>Email</span><span className={s.miniVal}>{user?.email}</span></div>
        <div className={s.miniRow}><span>Name</span><span className={s.miniVal}>{user?.full_name ?? "—"}</span></div>
        <div className={s.miniRow}><span>Role</span><span className={s.miniVal}>{user?.is_admin ? "Administrator" : "User"}</span></div>
      </div>

      <form
        className={`${s.card} ${s.cardPad} ${s.narrow}`}
        onSubmit={submit}
      >
        <h2 className={s.cardTitle}>Change password</h2>
        <p className={s.cardSub}>Use at least 8 characters.</p>

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
        <div className={s.field} style={{ marginTop: 14 }}>
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
        <label className={s.switchLabel} style={{ marginTop: 14 }}>
          <input type="checkbox" className={s.check} checked={show} onChange={(e) => setShow(e.target.checked)} />
          Show passwords
        </label>

        {localErr && <p className={s.error} style={{ margin: "16px 0 0" }}>{localErr}</p>}
        {done && <p className={s.notice} data-tone="ok" style={{ margin: "16px 0 0" }}>Password updated.</p>}

        <div className={s.formFooter}>
          <button className={s.btn} type="submit" disabled={change.isPending}>
            {change.isPending ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </>
  );
}
