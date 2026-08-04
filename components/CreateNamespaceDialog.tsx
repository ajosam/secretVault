"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Namespace } from "@/lib/types";

export function CreateNamespaceDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (namespace: Namespace) => void;
}) {
  const [name, setName] = useState("");
  const [policyLabel, setPolicyLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setName("");
    setPolicyLabel("");
    setFormError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    const res = await fetch("/api/namespaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), policyLabel: policyLabel.trim() }),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const { error } = await res.json();
      setFormError(error?.message ?? "Something went wrong. Please try again.");
      return;
    }

    const { data } = (await res.json()) as { data: Namespace };
    onCreate(data);
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="text-[13px] font-semibold text-fg">New Namespace</h2>
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
              <label htmlFor="namespace-name" className="text-[12px] font-medium text-fg-muted">
                Name
              </label>
              <input
                id="namespace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="production"
                required
                autoFocus
                className="h-8 rounded-md border border-border bg-surface-2 px-2.5 font-mono text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="namespace-policy" className="text-[12px] font-medium text-fg-muted">
                Access Policy Label
              </label>
              <input
                id="namespace-policy"
                value={policyLabel}
                onChange={(e) => setPolicyLabel(e.target.value)}
                placeholder="sre-admin-only"
                className="h-8 rounded-md border border-border bg-surface-2 px-2.5 text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
              />
              <p className="text-[11px] text-fg-subtle">A descriptive label only — not enforced yet.</p>
            </div>
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
              Create namespace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
