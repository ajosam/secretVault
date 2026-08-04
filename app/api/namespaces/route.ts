import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createNamespaceSchema } from "@/lib/namespace-schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import type { Namespace } from "@/lib/types";

function serializeNamespace(ns: {
  id: string;
  name: string;
  owner: { fullName: string } | null;
  createdAt: Date;
  policyLabel: string | null;
  _count: { secrets: number };
}): Namespace {
  return {
    id: ns.id,
    name: ns.name,
    secretsCount: ns._count.secrets,
    owner: ns.owner?.fullName ?? "",
    createdAt: ns.createdAt.toISOString(),
    policy: ns.policyLabel ?? "",
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const namespaces = await prisma.namespace.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      owner: true,
      _count: { select: { secrets: { where: { deletedAt: null } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: namespaces.map(serializeNamespace) }, { status: 200 });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createNamespaceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const { name, policyLabel } = parsed.data;
  const organizationId = session.user.organizationId;

  const existing = await prisma.namespace.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });
  if (existing) {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: `A namespace named "${name}" already exists.` } },
      { status: 409 },
    );
  }

  const namespace = await prisma.$transaction(async (tx) => {
    const created = await tx.namespace.create({
      data: {
        name,
        organizationId,
        ownerId: session.user.id,
        policyLabel: policyLabel || null,
      },
      include: {
        owner: true,
        _count: { select: { secrets: true } },
      },
    });

    // The creator gets admin access to what they just made — otherwise they'd
    // have no explicit role in it at all under the namespace-scoped access model.
    await tx.userNamespaceRole.upsert({
      where: { userId_namespaceId: { userId: session.user.id, namespaceId: created.id } },
      create: { userId: session.user.id, namespaceId: created.id, role: "admin" },
      update: {},
    });

    return created;
  });

  await logAudit({
    organizationId,
    actorId: session.user.id,
    actorLabel: session.user.email,
    action: "namespace.create",
    resourceType: "namespace",
    resourceId: namespace.id,
    resourceLabel: namespace.name,
    namespaceId: namespace.id,
    ip: getClientIp(request),
    result: "success",
  });

  return NextResponse.json({ data: serializeNamespace(namespace) }, { status: 201 });
}
