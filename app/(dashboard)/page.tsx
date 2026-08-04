"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import type { Secret, SecretStatus } from "@/lib/types";
import { SecretsTable } from "@/components/SecretsTable";
import { DetailsPanel } from "@/components/DetailsPanel";
import { CreateSecretDialog } from "@/components/CreateSecretDialog";

const STATUS_OPTIONS: Array<{ value: SecretStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring" },
  { value: "expired", label: "Expired" },
  { value: "disabled", label: "Disabled" },
];

export default function SecretsPage() {
  return (
    <Suspense fallback={null}>
      <SecretsPageContent />
    </Suspense>
  );
}

function SecretsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreating = searchParams.get("new") === "1";
  const query = searchParams.get("q") ?? "";

  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [namespaceFilter, setNamespaceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<SecretStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/secrets")
      .then((res) => res.json())
      .then(({ data }: { data: Secret[] }) => setSecrets(data))
      .finally(() => setIsLoading(false));
  }, []);

  const namespaces = useMemo(
    () => Array.from(new Set(secrets.map((s) => s.namespace))).map((name) => ({ id: name, name })),
    [secrets],
  );

  function closeCreate() {
    router.replace("/");
  }

  function handleCreate(secret: Secret) {
    setSecrets((prev) => [secret, ...prev]);
    setSelectedId(secret.id);
  }

  function handleRotated(updated: Secret) {
    setSecrets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function handleDeleted(id: string) {
    setSecrets((prev) => prev.filter((s) => s.id !== id));
    setSelectedId(null);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return secrets.filter((s) => {
      if (namespaceFilter !== "all" && s.namespace !== namespaceFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.path.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [secrets, query, namespaceFilter, statusFilter]);

  const selected = filtered.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">

        <SecretsTable secrets={filtered} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {isCreating ? (
        <CreateSecretDialog open={isCreating} onClose={closeCreate} onCreate={handleCreate} />
      ) : (
        <DetailsPanel
          secret={selected}
          onClose={() => setSelectedId(null)}
          onRotated={handleRotated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
