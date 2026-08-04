"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border-muted py-3.5 last:border-0">
      <div>
        <p className="text-[12.5px] font-medium text-fg">{label}</p>
        <p className="mt-0.5 text-[11.5px] text-fg-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border">
      <div className="border-b border-border px-4 py-2.5">
        <h2 className="text-[12.5px] font-semibold text-fg">{title}</h2>
      </div>
      <div className="px-4">{children}</div>
    </section>
  );
}

interface OrgSettings {
  name: string;
  defaultRotationPolicy: string | null;
  warnBeforeExpirationDays: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [name, setName] = useState("");
  const [defaultRotationPolicy, setDefaultRotationPolicy] = useState("manual");
  const [warnDays, setWarnDays] = useState(14);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/organization")
      .then((res) => res.json())
      .then(({ data }: { data: OrgSettings }) => {
        setSettings(data);
        setName(data.name);
        setDefaultRotationPolicy(data.defaultRotationPolicy ?? "manual");
        setWarnDays(data.warnBeforeExpirationDays);
      });
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    const res = await fetch("/api/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        defaultRotationPolicy,
        warnBeforeExpirationDays: warnDays,
      }),
    });

    setIsSaving(false);

    if (!res.ok) {
      const { error } = await res.json();
      setSaveError(error?.message ?? "Something went wrong. Please try again.");
      return;
    }

    const { data } = await res.json();
    setSettings(data);
    setSaveMessage("Saved.");
    setTimeout(() => setSaveMessage(null), 2000);
  }

  async function handleDeleteOrganization() {
    if (!settings || confirmName !== settings.name) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await fetch("/api/organization", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmName }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      setDeleteError(error?.message ?? "Something went wrong. Please try again.");
      setIsDeleting(false);
      return;
    }

    router.push("/login");
  }

  if (!settings) {
    return <div className="h-full overflow-y-auto px-6 py-5 text-[12.5px] text-fg-subtle">Loading…</div>;
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <h1 className="mb-4 text-[14px] font-semibold text-fg">Settings</h1>

      <div className="flex max-w-2xl flex-col gap-5">
        <Section title="Organization">
          <Row label="Organization name" description="Displayed across the dashboard and audit exports.">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 w-48 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg focus:border-accent focus:outline-none"
            />
          </Row>
        </Section>

        <Section title="Security">
          <Row label="Require MFA for all users" description="Enforce multi-factor authentication org-wide. Not implemented yet.">
            <input type="checkbox" disabled className="h-3.5 w-3.5 accent-blue-500" />
          </Row>
          <Row label="Session timeout" description="Automatically sign out idle sessions. Not implemented yet.">
            <select disabled className="h-7 w-36 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg-subtle">
              <option>1 day</option>
            </select>
          </Row>
          <Row label="IP allowlist" description="Restrict API and console access to specific IP ranges. Not implemented yet.">
            <input type="checkbox" disabled className="h-3.5 w-3.5 accent-blue-500" />
          </Row>
        </Section>

        <Section title="Rotation defaults">
          <Row label="Default rotation policy" description="Pre-selected when creating a new secret.">
            <select
              value={defaultRotationPolicy}
              onChange={(e) => setDefaultRotationPolicy(e.target.value)}
              className="h-7 w-40 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg-muted focus:border-accent focus:outline-none"
            >
              <option value="manual">Manual</option>
              <option value="30d">Every 30 days</option>
              <option value="60d">Every 60 days</option>
              <option value="90d">Every 90 days</option>
              <option value="on-demand">On demand</option>
            </select>
          </Row>
          <Row label="Warn before expiration" description="Flag secrets as expiring this many days in advance.">
            <input
              type="number"
              value={warnDays}
              onChange={(e) => setWarnDays(Number(e.target.value))}
              min={1}
              max={365}
              className="h-7 w-20 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg focus:border-accent focus:outline-none"
            />
          </Row>
        </Section>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-medium text-accent-fg hover:bg-accent/90 disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </button>
          {saveMessage && <span className="text-[12px] text-success">{saveMessage}</span>}
          {saveError && <span className="text-[12px] text-danger">{saveError}</span>}
        </div>

        <section className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <h2 className="text-[12.5px] font-semibold text-danger">Danger zone</h2>
          <p className="mt-1 text-[11.5px] text-fg-muted">
            Deleting this organization permanently removes every namespace, secret, user, and audit log. This cannot
            be undone.
          </p>
          <p className="mt-3 text-[11.5px] text-fg-muted">
            Type <span className="font-mono text-fg">{settings.name}</span> to confirm.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={settings.name}
              className="h-7 w-56 rounded-md border border-border bg-surface-2 px-2 font-mono text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-danger focus:outline-none"
            />
            <button
              onClick={handleDeleteOrganization}
              disabled={confirmName !== settings.name || isDeleting}
              className="flex items-center gap-1.5 rounded-md border border-danger/40 px-2.5 py-1.5 text-[12px] font-medium text-danger hover:bg-danger/10 disabled:opacity-40"
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete organization
            </button>
          </div>
          {deleteError && <p className="mt-2 text-[11.5px] text-danger">{deleteError}</p>}
        </section>
      </div>
    </div>
  );
}
