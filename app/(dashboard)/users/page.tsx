import { formatTimestamp } from "@/lib/format";
import type { AppUser } from "@/lib/types";
import { ShieldCheck, ShieldOff } from "lucide-react";

const users: AppUser[] = [];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success border-success/25",
  invited: "bg-warning/10 text-warning border-warning/25",
  suspended: "bg-danger/10 text-danger border-danger/25",
};

export default function UsersPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-[14px] font-semibold text-fg">Users</h1>
          <p className="mt-0.5 text-[12px] text-fg-muted">Members and service accounts with access to this organization.</p>
        </div>
        <button className="flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-[12.5px] font-medium text-accent-fg hover:bg-accent/90">
          Invite user
        </button>
      </div>

      <table className="w-full min-w-[780px] border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-fg-subtle">
            <th className="px-6 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium">Last Active</th>
            <th className="px-3 py-2 font-medium">MFA</th>
            <th className="px-3 py-2 font-medium">Status</th>
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
              <td className="px-3 py-2.5 text-fg-muted">{u.role}</td>
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
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-fg-subtle">
                No users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
