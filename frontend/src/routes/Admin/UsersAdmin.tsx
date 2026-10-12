import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminUserRow } from "../../lib/adminApi";
import { useAuthStore } from "../../store/auth";
import { ExportButtons } from "./ExportButtons";
import { PasswordModal } from "./PasswordModal";
import { ConfirmModal } from "./ConfirmModal";
import { DeleteButton, EmptyRow, Icon, PageHeader, Pager, SearchField, TableSkeleton, fmtDate } from "./ui";
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

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Customer and administrator accounts."
        actions={<ExportButtons resource="users" params={params} />}
      />

      <form
        className={s.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
      >
        <SearchField value={q} onChange={setQ} placeholder="Search email, name or company" />
        <select
          className={s.select}
          aria-label="Filter by role"
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
        >
          <option value="">Everyone</option>
          <option value="admin">Admins</option>
          <option value="customer">Customers</option>
          <option value="unverified">Unverified</option>
        </select>
        <button className={`${s.btn} ${s.btnGhost}`} type="submit">Search</button>
      </form>

      {isLoading && <TableSkeleton cols={7} />}
      {error && <p className={s.error}>{(error as Error).message}</p>}

      {data && (
        <>
          <div className={s.tableWrap}>
            <table className={`${s.table} ${s.tableStack}`}>
              <thead>
                <tr>
                  <th>User</th><th>Company</th><th className={s.right}>Orders</th><th className={s.right}>RFQs</th>
                  <th>Verified</th><th>Admin</th><th>Joined</th><th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <UserRow key={u.id} user={u} selfId={me?.id} onChanged={invalidate} />
                ))}
                {data.items.length === 0 && (
                  <EmptyRow colSpan={8} title="No users found" hint="Try a different search or role filter." />
                )}
              </tbody>
            </table>
          </div>
          <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
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
  const [confirming, setConfirming] = useState(false);
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
      <td data-primary>
        <span className={s.cellStack}>
          <span className={s.strong}>
            {user.full_name || user.email}
            {isSelf && <span className={s.savedTag}>you</span>}
            {msg && <span className={s.savedTag}>{msg}</span>}
          </span>
          {user.full_name && <small>{user.email}</small>}
        </span>
      </td>
      <td data-label="Company">{user.company_name ?? "—"}</td>
      <td data-label="Orders" className={`${s.right} ${s.num}`}>{user.order_count}</td>
      <td data-label="RFQs" className={`${s.right} ${s.num}`}>{user.rfq_count}</td>
      <td data-label="Verified">
        <input
          type="checkbox"
          className={s.switch}
          aria-label={`${user.email} verified`}
          checked={user.is_verified}
          onChange={(e) => patch.mutate({ is_verified: e.target.checked })}
        />
      </td>
      <td data-label="Admin">
        <input
          type="checkbox"
          className={s.switch}
          aria-label={`${user.email} admin`}
          checked={user.is_admin}
          disabled={isSelf}
          title={isSelf ? "You cannot change your own admin flag" : ""}
          onChange={(e) => patch.mutate({ is_admin: e.target.checked })}
        />
      </td>
      <td data-label="Joined" className={s.muted}>{fmtDate(user.created_at)}</td>
      <td className={s.cellActions}>
        <button
          className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
          onClick={() => {
            setResetErr(null);
            setResetOpen(true);
          }}
        >
          <Icon name="lock" size={14} /> Reset password
        </button>
        {!isSelf && <DeleteButton label={`Delete ${user.email}`} onClick={() => setConfirming(true)} />}
      </td>

      {confirming && (
        <ConfirmModal
          title="Delete user"
          message={`Delete ${user.email}? Their orders and RFQs stay but are unlinked.`}
          confirmLabel="Delete"
          onConfirm={() => {
            setConfirming(false);
            del.mutate();
          }}
          onClose={() => setConfirming(false)}
        />
      )}
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
