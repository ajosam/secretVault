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

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <h1 className="mb-4 text-[14px] font-semibold text-fg">Settings</h1>

      <div className="flex max-w-2xl flex-col gap-5">
        <Section title="Organization">
          <Row label="Organization name" description="Displayed across the dashboard and audit exports.">
            <input
              defaultValue="propcrm"
              className="h-7 w-48 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg focus:border-accent focus:outline-none"
            />
          </Row>
          <Row label="Default namespace" description="Used when a new secret is created without one specified.">
            <select className="h-7 w-48 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg-muted focus:border-accent focus:outline-none">
              <option>production</option>
              <option>staging</option>
              <option>development</option>
            </select>
          </Row>
        </Section>

        <Section title="Security">
          <Row label="Require MFA for all users" description="Enforce multi-factor authentication org-wide.">
            <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-blue-500" />
          </Row>
          <Row label="Session timeout" description="Automatically sign out idle sessions.">
            <select className="h-7 w-36 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg-muted focus:border-accent focus:outline-none">
              <option>15 minutes</option>
              <option>1 hour</option>
              <option>8 hours</option>
            </select>
          </Row>
          <Row label="IP allowlist" description="Restrict API and console access to specific IP ranges.">
            <input type="checkbox" className="h-3.5 w-3.5 accent-blue-500" />
          </Row>
        </Section>

        <Section title="Rotation defaults">
          <Row label="Default rotation policy" description="Applied to new secrets unless overridden.">
            <select className="h-7 w-40 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg-muted focus:border-accent focus:outline-none">
              <option>Every 90 days</option>
              <option>Every 60 days</option>
              <option>Every 30 days</option>
              <option>Manual</option>
            </select>
          </Row>
          <Row label="Warn before expiration" description="Flag secrets as expiring this many days in advance.">
            <input
              type="number"
              defaultValue={14}
              className="h-7 w-20 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] text-fg focus:border-accent focus:outline-none"
            />
          </Row>
        </Section>

        <section className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <h2 className="text-[12.5px] font-semibold text-danger">Danger zone</h2>
          <p className="mt-1 text-[11.5px] text-fg-muted">
            Deleting this organization permanently removes all secrets, audit logs, and access policies.
          </p>
          <button className="mt-3 rounded-md border border-danger/40 px-2.5 py-1.5 text-[12px] font-medium text-danger hover:bg-danger/10">
            Delete organization
          </button>
        </section>
      </div>
    </div>
  );
}
