import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, destroySession } from "@/lib/session";
import { updateOrganizationSchema, deleteOrganizationSchema } from "@/lib/settings-schemas";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });
  if (!org) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Organization not found." } }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      name: org.name,
      defaultRotationPolicy: org.defaultRotationPolicy,
      warnBeforeExpirationDays: org.warnBeforeExpirationDays,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateOrganizationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  if (parsed.data.name) {
    const existing = await prisma.organization.findUnique({ where: { name: parsed.data.name } });
    if (existing && existing.id !== session.user.organizationId) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "That organization name is already taken." } },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.defaultRotationPolicy !== undefined
        ? { defaultRotationPolicy: parsed.data.defaultRotationPolicy }
        : {}),
      ...(parsed.data.warnBeforeExpirationDays !== undefined
        ? { warnBeforeExpirationDays: parsed.data.warnBeforeExpirationDays }
        : {}),
    },
  });

  await logAudit({
    organizationId: updated.id,
    actorId: session.user.id,
    actorLabel: session.user.email,
    action: "organization.update",
    resourceType: "organization",
    resourceId: updated.id,
    resourceLabel: updated.name,
    ip: getClientIp(request),
    result: "success",
  });

  return NextResponse.json({
    data: {
      name: updated.name,
      defaultRotationPolicy: updated.defaultRotationPolicy,
      warnBeforeExpirationDays: updated.warnBeforeExpirationDays,
    },
  });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const body = await request.json();
  const parsed = deleteOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input" } }, { status: 400 });
  }

  const organizationId = session.user.organizationId;
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Organization not found." } }, { status: 404 });
  }

  if (parsed.data.confirmName !== org.name) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Organization name doesn't match." } },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    const namespaceIds = (await tx.namespace.findMany({ where: { organizationId }, select: { id: true } })).map(
      (n) => n.id,
    );
    const userIds = (await tx.user.findMany({ where: { organizationId }, select: { id: true } })).map((u) => u.id);
    const secretIds = (await tx.secret.findMany({ where: { organizationId }, select: { id: true } })).map(
      (s) => s.id,
    );

    await tx.auditLog.deleteMany({ where: { organizationId } });
    await tx.secretVersion.deleteMany({ where: { secretId: { in: secretIds } } });
    await tx.secret.deleteMany({ where: { organizationId } });
    await tx.userNamespaceRole.deleteMany({
      where: { OR: [{ namespaceId: { in: namespaceIds } }, { userId: { in: userIds } }] },
    });
    await tx.session.deleteMany({ where: { userId: { in: userIds } } });
    await tx.namespace.deleteMany({ where: { organizationId } });
    await tx.user.deleteMany({ where: { organizationId } });
    await tx.organization.delete({ where: { id: organizationId } });
  });

  await destroySession();

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
