"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { formatTimestamp } from "@/lib/format";
import type { AppUser } from "@/lib/types";
import { InviteUserDialog } from "@/components/InviteUserDialog";

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "devops", label: "DevOps" },
  { value: "developer", label: "Developer" },
  { value: "auditor", label: "Auditor" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success border-success/25",
  invited: "bg-warning/10 text-warning border-warning/25",
  suspended: "bg-danger/10 text-danger border-danger/25",
};

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(({ data }: { data: AppUser[] }) => setUsers(data))
      .finally(() => setIsLoading(false));
  }, []);

  function handleInvited(user: AppUser) {
    setUsers((prev) => [...prev, user]);
  }

  async function handleRoleChange(id: string, role: string) {
    setPendingId(id);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
    }
    setPendingId(null);
  }

  async function handleToggleStatus(user: AppUser) {
    const nextStatus = user.status === "suspended" ? "active" : "suspended";
    setPendingId(user.id);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === user.id ? data : u)));
    }
    setPendingId(null);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-[14px] font-semibold text-fg">Users</h1>
          <p className="mt-0.5 text-[12px] text-fg-muted">Members and service accounts with access to this organization.</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-[12.5px] font-medium text-accent-fg hover:bg-accent/90"
        >
          Invite user
        </button>
      </div>

      <table className="w-full min-w-[860px] border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-fg-subtle">
            <th className="px-6 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium">Last Active</th>
            <th className="px-3 py-2 font-medium">MFA</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border-muted hover:bg-surface-hover">
              <td className="px-6 py-2.5">
                <div className="flex flex-col">
                  <span className="font-medium text-fg">{u.name}</span>
                  <span className="font-mono text-[11px] text-fg-subtle">{u.email}</span>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <select
                  value={u.role}
                  disabled={pendingId === u.id}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="h-7 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg-muted focus:border-accent focus:outline-none disabled:opacity-60"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2.5 tabular text-fg-muted">
                {u.lastActive === "—" ? "—" : formatTimestamp(u.lastActive)}
              </td>
              <td className="px-3 py-2.5">
                {u.mfaEnabled ? (
                  <ShieldCheck className="h-4 w-4 text-success" strokeWidth={1.75} />
                ) : (
                  <ShieldOff className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} />
                )}
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[u.status]}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {u.status}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right">
                <button
                  onClick={() => handleToggleStatus(u)}
                  disabled={pendingId === u.id}
                  className="text-[11.5px] font-medium text-fg-muted hover:text-fg disabled:opacity-60"
                >
                  {u.status === "suspended" ? "Reactivate" : "Suspend"}
                </button>
              </td>
            </tr>
          ))}
          {!isLoading && users.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-fg-subtle">
                No users yet.
              </td>
            </tr>
          )}
          {isLoading && (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-fg-subtle">
                Loading…
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <InviteUserDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onInvited={handleInvited} />
    </div>
  );
}
