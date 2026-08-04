"use client";

import { useState } from "react";
import { X, Loader2, Copy, Check } from "lucide-react";
import type { AppUser } from "@/lib/types";

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "devops", label: "DevOps" },
  { value: "developer", label: "Developer" },
  { value: "auditor", label: "Auditor" },
] as const;

export function InviteUserDialog({
  open,
  onClose,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: (user: AppUser) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("developer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  function reset() {
    setFullName("");
    setEmail("");
    setRole("developer");
    setFormError(null);
    setTempPassword(null);
    setCopied(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), role }),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const { error } = await res.json();
      setFormError(error?.message ?? "Something went wrong. Please try again.");
      return;
    }

    const { data } = await res.json();
    setTempPassword(data.tempPassword);
    onInvited({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      lastActive: data.lastActive,
      mfaEnabled: data.mfaEnabled,
      status: data.status,
    });
  }

  function handleCopy() {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface shadow-lg">
        {tempPassword ? (
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 className="text-[13px] font-semibold text-fg">Account created</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={handleClose}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-hover hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4">
              <p className="text-[12px] text-fg-muted">
                Share this temporary password with <span className="font-medium text-fg">{email}</span> — it's shown
                only once and can&apos;t be retrieved again.
              </p>
              <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
                <span className="font-mono text-[13px] text-fg">{tempPassword}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-hover hover:text-fg"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <button
                onClick={handleClose}
                className="flex items-center justify-center rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-fg hover:bg-accent/90"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 className="text-[13px] font-semibold text-fg">Invite User</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={handleClose}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-hover hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-4 py-4">
              {formError && (
                <div className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                  {formError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite-name" className="text-[12px] font-medium text-fg-muted">
                  Full name
                </label>
                <input
                  id="invite-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Priya Natarajan"
                  required
                  autoFocus
                  className="h-8 rounded-md border border-border bg-surface-2 px-2.5 text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite-email" className="text-[12px] font-medium text-fg-muted">
                  Work email
                </label>
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@company.com"
                  required
                  className="h-8 rounded-md border border-border bg-surface-2 px-2.5 text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite-role" className="text-[12px] font-medium text-fg-muted">
                  Role
                </label>
                <select
                  id="invite-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg focus:border-accent focus:outline-none"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-fg-subtle">
                No email is sent — a temporary password is generated and shown to you once, to share manually.
              </p>
            </div>

            <div className="flex gap-2 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex flex-1 items-center justify-center rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-fg hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-[12px] font-medium text-accent-fg hover:bg-accent/90 disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
