"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { formatTimestamp, formatRelativeToNow } from "@/lib/format";
import type { Secret } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { RotateSecretDialog } from "@/components/RotateSecretDialog";

const POLICY_LABEL: Record<string, string> = {
  "30d": "Every 30 days",
  "60d": "Every 60 days",
  "90d": "Every 90 days",
  manual: "Manual",
  "on-demand": "On demand",
};

export default function RotationsPage() {
  const router = useRouter();
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rotating, setRotating] = useState<Secret | null>(null);

  useEffect(() => {
    fetch("/api/secrets")
      .then((res) => res.json())
      .then(({ data }: { data: Secret[] }) => setSecrets(data))
      .finally(() => setIsLoading(false));
  }, []);

  function handleRotated(updated: Secret) {
    setSecrets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-[14px] font-semibold text-fg">Rotations</h1>
          <p className="mt-0.5 text-[12px] text-fg-muted">Upcoming and historical rotation schedule for all secrets.</p>
        </div>
        <button
          onClick={() => router.push("/settings")}
          className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] font-medium text-fg hover:bg-surface-hover"
        >
          Configure default policy
        </button>
      </div>

      <table className="w-full min-w-[860px] border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-fg-subtle">
            <th className="px-6 py-2 font-medium">Secret</th>
            <th className="px-3 py-2 font-medium">Namespace</th>
            <th className="px-3 py-2 font-medium">Policy</th>
            <th className="px-3 py-2 font-medium">Last Rotated</th>
            <th className="px-3 py-2 font-medium">Next Rotation</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {secrets.map((s) => (
            <tr key={s.id} className="border-b border-border-muted hover:bg-surface-hover">
              <td className="px-6 py-2.5">
                <div className="flex flex-col">
                  <span className="font-medium text-fg">{s.name}</span>
                  <span className="font-mono text-[11px] text-fg-subtle">{s.path}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-fg-muted">{s.namespace}</td>
              <td className="px-3 py-2.5 text-fg-muted">{POLICY_LABEL[s.rotationPolicy]}</td>
              <td className="px-3 py-2.5 tabular text-fg-muted">{formatTimestamp(s.updatedAt)}</td>
              <td className="px-3 py-2.5 tabular text-fg-muted">
                {s.nextRotation ? (
                  <span>
                    {formatTimestamp(s.nextRotation)}{" "}
                    <span className="text-fg-subtle">({formatRelativeToNow(s.nextRotation)})</span>
                  </span>
                ) : (
                  <span className="text-fg-subtle">—</span>
                )}
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge status={s.status} />
              </td>
              <td className="px-3 py-2.5 text-right">
                <button
                  onClick={() => setRotating(s)}
                  className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11.5px] font-medium text-fg-muted hover:bg-surface-hover hover:text-fg"
                >
                  <RotateCw className="h-3 w-3" />
                  Rotate
                </button>
              </td>
            </tr>
          ))}
          {!isLoading && secrets.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-10 text-center text-fg-subtle">
                No rotation schedules yet.
              </td>
            </tr>
          )}
          {isLoading && (
            <tr>
              <td colSpan={7} className="px-6 py-10 text-center text-fg-subtle">
                Loading…
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <RotateSecretDialog secret={rotating} onClose={() => setRotating(null)} onRotated={handleRotated} />
    </div>
  );
}
