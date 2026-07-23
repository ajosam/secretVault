"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { RotationPolicy, Secret } from "@/lib/types";

const ROTATION_OPTIONS: { value: RotationPolicy; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "30d", label: "Every 30 days" },
  { value: "60d", label: "Every 60 days" },
  { value: "90d", label: "Every 90 days" },
  { value: "on-demand", label: "On demand" },
];

export function CreateSecretDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (secret: Secret) => void;
}) {
  const [name, setName] = useState("");
  const [namespace, setNamespace] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [rotationPolicy, setRotationPolicy] = useState<RotationPolicy>("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function reset() {
    setName("");
    setNamespace("");
    setValue("");
    setDescription("");
    setTags("");
    setRotationPolicy("manual");
    setFormError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !namespace.trim() || !value.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await fetch("/api/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        namespace: namespace.trim(),
        value,
        description: description.trim(),
        tags: tagList,
        rotationPolicy,
      }),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const { error } = await res.json();
      setFormError(error?.message ?? "Something went wrong. Please try again.");
      return;
    }

    const { data } = (await res.json()) as { data: Secret };
    onCreate(data);
    reset();
    onClose();
  }

  return (
    <div
      className={`h-full shrink-0 overflow-hidden border-border bg-surface transition-[width] duration-300 ease-in-out ${
        open ? "w-[380px] border-l" : "w-0 border-l-0"
      }`}
    >
      <div
        className={`flex h-full w-[380px] flex-col transition-opacity duration-200 ${
          open ? "opacity-100 delay-150" : "opacity-0"
        }`}
      >
        {open && (
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 className="text-[13px] font-semibold text-fg">New Secret</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={handleClose}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-hover hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-4">
                {formError && (
                  <div className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="secret-name" className="text-[12px] font-medium text-fg-muted">
                    Name
                  </label>
                  <input
                    id="secret-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="stripe-api-key"
                    required
                    className="h-8 rounded-md border border-border bg-surface-2 px-2.5 font-mono text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="secret-namespace" className="text-[12px] font-medium text-fg-muted">
                    Namespace
                  </label>
                  <input
                    id="secret-namespace"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    placeholder="production"
                    required
                    className="h-8 rounded-md border border-border bg-surface-2 px-2.5 font-mono text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
                  />
                  <p className="text-[11px] text-fg-subtle">Created automatically if it doesn&apos;t exist yet.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="secret-value" className="text-[12px] font-medium text-fg-muted">
                    Value
                  </label>
                  <textarea
                    id="secret-value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="sk_live_..."
                    rows={3}
                    required
                    className="resize-none rounded-md border border-border bg-surface-2 px-2.5 py-2 font-mono text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
                  />
                  <p className="text-[11px] text-fg-subtle">Encrypted at rest — never stored in plain text.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="secret-description" className="text-[12px] font-medium text-fg-muted">
                    Description
                  </label>
                  <textarea
                    id="secret-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this secret used for?"
                    rows={3}
                    className="resize-none rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="secret-tags" className="text-[12px] font-medium text-fg-muted">
                    Tags
                  </label>
                  <input
                    id="secret-tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="payments, critical"
                    className="h-8 rounded-md border border-border bg-surface-2 px-2.5 text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
                  />
                  <p className="text-[11px] text-fg-subtle">Comma-separated.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="secret-rotation" className="text-[12px] font-medium text-fg-muted">
                    Rotation Policy
                  </label>
                  <select
                    id="secret-rotation"
                    value={rotationPolicy}
                    onChange={(e) => setRotationPolicy(e.target.value as RotationPolicy)}
                    className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg focus:border-accent focus:outline-none"
                  >
                    {ROTATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                Create secret
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
