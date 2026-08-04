"use client";

import { useEffect, useState } from "react";
import { FolderTree } from "lucide-react";
import { formatTimestamp } from "@/lib/format";
import type { Namespace } from "@/lib/types";
import { CreateNamespaceDialog } from "@/components/CreateNamespaceDialog";

export default function NamespacesPage() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetch("/api/namespaces")
      .then((res) => res.json())
      .then(({ data }: { data: Namespace[] }) => setNamespaces(data))
      .finally(() => setIsLoading(false));
  }, []);

  function handleCreate(namespace: Namespace) {
    setNamespaces((prev) => [namespace, ...prev]);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-[14px] font-semibold text-fg">Namespaces</h1>
          <p className="mt-0.5 text-[12px] text-fg-muted">Logical boundaries for isolating secrets by team or environment.</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-[12.5px] font-medium text-accent-fg hover:bg-accent/90"
        >
          New namespace
        </button>
      </div>

      <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-fg-subtle">
            <th className="px-6 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Secrets</th>
            <th className="px-3 py-2 font-medium">Owner</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 font-medium">Access Policy</th>
          </tr>
        </thead>
        <tbody>
          {namespaces.map((ns) => (
            <tr key={ns.id} className="border-b border-border-muted hover:bg-surface-hover">
              <td className="px-6 py-2.5">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
                  <span className="font-mono text-fg">{ns.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 tabular text-fg-muted">{ns.secretsCount}</td>
              <td className="px-3 py-2.5 text-fg-muted">{ns.owner}</td>
              <td className="px-3 py-2.5 tabular text-fg-muted">{formatTimestamp(ns.createdAt)}</td>
              <td className="px-3 py-2.5 font-mono text-[11.5px] text-fg-subtle">{ns.policy || "—"}</td>
            </tr>
          ))}
          {!isLoading && namespaces.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-fg-subtle">
                No namespaces yet.
              </td>
            </tr>
          )}
          {isLoading && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-fg-subtle">
                Loading…
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <CreateNamespaceDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
