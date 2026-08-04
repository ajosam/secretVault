"use client";

import { useEffect, useState } from "react";
import type { AppUser, Namespace, PermissionLevel } from "@/lib/types";
import { PermissionMatrix } from "@/components/PermissionMatrix";
import { NamespaceAccessManager } from "@/components/NamespaceAccessManager";

const ROLE_NAMES = ["Super Admin", "Admin", "DevOps", "Developer", "Auditor"] as const;
const CATEGORIES = ["Secrets", "Namespaces", "Users", "Audit Logs"];

// Static reference — what each role can generally do. Not derived from the
// database: it describes the fixed 5-role model itself, not per-namespace state.
const CAPABILITY_MATRIX: Record<string, Record<string, PermissionLevel>> = {
  "Super Admin": { Secrets: "admin", Namespaces: "admin", Users: "admin", "Audit Logs": "admin" },
  Admin: { Secrets: "admin", Namespaces: "write", Users: "write", "Audit Logs": "read" },
  DevOps: { Secrets: "write", Namespaces: "read", Users: "none", "Audit Logs": "none" },
  Developer: { Secrets: "write", Namespaces: "read", Users: "none", "Audit Logs": "none" },
  Auditor: { Secrets: "read", Namespaces: "read", Users: "read", "Audit Logs": "admin" },
};

export default function AccessPoliciesPage() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/namespaces").then((res) => res.json()),
      fetch("/api/users").then((res) => res.json()),
    ])
      .then(([namespacesRes, usersRes]) => {
        setNamespaces(namespacesRes.data ?? []);
        setUsers(usersRes.data ?? []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mb-4">
        <h1 className="text-[14px] font-semibold text-fg">Access Policies</h1>
        <p className="mt-0.5 text-[12px] text-fg-muted">
          What each role can generally do, and who has explicit access to each namespace.
        </p>
      </div>

      <section className="mb-6">
        <h2 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-fg-subtle">Role reference</h2>
        <PermissionMatrix roles={ROLE_NAMES} columns={CATEGORIES} matrix={CAPABILITY_MATRIX} />
        <p className="mt-2 text-[11px] text-fg-subtle">
          Fixed by role, not editable here — Auditor can see everything (including full audit history) but can
          never decrypt a secret&apos;s value.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-fg-subtle">Namespace access</h2>
        {isLoading ? (
          <div className="rounded-lg border border-border px-4 py-8 text-center text-[12.5px] text-fg-subtle">
            Loading…
          </div>
        ) : (
          <NamespaceAccessManager namespaces={namespaces} users={users} />
        )}
      </section>
    </div>
  );
}
