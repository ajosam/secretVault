import { rotations, formatTimestamp, formatRelativeToNow } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";

const POLICY_LABEL: Record<string, string> = {
  "30d": "Every 30 days",
  "60d": "Every 60 days",
  "90d": "Every 90 days",
  manual: "Manual",
  "on-demand": "On demand",
};

export default function RotationsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-[14px] font-semibold text-fg">Rotations</h1>
          <p className="mt-0.5 text-[12px] text-fg-muted">Upcoming and historical rotation schedule for all secrets.</p>
        </div>
        <button className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] font-medium text-fg hover:bg-surface-hover">
          Configure default policy
        </button>
      </div>

      <table className="w-full min-w-[820px] border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-fg-subtle">
            <th className="px-6 py-2 font-medium">Secret</th>
            <th className="px-3 py-2 font-medium">Namespace</th>
            <th className="px-3 py-2 font-medium">Policy</th>
            <th className="px-3 py-2 font-medium">Last Rotated</th>
            <th className="px-3 py-2 font-medium">Next Rotation</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rotations.map((r) => (
            <tr key={r.path} className="border-b border-border-muted hover:bg-surface-hover">
              <td className="px-6 py-2.5">
                <div className="flex flex-col">
                  <span className="font-medium text-fg">{r.secret}</span>
                  <span className="font-mono text-[11px] text-fg-subtle">{r.path}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-fg-muted">{r.namespace}</td>
              <td className="px-3 py-2.5 text-fg-muted">{POLICY_LABEL[r.policy]}</td>
              <td className="px-3 py-2.5 tabular text-fg-muted">{formatTimestamp(r.lastRotated)}</td>
              <td className="px-3 py-2.5 tabular text-fg-muted">
                {r.nextRotation ? (
                  <span>
                    {formatTimestamp(r.nextRotation)}{" "}
                    <span className="text-fg-subtle">({formatRelativeToNow(r.nextRotation)})</span>
                  </span>
                ) : (
                  <span className="text-fg-subtle">—</span>
                )}
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
