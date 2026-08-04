import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { assignAccessSchema } from "@/lib/access-schemas";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const { id } = await params;
  const namespace = await prisma.namespace.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!namespace) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Namespace not found." } }, { status: 404 });
  }

  const assignments = await prisma.userNamespaceRole.findMany({
    where: { namespaceId: id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    data: assignments.map((a) => ({
      userId: a.userId,
      userName: a.user.fullName,
      userEmail: a.user.email,
      role: a.role,
    })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const { id } = await params;
  const namespace = await prisma.namespace.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!namespace) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Namespace not found." } }, { status: 404 });
  }

  const body = await request.json();
  const parsed = assignAccessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const { userId, role } = parsed.data;

  const targetUser = await prisma.user.findFirst({
    where: { id: userId, organizationId: session.user.organizationId },
  });
  if (!targetUser) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "User not found in this organization." } },
      { status: 404 },
    );
  }

  const assignment = await prisma.userNamespaceRole.upsert({
    where: { userId_namespaceId: { userId, namespaceId: id } },
    create: { userId, namespaceId: id, role },
    update: { role },
    include: { user: true },
  });

  await logAudit({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    actorLabel: session.user.email,
    action: "namespace_role.assign",
    resourceType: "namespace_role",
    resourceId: assignment.id,
    resourceLabel: `${targetUser.email} → ${role} in ${namespace.name}`,
    namespaceId: id,
    ip: getClientIp(request),
    result: "success",
  });

  return NextResponse.json(
    {
      data: {
        userId: assignment.userId,
        userName: assignment.user.fullName,
        userEmail: assignment.user.email,
        role: assignment.role,
      },
    },
    { status: 201 },
  );
}
