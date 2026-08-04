import { prisma } from "@/lib/prisma";
import type { AccessEvent, Secret } from "@/lib/types";

type SecretWithRelations = {
  id: string;
  name: string;
  path: string;
  namespace: { name: string };
  description: string;
  tags: string[];
  status: string;
  rotationPolicy: string;
  nextRotation: Date | null;
  expiresAt: Date | null;
  owner: { fullName: string } | null;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
  versions: { version: number; createdAt: Date; createdBy: { fullName: string }; status: string; checksum: string }[];
};

export function serializeSecret(secret: SecretWithRelations, accessHistory: AccessEvent[] = []): Secret {
  return {
    id: secret.id,
    name: secret.name,
    path: secret.path,
    namespace: secret.namespace.name,
    version: secret.currentVersion,
    updatedAt: secret.updatedAt.toISOString(),
    createdAt: secret.createdAt.toISOString(),
    rotationPolicy: secret.rotationPolicy as Secret["rotationPolicy"],
    nextRotation: secret.nextRotation ? secret.nextRotation.toISOString() : null,
    status: secret.status as Secret["status"],
    owner: secret.owner?.fullName ?? "",
    expiresAt: secret.expiresAt ? secret.expiresAt.toISOString() : null,
    tags: secret.tags,
    description: secret.description,
    versions: secret.versions
      .sort((a, b) => b.version - a.version)
      .map((v) => ({
        version: v.version,
        createdAt: v.createdAt.toISOString(),
        createdBy: v.createdBy.fullName,
        status: v.status as "active" | "archived",
        checksum: v.checksum,
      })),
    accessHistory,
    permissions: [],
  };
}

export async function fetchAccessHistory(organizationId: string, secretId: string): Promise<AccessEvent[]> {
  const entries = await prisma.auditLog.findMany({
    where: { organizationId, resourceType: "secret", resourceId: secretId },
    orderBy: { createdAt: "desc" },
  });

  return entries.map((entry) => ({
    id: entry.id,
    actor: entry.actorLabel,
    action: entry.action,
    timestamp: entry.createdAt.toISOString(),
    result: entry.result as AccessEvent["result"],
    ip: entry.ip,
  }));
}

export const SECRET_INCLUDE = {
  namespace: true,
  owner: true,
  versions: { include: { createdBy: true } },
} as const;
