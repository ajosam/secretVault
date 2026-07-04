"use client";

import { useState } from "react";
import { X, Copy, RotateCw, Trash2 } from "lucide-react";
import type { Secret, PermissionLevel } from "@/lib/types";
import { StatusBadge, ResultBadge } from "./StatusBadge";
import { formatTimestamp, formatRelativeToNow } from "@/lib/data";

const TABS = ["Overview", "Versions", "Access History", "Permissions", "Settings"] as const;
type Tab = (typeof TABS)[number];

const LEVEL_STYLES: Record<PermissionLevel, string> = {
  admin: "text-accent",
  write: "text-success",
  read: "text-fg-muted",
  none: "text-fg-subtle",
};

const LEVEL_LABEL: Record<PermissionLevel, string> = {
  admin: "Admin",
  write: "Write",
  read: "Read",
  none: "None",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-fg-subtle">{label}</span>
      <div className="text-[12.5px] text-fg">{children}</div>
    </div>
  );
}

export function DetailsPanel({ secret, onClose }: { secret: Secret | null; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("Overview");

  if (!secret) {
    return (
      <div className="flex h-full w-[380px] shrink-0 flex-col items-center justify-center border-l border-border bg-surface px-6 text-center">
        <p className="text-[12.5px] text-fg-subtle">Select a secret to view its metadata, versions, and access history.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[13px] font-semibold text-fg">{secret.name}</h2>
            <StatusBadge status={secret.status} />
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-fg-subtle">{secret.path}</p>
        </div>
        <button
          aria-label="Close details panel"
          onClick={onClose}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-hover hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex border-b border-border px-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-2.5 py-2 text-[12px] font-medium transition-colors ${
              tab === t
                ? "border-accent text-fg"
                : "border-transparent text-fg-subtle hover:text-fg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "Overview" && (
          <div className="flex flex-col gap-4">
            <p className="text-[12.5px] leading-relaxed text-fg-muted">{secret.description}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <Field label="Namespace">{secret.namespace}</Field>
              <Field label="Owner">{secret.owner}</Field>
              <Field label="Created">{formatTimestamp(secret.createdAt)}</Field>
              <Field label="Last Updated">{formatTimestamp(secret.updatedAt)}</Field>
              <Field label="Expiration">
                {secret.expiresAt ? formatTimestamp(secret.expiresAt) : "Never"}
              </Field>
              <Field label="Current Version">
                <span className="font-mono">v{secret.version}</span>
              </Field>
            </div>
            <div className="border-t border-border-muted pt-3">
              <Field label="Rotation Schedule">
                <div className="flex items-center justify-between">
                  <span>{secret.rotationPolicy === "manual" ? "Manual rotation" : secret.rotationPolicy === "on-demand" ? "On demand" : `Every ${secret.rotationPolicy.replace("d", " days")}`}</span>
                  {secret.nextRotation && (
                    <span className="text-fg-subtle">next {formatRelativeToNow(secret.nextRotation)}</span>
                  )}
                </div>
              </Field>
            </div>
            <div className="border-t border-border-muted pt-3">
              <span className="text-[11px] uppercase tracking-wide text-fg-subtle">Tags</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {secret.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-fg-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 border-t border-border-muted pt-3">
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-fg hover:bg-surface-hover">
                <Copy className="h-3.5 w-3.5" /> Copy path
              </button>
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-fg hover:bg-surface-hover">
                <RotateCw className="h-3.5 w-3.5" /> Rotate now
              </button>
            </div>
          </div>
        )}

        {tab === "Versions" && (
          <div className="flex flex-col">
            {secret.versions.map((v) => (
              <div key={v.version} className="flex items-center justify-between gap-2 border-b border-border-muted py-2.5 last:border-0">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[12.5px] text-fg">v{v.version}</span>
                    {v.status === "active" && (
                      <span className="rounded-md bg-success/10 px-1 py-0.5 text-[10px] font-medium text-success">
                        current
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-fg-subtle">{v.checksum}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-right">
                  <span className="text-[11.5px] text-fg-muted">{formatTimestamp(v.createdAt)}</span>
                  <span className="text-[11px] text-fg-subtle">{v.createdBy}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Access History" && (
          <div className="flex flex-col">
            {secret.accessHistory.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-2 border-b border-border-muted py-2.5 last:border-0">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[12px] text-fg">{event.actor}</span>
                  <span className="text-[11px] text-fg-subtle">{event.action} · {event.ip}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <ResultBadge result={event.result} />
                  <span className="text-[11px] text-fg-subtle">{formatTimestamp(event.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Permissions" && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-border-muted pb-2 text-[11px] uppercase tracking-wide text-fg-subtle">
              <span>Role</span>
              <span>Access Level</span>
            </div>
            {secret.permissions.map((p) => (
              <div key={p.role} className="flex items-center justify-between border-b border-border-muted py-2.5 last:border-0">
                <span className="text-[12.5px] text-fg">{p.role}</span>
                <span className={`text-[12px] font-medium ${LEVEL_STYLES[p.level]}`}>{LEVEL_LABEL[p.level]}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "Settings" && (
          <div className="flex flex-col gap-4">
            <Field label="Rotation Policy">
              <select
                defaultValue={secret.rotationPolicy}
                className="mt-1 h-7 w-full rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg focus:border-accent focus:outline-none"
              >
                <option value="30d">Every 30 days</option>
                <option value="60d">Every 60 days</option>
                <option value="90d">Every 90 days</option>
                <option value="on-demand">On demand</option>
                <option value="manual">Manual</option>
              </select>
            </Field>
            <label className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-[12.5px] text-fg">Auto-rotate on expiration warning</span>
              <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-blue-500" />
            </label>
            <label className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-[12.5px] text-fg">Require approval to read</span>
              <input type="checkbox" className="h-3.5 w-3.5 accent-blue-500" />
            </label>
            <div className="mt-2 rounded-md border border-danger/30 bg-danger/5 p-3">
              <p className="text-[12px] font-medium text-danger">Danger zone</p>
              <p className="mt-1 text-[11.5px] text-fg-muted">
                Deleting this secret revokes access immediately for all consumers.
              </p>
              <button className="mt-2 flex items-center gap-1.5 rounded-md border border-danger/40 px-2.5 py-1.5 text-[12px] font-medium text-danger hover:bg-danger/10">
                <Trash2 className="h-3.5 w-3.5" /> Delete secret
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
