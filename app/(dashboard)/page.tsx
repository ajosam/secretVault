"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { secrets, namespaces } from "@/lib/data";
import type { SecretStatus } from "@/lib/types";
import { SecretsTable } from "@/components/SecretsTable";
import { DetailsPanel } from "@/components/DetailsPanel";

const STATUS_OPTIONS: Array<{ value: SecretStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring" },
  { value: "expired", label: "Expired" },
  { value: "disabled", label: "Disabled" },
];

export default function SecretsPage() {
  const [query, setQuery] = useState("");
  const [namespaceFilter, setNamespaceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<SecretStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(secrets[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return secrets.filter((s) => {
      if (namespaceFilter !== "all" && s.namespace !== namespaceFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.path.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, namespaceFilter, statusFilter]);

  const selected = filtered.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Filter by name or path…"
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SecretStatus | "all")}
            className="h-7 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg-muted focus:border-accent focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] text-fg-muted hover:bg-surface-hover">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            More filters
          </button>

          <span className="ml-auto text-[11.5px] text-fg-subtle">
            {filtered.length} of {secrets.length} secrets
          </span>
        </div>

        <SecretsTable secrets={filtered} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <DetailsPanel secret={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
