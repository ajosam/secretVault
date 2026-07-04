export type SecretStatus = "active" | "expiring" | "expired" | "disabled";

export type RotationPolicy = "30d" | "60d" | "90d" | "manual" | "on-demand";

export type PermissionLevel = "admin" | "write" | "read" | "none";

export type ActionResult = "success" | "denied";

export interface SecretVersion {
  version: number;
  createdAt: string;
  createdBy: string;
  status: "active" | "archived";
  checksum: string;
}

export interface AccessEvent {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  result: ActionResult;
  ip: string;
}

export interface Permission {
  role: string;
  level: PermissionLevel;
}

export interface Secret {
  id: string;
  name: string;
  path: string;
  namespace: string;
  version: number;
  updatedAt: string;
  createdAt: string;
  rotationPolicy: RotationPolicy;
  nextRotation: string | null;
  status: SecretStatus;
  owner: string;
  expiresAt: string | null;
  tags: string[];
  description: string;
  versions: SecretVersion[];
  accessHistory: AccessEvent[];
  permissions: Permission[];
}

export interface Namespace {
  id: string;
  name: string;
  secretsCount: number;
  owner: string;
  createdAt: string;
  policy: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  namespace: string;
  ip: string;
  result: ActionResult;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string;
  mfaEnabled: boolean;
  status: "active" | "invited" | "suspended";
}

export interface RotationEntry {
  secret: string;
  path: string;
  namespace: string;
  policy: RotationPolicy;
  lastRotated: string;
  nextRotation: string | null;
  status: SecretStatus;
}
