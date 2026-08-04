import { prisma } from "@/lib/prisma";

export interface LogAuditInput {
  organizationId: string;
  actorId?: string | null;
  actorLabel: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  resourceLabel: string;
  namespaceId?: string | null;
  ip: string;
  result: "success" | "denied";
}

export async function logAudit(input: LogAuditInput) {
  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      actorLabel: input.actorLabel,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      resourceLabel: input.resourceLabel,
      namespaceId: input.namespaceId ?? null,
      ip: input.ip,
      result: input.result,
    },
  });
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
