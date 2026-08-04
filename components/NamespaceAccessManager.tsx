"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { AppUser, Namespace } from "@/lib/types";

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "devops", label: "DevOps" },
  { value: "developer", label: "Developer" },
  { value: "auditor", label: "Auditor" },
] as const;

interface Assignment {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
}

function roleLabel(value: string): string {
  return ROLE_OPTIONS.find((r) => r.value === value)?.label ?? value;
}

export function NamespaceAccessManager({ namespaces, users }: { namespaces: Namespace[]; users: AppUser[] }) {
  const [namespaceId, setNamespaceId] = useState(namespaces[0]?.id ?? "");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("developer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!namespaceId) return;
    setIsLoading(true);
    fetch(`/api/namespaces/${namespaceId}/access`)
      .then((res) => res.json())
      .then(({ data }: { data: Assignment[] }) => setAssignments(data))
      .finally(() => setIsLoading(false));
  }, [namespaceId]);

  const availableUsers = users.filter((u) => !assignments.some((a) => a.userId === u.id));

  useEffect(() => {
    if (availableUsers.length > 0 && !availableUsers.some((u) => u.id === selectedUserId)) {
      setSelectedUserId(availableUsers[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, users]);

  async function handleAssign() {
    if (!selectedUserId || !namespaceId) return;
    setIsSubmitting(true);
    setFormError(null);

    const res = await fetch(`/api/namespaces/${namespaceId}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const { error } = await res.json();
      setFormError(error?.message ?? "Something went wrong. Please try again.");
      return;
    }

    const { data } = (await res.json()) as { data: Assignment };
    setAssignments((prev) => [...prev.filter((a) => a.userId !== data.userId), data]);
  }

  async function handleRevoke(userId: string) {
    await fetch(`/api/namespaces/${namespaceId}/access/${userId}`, { method: "DELETE" });
    setAssignments((prev) => prev.filter((a) => a.userId !== userId));
  }

  if (namespaces.length === 0) {
    return (
      <div className="rounded-lg border border-border px-4 py-8 text-center text-[12.5px] text-fg-subtle">
        Create a namespace first to manage who has access to it.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="text-[12px] font-medium text-fg-muted">Namespace</span>
        <select
          value={namespaceId}
          onChange={(e) => setNamespaceId(e.target.value)}
          className="h-7 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg focus:border-accent focus:outline-none"
        >
          {namespaces.map((ns) => (
            <option key={ns.id} value={ns.id}>
              {ns.name}
            </option>
          ))}
        </select>
      </div>

      <table className="w-full border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-border-muted text-[11px] uppercase tracking-wide text-fg-subtle">
            <th className="px-4 py-2 font-medium">User</th>
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-fg-subtle">
                Loading…
              </td>
            </tr>
          ) : assignments.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-fg-subtle">
                No one has explicit access to this namespace yet.
              </td>
            </tr>
          ) : (
            assignments.map((a) => (
              <tr key={a.userId} className="border-b border-border-muted last:border-0">
                <td className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-fg">{a.userName}</span>
                    <span className="font-mono text-[11px] text-fg-subtle">{a.userEmail}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-fg-muted">{roleLabel(a.role)}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleRevoke(a.userId)}
                    aria-label={`Remove ${a.userName}`}
                    className="text-fg-subtle hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        {availableUsers.length === 0 ? (
          <span className="text-[11.5px] text-fg-subtle">Every user in the org already has access here.</span>
        ) : (
          <>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="h-7 flex-1 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg focus:border-accent focus:outline-none"
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-7 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg focus:border-accent focus:outline-none"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={isSubmitting}
              className="flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-[12.5px] font-medium text-accent-fg hover:bg-accent/90 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add access
            </button>
          </>
        )}
      </div>
      {formError && <p className="px-4 pb-3 text-[11.5px] text-danger">{formError}</p>}
    </div>
  );
}
