"use client";

import type { Secret } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { formatTimestamp } from "@/lib/format";

const POLICY_LABEL: Record<Secret["rotationPolicy"], string> = {
  "30d": "Every 30 days",
  "60d": "Every 60 days",
  "90d": "Every 90 days",
  manual: "Manual",
  "on-demand": "On demand",
};

export function SecretsTable({
  secrets,
  selectedId,
  onSelect,
}: {
  secrets: Secret[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[820px] border-collapse text-left text-[12.5px]">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-fg-subtle">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Namespace</th>
            <th className="px-3 py-2 font-medium">Version</th>
            <th className="px-3 py-2 font-medium">Last Updated</th>
            <th className="px-3 py-2 font-medium">Rotation Policy</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {secrets.map((s) => {
            const selected = s.id === selectedId;
            return (
              <tr
                key={s.id}
                tabIndex={0}
                onClick={() => onSelect(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSelect(s.id);
                }}
                aria-selected={selected}
                className={`cursor-pointer border-b border-border-muted transition-colors ${
                  selected ? "bg-accent/10" : "hover:bg-surface-hover"
                }`}
              >
                <td className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-fg">{s.name}</span>
                    <span className="font-mono text-[11px] text-fg-subtle">{s.path}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-fg-muted">{s.namespace}</td>
                <td className="px-3 py-2 font-mono tabular text-fg-muted">v{s.version}</td>
                <td className="px-3 py-2 tabular text-fg-muted">{formatTimestamp(s.updatedAt)}</td>
                <td className="px-3 py-2 text-fg-muted">{POLICY_LABEL[s.rotationPolicy]}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            );
          })}
          {secrets.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-fg-subtle">
                No secrets match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
