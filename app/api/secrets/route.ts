import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { encryptSecretValue } from "@/lib/crypto";
import { createSecretSchema } from "@/lib/secret-schemas";
import type { Secret } from "@/lib/types";

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function serializeSecret(secret: {
  id: string;
  name: string;
  path: string;
  namespace: { name: string };
  description: string;
  tags: string[];
  status: string;
  rotationPolicy: string;
  nextRotation: Date | null;
  expiresAt: Date | null;
  owner: { fullName: string } | null;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
  versions: { version: number; createdAt: Date; createdBy: { fullName: string }; status: string; checksum: string }[];
}): Secret {
  return {
    id: secret.id,
    name: secret.name,
    path: secret.path,
    namespace: secret.namespace.name,
    version: secret.currentVersion,
    updatedAt: secret.updatedAt.toISOString(),
    createdAt: secret.createdAt.toISOString(),
    rotationPolicy: secret.rotationPolicy as Secret["rotationPolicy"],
    nextRotation: secret.nextRotation ? secret.nextRotation.toISOString() : null,
    status: secret.status as Secret["status"],
    owner: secret.owner?.fullName ?? "",
    expiresAt: secret.expiresAt ? secret.expiresAt.toISOString() : null,
    tags: secret.tags,
    description: secret.description,
    versions: secret.versions
      .sort((a, b) => b.version - a.version)
      .map((v) => ({
        version: v.version,
        createdAt: v.createdAt.toISOString(),
        createdBy: v.createdBy.fullName,
        status: v.status as "active" | "archived",
        checksum: v.checksum,
      })),
    accessHistory: [],
    permissions: [],
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const secrets = await prisma.secret.findMany({
    where: { organizationId: session.user.organizationId, deletedAt: null },
    include: {
      namespace: true,
      owner: true,
      versions: { include: { createdBy: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: secrets.map(serializeSecret) }, { status: 200 });
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
