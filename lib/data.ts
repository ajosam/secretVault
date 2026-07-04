import type {
  AccessEvent,
  AppUser,
  AuditLogEntry,
  Namespace,
  Permission,
  RotationEntry,
  Secret,
  SecretVersion,
} from "./types";

const ROLES = ["Admin", "Operator", "Developer", "Read Only", "Auditor"];

function permissions(overrides: Partial<Record<string, Permission["level"]>>): Permission[] {
  return ROLES.map((role) => ({
    role,
    level: overrides[role] ?? "none",
  }));
}

function versions(count: number, base: string, author: string): SecretVersion[] {
  return Array.from({ length: count }, (_, i) => {
    const v = count - i;
    return {
      version: v,
      createdAt: base,
      createdBy: v === count ? author : "system-rotation",
      status: v === count ? "active" : "archived",
      checksum: `sha256:${(v * 913 + 4211).toString(16).padStart(8, "0")}…`,
    } as SecretVersion;
  });
}

function accessHistory(entries: Array<[string, string, string, "success" | "denied", string]>): AccessEvent[] {
  return entries.map(([actor, action, timestamp, result, ip], i) => ({
    id: `evt-${i}`,
    actor,
    action,
    timestamp,
    result,
    ip,
  }));
}

export const secrets: Secret[] = [
  {
    id: "sec_01",
    name: "stripe-api-key",
    path: "/production/billing/stripe-api-key",
    namespace: "production",
    version: 4,
    updatedAt: "2026-07-02T14:12:00Z",
    createdAt: "2025-11-03T09:00:00Z",
    rotationPolicy: "30d",
    nextRotation: "2026-07-16T00:00:00Z",
    status: "active",
    owner: "ajo@propcrm.com",
    expiresAt: null,
    tags: ["payments", "pci", "critical"],
    description: "Live Stripe secret key used by the billing service to process charges and manage subscriptions.",
    versions: versions(4, "2026-06-16T09:12:00Z", "ajo@propcrm.com"),
    accessHistory: accessHistory([
      ["billing-service", "secret.read", "2026-07-03T08:41:00Z", "success", "10.4.2.11"],
      ["ajo@propcrm.com", "secret.rotate", "2026-06-16T09:12:00Z", "success", "203.0.113.4"],
      ["ci-runner-14", "secret.read", "2026-06-15T22:03:00Z", "success", "10.4.0.90"],
      ["unknown-svc", "secret.read", "2026-06-14T03:11:00Z", "denied", "198.51.100.23"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "write", Developer: "read", Auditor: "read" }),
  },
  {
    id: "sec_02",
    name: "postgres-primary-password",
    path: "/production/database/postgres-primary-password",
    namespace: "production",
    version: 12,
    updatedAt: "2026-06-30T02:00:00Z",
    createdAt: "2024-02-11T00:00:00Z",
    rotationPolicy: "90d",
    nextRotation: "2026-09-28T00:00:00Z",
    status: "active",
    owner: "sre-team",
    expiresAt: null,
    tags: ["database", "critical"],
    description: "Superuser credential for the primary Postgres cluster. Rotated quarterly via automated job.",
    versions: versions(6, "2026-06-30T02:00:00Z", "system-rotation"),
    accessHistory: accessHistory([
      ["api-gateway", "secret.read", "2026-07-03T07:00:00Z", "success", "10.4.2.4"],
      ["migration-job", "secret.read", "2026-06-30T02:01:00Z", "success", "10.4.0.5"],
      ["system-rotation", "secret.rotate", "2026-06-30T02:00:00Z", "success", "internal"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "admin", Developer: "none", Auditor: "read" }),
  },
  {
    id: "sec_03",
    name: "sendgrid-api-key",
    path: "/production/notifications/sendgrid-api-key",
    namespace: "production",
    version: 2,
    updatedAt: "2026-05-20T11:30:00Z",
    createdAt: "2025-08-01T00:00:00Z",
    rotationPolicy: "manual",
    nextRotation: null,
    status: "expiring",
    owner: "growth-team",
    expiresAt: "2026-07-10T00:00:00Z",
    tags: ["email", "third-party"],
    description: "Transactional email provider key. Manual rotation — no automated schedule configured.",
    versions: versions(2, "2026-05-20T11:30:00Z", "growth-team"),
    accessHistory: accessHistory([
      ["notification-worker", "secret.read", "2026-07-02T18:22:00Z", "success", "10.4.3.8"],
      ["growth-team", "secret.update", "2026-05-20T11:30:00Z", "success", "203.0.113.9"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "write", Developer: "read" }),
  },
  {
    id: "sec_04",
    name: "jwt-signing-secret",
    path: "/production/auth/jwt-signing-secret",
    namespace: "production",
    version: 8,
    updatedAt: "2026-06-25T00:00:00Z",
    createdAt: "2024-06-01T00:00:00Z",
    rotationPolicy: "60d",
    nextRotation: "2026-08-24T00:00:00Z",
    status: "active",
    owner: "sre-team",
    expiresAt: null,
    tags: ["auth", "critical"],
    description: "HMAC signing secret for issuing and verifying session JWTs across all edge services.",
    versions: versions(5, "2026-06-25T00:00:00Z", "system-rotation"),
    accessHistory: accessHistory([
      ["edge-auth", "secret.read", "2026-07-03T09:02:00Z", "success", "10.4.1.2"],
      ["edge-auth", "secret.read", "2026-07-03T08:02:00Z", "success", "10.4.1.2"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "write", Auditor: "read" }),
  },
  {
    id: "sec_05",
    name: "s3-backup-credentials",
    path: "/shared-infra/storage/s3-backup-credentials",
    namespace: "shared-infra",
    version: 3,
    updatedAt: "2026-04-11T00:00:00Z",
    createdAt: "2024-01-15T00:00:00Z",
    rotationPolicy: "90d",
    nextRotation: "2026-07-10T00:00:00Z",
    status: "expiring",
    owner: "sre-team",
    expiresAt: null,
    tags: ["storage", "backup"],
    description: "IAM access key pair for the nightly backup pipeline writing to the cold-storage bucket.",
    versions: versions(3, "2026-04-11T00:00:00Z", "system-rotation"),
    accessHistory: accessHistory([
      ["backup-cron", "secret.read", "2026-07-03T01:00:00Z", "success", "10.4.5.6"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "write" }),
  },
  {
    id: "sec_06",
    name: "datadog-api-key",
    path: "/shared-infra/observability/datadog-api-key",
    namespace: "shared-infra",
    version: 1,
    updatedAt: "2026-01-09T00:00:00Z",
    createdAt: "2026-01-09T00:00:00Z",
    rotationPolicy: "manual",
    nextRotation: null,
    status: "active",
    owner: "sre-team",
    expiresAt: null,
    tags: ["observability", "third-party"],
    description: "Ingest key for shipping metrics and logs to Datadog from all production clusters.",
    versions: versions(1, "2026-01-09T00:00:00Z", "sre-team"),
    accessHistory: accessHistory([
      ["metrics-agent", "secret.read", "2026-07-03T08:00:00Z", "success", "10.4.6.1"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "read", Developer: "read", Auditor: "read" }),
  },
  {
    id: "sec_07",
    name: "github-actions-deploy-token",
    path: "/ci-cd/pipelines/github-actions-deploy-token",
    namespace: "ci-cd",
    version: 6,
    updatedAt: "2026-06-29T00:00:00Z",
    createdAt: "2024-09-01T00:00:00Z",
    rotationPolicy: "30d",
    nextRotation: "2026-07-29T00:00:00Z",
    status: "active",
    owner: "platform-team",
    expiresAt: null,
    tags: ["ci-cd", "deploy"],
    description: "Fine-grained PAT used by GitHub Actions to push release artifacts and trigger deployments.",
    versions: versions(6, "2026-06-29T00:00:00Z", "system-rotation"),
    accessHistory: accessHistory([
      ["gh-actions-runner", "secret.read", "2026-07-03T06:14:00Z", "success", "20.205.243.0"],
      ["gh-actions-runner", "secret.read", "2026-07-02T18:00:00Z", "success", "20.205.243.0"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "write", Developer: "read" }),
  },
  {
    id: "sec_08",
    name: "npm-publish-token",
    path: "/ci-cd/pipelines/npm-publish-token",
    namespace: "ci-cd",
    version: 2,
    updatedAt: "2026-03-02T00:00:00Z",
    createdAt: "2025-03-02T00:00:00Z",
    rotationPolicy: "on-demand",
    nextRotation: null,
    status: "active",
    owner: "platform-team",
    expiresAt: null,
    tags: ["ci-cd", "package-registry"],
    description: "Automation token scoped to publish internal packages to the private npm registry.",
    versions: versions(2, "2026-03-02T00:00:00Z", "platform-team"),
    accessHistory: accessHistory([
      ["gh-actions-runner", "secret.read", "2026-06-28T10:00:00Z", "success", "20.205.243.0"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "write" }),
  },
  {
    id: "sec_09",
    name: "staging-postgres-password",
    path: "/staging/database/staging-postgres-password",
    namespace: "staging",
    version: 5,
    updatedAt: "2026-06-01T00:00:00Z",
    createdAt: "2024-05-01T00:00:00Z",
    rotationPolicy: "90d",
    nextRotation: "2026-08-30T00:00:00Z",
    status: "active",
    owner: "sre-team",
    expiresAt: null,
    tags: ["database"],
    description: "Superuser credential for the staging Postgres instance, mirrors production rotation policy.",
    versions: versions(5, "2026-06-01T00:00:00Z", "system-rotation"),
    accessHistory: accessHistory([
      ["staging-api", "secret.read", "2026-07-02T12:00:00Z", "success", "10.5.2.4"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "write", Developer: "write", Auditor: "read" }),
  },
  {
    id: "sec_10",
    name: "test-payment-gateway-key",
    path: "/staging/billing/test-payment-gateway-key",
    namespace: "staging",
    version: 1,
    updatedAt: "2026-02-14T00:00:00Z",
    createdAt: "2026-02-14T00:00:00Z",
    rotationPolicy: "manual",
    nextRotation: null,
    status: "disabled",
    owner: "growth-team",
    expiresAt: null,
    tags: ["payments", "sandbox"],
    description: "Sandbox key for the payment gateway test suite. Disabled after migration to mocked gateway.",
    versions: versions(1, "2026-02-14T00:00:00Z", "growth-team"),
    accessHistory: accessHistory([
      ["qa-suite", "secret.read", "2026-02-20T09:00:00Z", "denied", "10.5.0.2"],
    ]),
    permissions: permissions({ Admin: "admin" }),
  },
  {
    id: "sec_11",
    name: "local-dev-master-key",
    path: "/development/shared/local-dev-master-key",
    namespace: "development",
    version: 1,
    updatedAt: "2025-09-01T00:00:00Z",
    createdAt: "2025-09-01T00:00:00Z",
    rotationPolicy: "manual",
    nextRotation: null,
    status: "expired",
    owner: "platform-team",
    expiresAt: "2026-06-01T00:00:00Z",
    tags: ["dev-only"],
    description: "Shared symmetric key for local development environments. Expired, pending cleanup.",
    versions: versions(1, "2025-09-01T00:00:00Z", "platform-team"),
    accessHistory: accessHistory([
      ["dev-container", "secret.read", "2026-05-28T09:00:00Z", "success", "10.6.0.1"],
    ]),
    permissions: permissions({ Admin: "admin", Developer: "read" }),
  },
  {
    id: "sec_12",
    name: "slack-webhook-url",
    path: "/shared-infra/notifications/slack-webhook-url",
    namespace: "shared-infra",
    version: 2,
    updatedAt: "2026-05-05T00:00:00Z",
    createdAt: "2025-05-05T00:00:00Z",
    rotationPolicy: "manual",
    nextRotation: null,
    status: "active",
    owner: "platform-team",
    expiresAt: null,
    tags: ["alerting", "third-party"],
    description: "Incoming webhook used to post deploy and incident notifications to #eng-alerts.",
    versions: versions(2, "2026-05-05T00:00:00Z", "platform-team"),
    accessHistory: accessHistory([
      ["alert-manager", "secret.read", "2026-07-03T05:00:00Z", "success", "10.4.6.9"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "read", Developer: "read" }),
  },
  {
    id: "sec_13",
    name: "billing-webhook-signing-secret",
    path: "/production/billing/billing-webhook-signing-secret",
    namespace: "production",
    version: 3,
    updatedAt: "2026-06-18T00:00:00Z",
    createdAt: "2025-01-20T00:00:00Z",
    rotationPolicy: "60d",
    nextRotation: "2026-08-17T00:00:00Z",
    status: "active",
    owner: "ajo@propcrm.com",
    expiresAt: null,
    tags: ["payments", "webhook"],
    description: "Validates inbound Stripe webhook signatures before events are processed by the billing worker.",
    versions: versions(3, "2026-06-18T00:00:00Z", "system-rotation"),
    accessHistory: accessHistory([
      ["billing-webhook-handler", "secret.read", "2026-07-03T09:10:00Z", "success", "10.4.2.12"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "write", Auditor: "read" }),
  },
  {
    id: "sec_14",
    name: "analytics-service-account",
    path: "/production/analytics/analytics-service-account",
    namespace: "production",
    version: 2,
    updatedAt: "2026-04-22T00:00:00Z",
    createdAt: "2025-04-22T00:00:00Z",
    rotationPolicy: "90d",
    nextRotation: "2026-07-21T00:00:00Z",
    status: "active",
    owner: "data-team",
    expiresAt: null,
    tags: ["analytics", "gcp"],
    description: "Service account JSON key granting BigQuery write access to the analytics ingestion pipeline.",
    versions: versions(2, "2026-04-22T00:00:00Z", "data-team"),
    accessHistory: accessHistory([
      ["analytics-pipeline", "secret.read", "2026-07-03T04:00:00Z", "success", "10.4.7.3"],
    ]),
    permissions: permissions({ Admin: "admin", Operator: "read", Developer: "read" }),
  },
];

export const namespaces: Namespace[] = [
  { id: "ns_production", name: "production", secretsCount: 7, owner: "sre-team", createdAt: "2024-01-10T00:00:00Z", policy: "sre-admin-only" },
  { id: "ns_staging", name: "staging", secretsCount: 2, owner: "sre-team", createdAt: "2024-01-10T00:00:00Z", policy: "engineering-write" },
  { id: "ns_development", name: "development", secretsCount: 1, owner: "platform-team", createdAt: "2024-02-01T00:00:00Z", policy: "engineering-write" },
  { id: "ns_shared_infra", name: "shared-infra", secretsCount: 3, owner: "sre-team", createdAt: "2024-01-15T00:00:00Z", policy: "sre-admin-only" },
  { id: "ns_billing", name: "billing", secretsCount: 0, owner: "ajo@propcrm.com", createdAt: "2024-03-05T00:00:00Z", policy: "finance-restricted" },
  { id: "ns_ci_cd", name: "ci-cd", secretsCount: 2, owner: "platform-team", createdAt: "2024-01-20T00:00:00Z", policy: "engineering-write" },
];

export const auditLog: AuditLogEntry[] = [
  { id: "evt_1001", timestamp: "2026-07-03T09:10:00Z", actor: "billing-webhook-handler", action: "secret.read", resource: "billing-webhook-signing-secret", namespace: "production", ip: "10.4.2.12", result: "success" },
  { id: "evt_1000", timestamp: "2026-07-03T09:02:00Z", actor: "edge-auth", action: "secret.read", resource: "jwt-signing-secret", namespace: "production", ip: "10.4.1.2", result: "success" },
  { id: "evt_0999", timestamp: "2026-07-03T08:41:00Z", actor: "billing-service", action: "secret.read", resource: "stripe-api-key", namespace: "production", ip: "10.4.2.11", result: "success" },
  { id: "evt_0998", timestamp: "2026-07-03T08:00:00Z", actor: "metrics-agent", action: "secret.read", resource: "datadog-api-key", namespace: "shared-infra", ip: "10.4.6.1", result: "success" },
  { id: "evt_0997", timestamp: "2026-07-03T07:00:00Z", actor: "api-gateway", action: "secret.read", resource: "postgres-primary-password", namespace: "production", ip: "10.4.2.4", result: "success" },
  { id: "evt_0996", timestamp: "2026-07-03T06:14:00Z", actor: "gh-actions-runner", action: "secret.read", resource: "github-actions-deploy-token", namespace: "ci-cd", ip: "20.205.243.0", result: "success" },
  { id: "evt_0995", timestamp: "2026-07-03T05:00:00Z", actor: "alert-manager", action: "secret.read", resource: "slack-webhook-url", namespace: "shared-infra", ip: "10.4.6.9", result: "success" },
  { id: "evt_0994", timestamp: "2026-07-03T04:00:00Z", actor: "analytics-pipeline", action: "secret.read", resource: "analytics-service-account", namespace: "production", ip: "10.4.7.3", result: "success" },
  { id: "evt_0993", timestamp: "2026-07-03T01:00:00Z", actor: "backup-cron", action: "secret.read", resource: "s3-backup-credentials", namespace: "shared-infra", ip: "10.4.5.6", result: "success" },
  { id: "evt_0992", timestamp: "2026-07-02T18:22:00Z", actor: "notification-worker", action: "secret.read", resource: "sendgrid-api-key", namespace: "production", ip: "10.4.3.8", result: "success" },
  { id: "evt_0991", timestamp: "2026-07-02T18:00:00Z", actor: "gh-actions-runner", action: "secret.read", resource: "npm-publish-token", namespace: "ci-cd", ip: "20.205.243.0", result: "success" },
  { id: "evt_0990", timestamp: "2026-07-02T14:12:00Z", actor: "ajo@propcrm.com", action: "secret.update", resource: "stripe-api-key", namespace: "production", ip: "203.0.113.4", result: "success" },
  { id: "evt_0989", timestamp: "2026-07-02T12:00:00Z", actor: "staging-api", action: "secret.read", resource: "staging-postgres-password", namespace: "staging", ip: "10.5.2.4", result: "success" },
  { id: "evt_0988", timestamp: "2026-06-30T02:01:00Z", actor: "migration-job", action: "secret.read", resource: "postgres-primary-password", namespace: "production", ip: "10.4.0.5", result: "success" },
  { id: "evt_0987", timestamp: "2026-06-30T02:00:00Z", actor: "system-rotation", action: "secret.rotate", resource: "postgres-primary-password", namespace: "production", ip: "internal", result: "success" },
  { id: "evt_0986", timestamp: "2026-06-28T10:00:00Z", actor: "gh-actions-runner", action: "secret.read", resource: "npm-publish-token", namespace: "ci-cd", ip: "20.205.243.0", result: "success" },
  { id: "evt_0985", timestamp: "2026-06-16T09:12:00Z", actor: "ajo@propcrm.com", action: "secret.rotate", resource: "stripe-api-key", namespace: "production", ip: "203.0.113.4", result: "success" },
  { id: "evt_0984", timestamp: "2026-06-15T22:03:00Z", actor: "ci-runner-14", action: "secret.read", resource: "stripe-api-key", namespace: "production", ip: "10.4.0.90", result: "success" },
  { id: "evt_0983", timestamp: "2026-06-14T03:11:00Z", actor: "unknown-svc", action: "secret.read", resource: "stripe-api-key", namespace: "production", ip: "198.51.100.23", result: "denied" },
  { id: "evt_0982", timestamp: "2026-05-28T09:00:00Z", actor: "dev-container", action: "secret.read", resource: "local-dev-master-key", namespace: "development", ip: "10.6.0.1", result: "success" },
  { id: "evt_0981", timestamp: "2026-05-20T11:30:00Z", actor: "growth-team", action: "secret.update", resource: "sendgrid-api-key", namespace: "production", ip: "203.0.113.9", result: "success" },
  { id: "evt_0980", timestamp: "2026-02-20T09:00:00Z", actor: "qa-suite", action: "secret.read", resource: "test-payment-gateway-key", namespace: "staging", ip: "10.5.0.2", result: "denied" },
];

export const users: AppUser[] = [
  { id: "u_01", name: "Ajo Sam", email: "ajo@propcrm.com", role: "Admin", lastActive: "2026-07-03T09:10:00Z", mfaEnabled: true, status: "active" },
  { id: "u_02", name: "SRE Team (svc)", email: "sre-team@propcrm.com", role: "Operator", lastActive: "2026-07-03T07:00:00Z", mfaEnabled: true, status: "active" },
  { id: "u_03", name: "Platform Team (svc)", email: "platform-team@propcrm.com", role: "Operator", lastActive: "2026-07-03T06:14:00Z", mfaEnabled: true, status: "active" },
  { id: "u_04", name: "Growth Team (svc)", email: "growth-team@propcrm.com", role: "Developer", lastActive: "2026-07-02T18:22:00Z", mfaEnabled: false, status: "active" },
  { id: "u_05", name: "Data Team (svc)", email: "data-team@propcrm.com", role: "Developer", lastActive: "2026-07-03T04:00:00Z", mfaEnabled: true, status: "active" },
  { id: "u_06", name: "Priya Natarajan", email: "priya@propcrm.com", role: "Read Only", lastActive: "2026-06-29T15:00:00Z", mfaEnabled: true, status: "active" },
  { id: "u_07", name: "Marcus Webb", email: "marcus@propcrm.com", role: "Auditor", lastActive: "2026-06-20T10:00:00Z", mfaEnabled: true, status: "active" },
  { id: "u_08", name: "Dana Osei", email: "dana@propcrm.com", role: "Developer", lastActive: "2026-05-01T09:00:00Z", mfaEnabled: false, status: "suspended" },
  { id: "u_09", name: "Leo Petrov", email: "leo@propcrm.com", role: "Read Only", lastActive: "—", mfaEnabled: false, status: "invited" },
];

export const rotations: RotationEntry[] = secrets.map((s) => ({
  secret: s.name,
  path: s.path,
  namespace: s.namespace,
  policy: s.rotationPolicy,
  lastRotated: s.updatedAt,
  nextRotation: s.nextRotation,
  status: s.status,
}));

export const ROLE_NAMES = ["Admin", "Operator", "Developer", "Read Only", "Auditor"] as const;

export const policyMatrix: Record<string, Record<string, "admin" | "write" | "read" | "none">> = {
  Admin: { production: "admin", staging: "admin", development: "admin", "shared-infra": "admin", billing: "admin", "ci-cd": "admin" },
  Operator: { production: "write", staging: "write", development: "write", "shared-infra": "write", billing: "read", "ci-cd": "write" },
  Developer: { production: "read", staging: "write", development: "write", "shared-infra": "read", billing: "none", "ci-cd": "read" },
  "Read Only": { production: "read", staging: "read", development: "read", "shared-infra": "read", billing: "none", "ci-cd": "read" },
  Auditor: { production: "read", staging: "read", development: "read", "shared-infra": "read", billing: "read", "ci-cd": "read" },
};

export function formatTimestamp(iso: string): string {
  if (iso === "—" || iso === "internal") return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

export function formatRelativeToNow(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date("2026-07-03T09:12:00Z");
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays > 0) return `in ${diffDays}d`;
  return `${Math.abs(diffDays)}d ago`;
}
