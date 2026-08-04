import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { encryptSecretValue } from "@/lib/crypto";
import { createSecretSchema } from "@/lib/secret-schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import { serializeSecret, SECRET_INCLUDE } from "@/lib/secret-serializer";
import type { AccessEvent } from "@/lib/types";

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const secrets = await prisma.secret.findMany({
    where: { organizationId: session.user.organizationId, deletedAt: null },
    include: SECRET_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  const secretIds = secrets.map((s) => s.id);
  const auditEntries = secretIds.length
    ? await prisma.auditLog.findMany({
        where: {
          organizationId: session.user.organizationId,
          resourceType: "secret",
          resourceId: { in: secretIds },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const accessHistoryBySecretId = new Map<string, AccessEvent[]>();
  for (const entry of auditEntries) {
    if (!entry.resourceId) continue;
    const list = accessHistoryBySecretId.get(entry.resourceId) ?? [];
    list.push({
      id: entry.id,
      actor: entry.actorLabel,
      action: entry.action,
      timestamp: entry.createdAt.toISOString(),
      result: entry.result as AccessEvent["result"],
      ip: entry.ip,
    });
    accessHistoryBySecretId.set(entry.resourceId, list);
  }

  return NextResponse.json(
    { data: secrets.map((s) => serializeSecret(s, accessHistoryBySecretId.get(s.id) ?? [])) },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSecretSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const { name, namespace: namespaceName, value, description, tags, rotationPolicy } = parsed.data;
  const organizationId = session.user.organizationId;
  const path = `/${namespaceName}/${name}`;

  try {
    const secret = await prisma.$transaction(async (tx) => {
      let namespace = await tx.namespace.findUnique({
        where: { organizationId_name: { organizationId, name: namespaceName } },
      });

      if (!namespace) {
        namespace = await tx.namespace.create({
          data: { name: namespaceName, organizationId, ownerId: session.user.id },
        });
        await tx.userNamespaceRole.upsert({
          where: { userId_namespaceId: { userId: session.user.id, namespaceId: namespace.id } },
          create: { userId: session.user.id, namespaceId: namespace.id, role: "admin" },
          update: {},
        });
      }

      const existing = await tx.secret.findUnique({
        where: { namespaceId_path: { namespaceId: namespace.id, path } },
      });
      if (existing) {
        throw new ConflictError(`A secret at ${path} already exists.`);
      }

      const { ciphertext, iv, authTag, checksum } = encryptSecretValue(value);

      const created = await tx.secret.create({
        data: {
          name,
          path,
          namespaceId: namespace.id,
          organizationId,
          description: description ?? "",
          tags: tags ?? [],
          rotationPolicy: rotationPolicy ?? "manual",
          ownerId: session.user.id,
          currentVersion: 1,
          versions: {
            create: {
              version: 1,
              ciphertext,
              iv,
              authTag,
              checksum,
              createdById: session.user.id,
            },
          },
        },
        include: {
          namespace: true,
          owner: true,
          versions: { include: { createdBy: true } },
        },
      });

      return created;
    });

    await logAudit({
      organizationId,
      actorId: session.user.id,
      actorLabel: session.user.email,
      action: "secret.create",
      resourceType: "secret",
      resourceId: secret.id,
      resourceLabel: secret.name,
      namespaceId: secret.namespaceId,
      ip: getClientIp(request),
      result: "success",
    });

    return NextResponse.json({ data: serializeSecret(secret) }, { status: 201 });
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: { code: "CONFLICT", message: err.message } }, { status: 409 });
    }

    console.error("create secret failed", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } },
      { status: 500 },
    );
  }
}
