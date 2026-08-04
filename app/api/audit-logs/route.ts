import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { AuditLogEntry } from "@/lib/types";

const MAX_RESULTS = 200;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const logs = await prisma.auditLog.findMany({
    where: { organizationId: session.user.organizationId },
    include: { namespace: true },
    orderBy: { createdAt: "desc" },
    take: MAX_RESULTS,
  });

  const data: AuditLogEntry[] = logs.map((log) => ({
    id: log.id,
    timestamp: log.createdAt.toISOString(),
    actor: log.actorLabel,
    action: log.action,
    resource: log.resourceLabel,
    namespace: log.namespace?.name ?? "—",
    ip: log.ip,
    result: log.result as AuditLogEntry["result"],
  }));

  return NextResponse.json({ data }, { status: 200 });
}
