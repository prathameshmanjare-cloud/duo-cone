import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminUserRow } from "../../lib/adminApi";
import { useAuthStore } from "../../store/auth";
import { ExportButtons } from "./ExportButtons";
import { PasswordModal } from "./PasswordModal";
import s from "./Admin.module.css";

const PAGE_SIZE = 50;

export function UsersAdmin() {
  const qc = useQueryClient();
  const me = useAuthStore((st) => st.user);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const params = {
    q: search || undefined,
    is_admin: role === "admin" ? true : role === "customer" ? false : undefined,
    is_verified: role === "unverified" ? false : undefined,
    page,
    page_size: PAGE_SIZE,
  };
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminApi.listUsers(params),
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <div className={s.row} style={{ justifyContent: "space-between" }}>
        <h1 className={s.h1}>Users</h1>
        <ExportButtons resource="users" params={params} />
      </div>

      <form
        className={s.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
      >
        <input className={s.input} placeholder="Search email / name / company" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={s.select} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">Everyone</option>
          <option value="admin">Admins</option>
          <option value="customer">Customers</option>
          <option value="unverified">Unverified</option>
        </select>
        <button className={s.btn} type="submit">Filter</button>
      </form>

      {isLoading && <p className={s.muted}>Loading…</p>}
      {error && <p className={s.error}>{(error as Error).message}</p>}

      {data && (
        <>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Email</th><th>Name</th><th>Company</th><th>Orders</th><th>RFQs</th>
                  <th>Verified</th><th>Admin</th><th>Joined</th><th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <UserRow key={u.id} user={u} selfId={me?.id} onChanged={invalidate} />
                ))}
                {data.items.length === 0 && (
                  <tr><td colSpan={9} className={s.muted}>No users.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className={s.pager}>
            <button className={`${s.btn} ${s.btnGhost}`} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span className={s.muted}>Page {page} / {totalPages} · {data.total} total</span>
            <button className={`${s.btn} ${s.btnGhost}`} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </>
      )}
    </>
  );
}

function UserRow({
  user,
  selfId,
  onChanged,
}: {
  user: AdminUserRow;
  selfId?: string;
  onChanged: () => void;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetErr, setResetErr] = useState<string | null>(null);
  const isSelf = user.id === selfId;

  const patch = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateUser(user.id, data),
    onSuccess: () => {
      onChanged();
      setMsg("saved");
      setTimeout(() => setMsg(null), 1200);
    },
    onError: (e) => setMsg((e as Error).message),
  });
  const resetPw = useMutation({
    mutationFn: (pw: string) => adminApi.resetUserPassword(user.id, pw),
    onSuccess: () => {
      setResetOpen(false);
      setResetErr(null);
      setMsg("password reset");
      setTimeout(() => setMsg(null), 2000);
    },
    onError: (e) => setResetErr((e as Error).message),
  });
  const del = useMutation({
    mutationFn: () => adminApi.deleteUser(user.id),
    onSuccess: onChanged,
    onError: (e) => setMsg((e as Error).message),
  });

  return (
    <tr>
      <td>{user.email}{msg && <span className={s.muted}> · {msg}</span>}</td>
      <td>{user.full_name ?? "—"}</td>
      <td>{user.company_name ?? "—"}</td>
      <td className={s.muted}>{user.order_count}</td>
      <td className={s.muted}>{user.rfq_count}</td>
      <td>
        <input
          type="checkbox"
          checked={user.is_verified}
          onChange={(e) => patch.mutate({ is_verified: e.target.checked })}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={user.is_admin}
          disabled={isSelf}
          title={isSelf ? "You cannot change your own admin flag" : ""}
          onChange={(e) => patch.mutate({ is_admin: e.target.checked })}
        />
      </td>
      <td className={s.muted}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</td>
      <td className={s.actions}>
        <button
          className={`${s.btn} ${s.btnGhost}`}
          onClick={() => {
            setResetErr(null);
            setResetOpen(true);
          }}
        >
          Reset PW
        </button>
        {!isSelf && (
          <button
            className={`${s.btn} ${s.btnDanger}`}
            onClick={() => {
              if (confirm(`Delete ${user.email}? Their orders/RFQs stay but are unlinked.`)) del.mutate();
            }}
          >
            Del
          </button>
        )}
      </td>

      {resetOpen && (
        <PasswordModal
          title="Reset password"
          subject={`Set a new password for ${user.email}`}
          busy={resetPw.isPending}
          error={resetErr}
          onSubmit={(pw) => resetPw.mutate(pw)}
          onClose={() => setResetOpen(false)}
        />
      )}
    </tr>
  );
}
