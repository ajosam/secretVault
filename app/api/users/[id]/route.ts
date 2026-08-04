import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { updateUserSchema } from "@/lib/user-schemas";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const target = await prisma.user.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!target) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found." } }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    },
  });

  await logAudit({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    actorLabel: session.user.email,
    action: parsed.data.status ? `user.${parsed.data.status}` : "user.role_change",
    resourceType: "user",
    resourceId: id,
    resourceLabel: updated.email,
    ip: getClientIp(request),
    result: "success",
  });

  return NextResponse.json(
    {
      data: {
        id: updated.id,
        name: updated.fullName,
        email: updated.email,
        role: updated.role,
        lastActive: updated.lastActiveAt ? updated.lastActiveAt.toISOString() : "—",
        mfaEnabled: updated.mfaEnabled,
        status: updated.status,
      },
    },
    { status: 200 },
  );
}
