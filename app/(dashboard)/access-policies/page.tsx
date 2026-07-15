import type { PermissionLevel } from "@/lib/types";
import { PermissionMatrix } from "@/components/PermissionMatrix";

const namespaces: { id: string; name: string }[] = [];
const ROLE_NAMES = ["Super Admin", "Admin", "DevOps", "Developer", "Auditor"] as const;
const policyMatrix: Record<string, Record<string, PermissionLevel>> = Object.fromEntries(
  ROLE_NAMES.map((role) => [role, {}]),
);

export default function AccessPoliciesPage() {
  const columns = namespaces.map((ns) => ns.name);

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[14px] font-semibold text-fg">Access Policies</h1>
          <p className="mt-0.5 text-[12px] text-fg-muted">
            Role-based permission matrix across namespaces. Click a cell to change its access level.
          </p>
        </div>
        <button className="flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-[12.5px] font-medium text-accent-fg hover:bg-accent/90">
          New role
        </button>
      </div>

      <PermissionMatrix roles={ROLE_NAMES} columns={columns} initial={policyMatrix} />

      <div className="mt-5 flex items-center gap-4 text-[11.5px] text-fg-subtle">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-accent/40" /> Admin — full read/write/delete
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-success/40" /> Write — read/update secrets
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-fg-muted/40" /> Read — view secret values
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-surface-2 border border-border" /> None — no access
        </span>
      </div>
    </div>
  );
}
