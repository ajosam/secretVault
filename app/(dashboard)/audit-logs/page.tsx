"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download } from "lucide-react";
import { formatTimestamp } from "@/lib/format";
import type { ActionResult, AuditLogEntry, Namespace } from "@/lib/types";
import { ResultBadge } from "@/components/StatusBadge";

export default function AuditLogsPage() {
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [namespaceFilter, setNamespaceFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState<ActionResult | "all">("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/audit-logs").then((res) => res.json()),
      fetch("/api/namespaces").then((res) => res.json()),
    ])
      .then(([auditRes, namespacesRes]) => {
        setAuditLog(auditRes.data ?? []);
        setNamespaces(namespacesRes.data ?? []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const ACTIONS = useMemo(() => Array.from(new Set(auditLog.map((e) => e.action))).sort(), [auditLog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return auditLog.filter((e) => {
      if (namespaceFilter !== "all" && e.namespace !== namespaceFilter) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (resultFilter !== "all" && e.result !== resultFilter) return false;
      if (
        q &&
        !e.actor.toLowerCase().includes(q) &&
        !e.resource.toLowerCase().includes(q) &&
        !e.ip.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [auditLog, query, namespaceFilter, actionFilter, resultFilter]);

  function handleExport() {
    const header = ["Timestamp", "Actor", "Action", "Resource", "Namespace", "IP", "Result"];
    const rows = filtered.map((e) => [
      formatTimestamp(e.timestamp),
      e.actor,
      e.action,
      e.resource,
      e.namespace,
      e.ip,
      e.result,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Filter by actor, resource, IP…"
            className="h-7 w-full rounded-md border border-border bg-surface-2 pl-8 pr-2 text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
        </div>

        <select
          value={namespaceFilter}
          onChange={(e) => setNamespaceFilter(e.target.value)}
          className="h-7 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg-muted focus:border-accent focus:outline-none"
        >
          <option value="all">All namespaces</option>
          {namespaces.map((ns) => (
            <option key={ns.id} value={ns.name}>
              {ns.name}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-7 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg-muted focus:border-accent focus:outline-none"
        >
          <option value="all">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value as ActionResult | "all")}
          className="h-7 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg-muted focus:border-accent focus:outline-none"
        >
          <option value="all">All results</option>
          <option value="success">Success</option>
          <option value="denied">Denied</option>
        </select>

        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="ml-auto flex h-7 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] text-fg-muted hover:bg-surface-hover disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-[12.5px]">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-fg-subtle">
              <th className="px-4 py-2 font-medium">Timestamp</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Resource</th>
              <th className="px-3 py-2 font-medium">Namespace</th>
              <th className="px-3 py-2 font-medium">IP</th>
              <th className="px-3 py-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-b border-border-muted hover:bg-surface-hover">
                <td className="px-4 py-2 tabular text-fg-muted">{formatTimestamp(entry.timestamp)}</td>
                <td className="px-3 py-2 font-mono text-fg">{entry.actor}</td>
                <td className="px-3 py-2 font-mono text-fg-muted">{entry.action}</td>
                <td className="px-3 py-2 font-mono text-fg-muted">{entry.resource}</td>
                <td className="px-3 py-2 text-fg-muted">{entry.namespace}</td>
                <td className="px-3 py-2 font-mono tabular text-fg-subtle">{entry.ip}</td>
                <td className="px-3 py-2">
                  <ResultBadge result={entry.result} />
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-fg-subtle">
                  No audit events match the current filters.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-fg-subtle">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11.5px] text-fg-subtle">
        <span>{filtered.length} of {auditLog.length} events</span>
        <span>Showing most recent 200 events</span>
      </div>
    </div>
  );
}
