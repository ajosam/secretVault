import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit, getClientIp } from "@/lib/audit";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const { id } = await params;
  const secret = await prisma.secret.findFirst({
    where: { id, organizationId: session.user.organizationId, deletedAt: null },
  });
  if (!secret) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Secret not found." } }, { status: 404 });
  }

  await prisma.secret.update({ where: { id }, data: { deletedAt: new Date() } });

  await logAudit({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    actorLabel: session.user.email,
    action: "secret.delete",
    resourceType: "secret",
    resourceId: id,
    resourceLabel: secret.name,
    namespaceId: secret.namespaceId,
    ip: getClientIp(request),
    result: "success",
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
