import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit, getClientIp } from "@/lib/audit";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const { id, userId } = await params;
  const namespace = await prisma.namespace.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!namespace) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Namespace not found." } }, { status: 404 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });

  await prisma.userNamespaceRole.deleteMany({ where: { namespaceId: id, userId } });

  await logAudit({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    actorLabel: session.user.email,
    action: "namespace_role.revoke",
    resourceType: "namespace_role",
    resourceId: null,
    resourceLabel: `${target?.email ?? userId} removed from ${namespace.name}`,
    namespaceId: id,
    ip: getClientIp(request),
    result: "success",
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
