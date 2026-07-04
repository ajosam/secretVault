import type { SecretStatus, ActionResult } from "@/lib/types";

const STATUS_STYLES: Record<SecretStatus, string> = {
  active: "bg-success/10 text-success border-success/25",
  expiring: "bg-warning/10 text-warning border-warning/25",
  expired: "bg-danger/10 text-danger border-danger/25",
  disabled: "bg-fg-subtle/10 text-fg-subtle border-fg-subtle/25",
};

const STATUS_LABEL: Record<SecretStatus, string> = {
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
  disabled: "Disabled",
};

export function StatusBadge({ status }: { status: SecretStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

const RESULT_STYLES: Record<ActionResult, string> = {
  success: "text-success",
  denied: "text-danger",
};

export function ResultBadge({ result }: { result: ActionResult }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${RESULT_STYLES[result]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {result === "success" ? "Success" : "Denied"}
    </span>
  );
}
