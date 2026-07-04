"use client";

import { useState } from "react";
import type { PermissionLevel } from "@/lib/types";

const LEVELS: PermissionLevel[] = ["none", "read", "write", "admin"];

const LEVEL_STYLES: Record<PermissionLevel, string> = {
  none: "bg-surface-2 text-fg-subtle border-border",
  read: "bg-fg-muted/10 text-fg-muted border-fg-muted/20",
  write: "bg-success/10 text-success border-success/25",
  admin: "bg-accent/10 text-accent border-accent/25",
};

const LEVEL_LABEL: Record<PermissionLevel, string> = {
  none: "None",
  read: "Read",
  write: "Write",
  admin: "Admin",
};

export function PermissionMatrix({
  roles,
  columns,
  initial,
}: {
  roles: readonly string[];
  columns: string[];
  initial: Record<string, Record<string, PermissionLevel>>;
}) {
  const [matrix, setMatrix] = useState(initial);

  function cycle(role: string, col: string) {
    setMatrix((prev) => {
      const current = prev[role][col];
      const next = LEVELS[(LEVELS.indexOf(current) + 1) % LEVELS.length];
      return { ...prev, [role]: { ...prev[role], [col]: next } };
    });
  }

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="w-40 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
              Role
            </th>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2.5 text-center font-mono text-[11.5px] font-medium text-fg-muted">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role} className="border-b border-border-muted last:border-0">
              <td className="px-4 py-2 font-medium text-fg">{role}</td>
              {columns.map((col) => {
                const level = matrix[role][col];
                return (
                  <td key={col} className="px-2 py-1.5 text-center">
                    <button
                      onClick={() => cycle(role, col)}
                      className={`w-full rounded-md border px-2 py-1 text-[11.5px] font-medium transition-colors hover:brightness-125 ${LEVEL_STYLES[level]}`}
                    >
                      {LEVEL_LABEL[level]}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
