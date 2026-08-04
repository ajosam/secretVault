"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Secret } from "@/lib/types";

export function RotateSecretDialog({
  secret,
  onClose,
  onRotated,
}: {
  secret: Secret | null;
  onClose: () => void;
  onRotated: (secret: Secret) => void;
}) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!secret) return null;

  function handleClose() {
    setValue("");
    setFormError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || !secret) return;

    setIsSubmitting(true);
    setFormError(null);

    const res = await fetch(`/api/secrets/${secret.id}/rotate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const { error } = await res.json();
      setFormError(error?.message ?? "Something went wrong. Please try again.");
      return;
    }

    const { data } = (await res.json()) as { data: Secret };
    onRotated(data);
    setValue("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="text-[13px] font-semibold text-fg">
              Rotate <span className="font-mono text-accent">{secret.name}</span>
            </h2>
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
            {formError && (
              <div className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                {formError}
              </div>
            )}
            <p className="text-[12px] text-fg-muted">
              Enter the new value. Version {secret.version} will be archived, not deleted — you can still see it in
              the Versions tab.
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rotate-value" className="text-[12px] font-medium text-fg-muted">
                New value
              </label>
              <textarea
                id="rotate-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="sk_live_..."
                rows={3}
                required
                autoFocus
                className="resize-none rounded-md border border-border bg-surface-2 px-2.5 py-2 font-mono text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
              />
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
              Rotate secret
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
