import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { encryptSecretValue } from "@/lib/crypto";
import { rotateSecretSchema } from "@/lib/secret-schemas";
import { logAudit, getClientIp } from "@/lib/audit";
import { serializeSecret, fetchAccessHistory, SECRET_INCLUDE } from "@/lib/secret-serializer";

const POLICY_DAYS: Record<string, number> = { "30d": 30, "60d": 60, "90d": 90 };

function computeNextRotation(policy: string, from: Date): Date | null {
  const days = POLICY_DAYS[policy];
  if (!days) return null;
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = rotateSecretSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const secret = await prisma.secret.findFirst({
    where: { id, organizationId: session.user.organizationId, deletedAt: null },
  });
  if (!secret) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Secret not found." } }, { status: 404 });
  }

  const { ciphertext, iv, authTag, checksum } = encryptSecretValue(parsed.data.value);
  const now = new Date();
  const nextRotation = computeNextRotation(secret.rotationPolicy, now);
  const newVersion = secret.currentVersion + 1;

  await prisma.$transaction([
    prisma.secretVersion.updateMany({
      where: { secretId: id, status: "active" },
      data: { status: "archived" },
    }),
    prisma.secretVersion.create({
      data: {
        secretId: id,
        version: newVersion,
        ciphertext,
        iv,
        authTag,
        checksum,
        createdById: session.user.id,
      },
    }),
    prisma.secret.update({
      where: { id },
      data: { currentVersion: newVersion, nextRotation, status: "active" },
    }),
  ]);

  await logAudit({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    actorLabel: session.user.email,
    action: "secret.rotate",
    resourceType: "secret",
    resourceId: id,
    resourceLabel: secret.name,
    namespaceId: secret.namespaceId,
    ip: getClientIp(request),
    result: "success",
  });

  const updated = await prisma.secret.findUniqueOrThrow({ where: { id }, include: SECRET_INCLUDE });
  const accessHistory = await fetchAccessHistory(session.user.organizationId, id);

  return NextResponse.json({ data: serializeSecret(updated, accessHistory) }, { status: 200 });
}
