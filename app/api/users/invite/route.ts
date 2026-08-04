import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { inviteUserSchema } from "@/lib/user-schemas";
import { logAudit, getClientIp } from "@/lib/audit";

function generateTempPassword(): string {
  return "Vlt-" + randomBytes(9).toString("base64url");
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const body = await request.json();
  const parsed = inviteUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const { fullName, email, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "An account with this email already exists." } },
      { status: 409 },
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role,
      organizationId: session.user.organizationId,
      invitedById: session.user.id,
    },
  });

  await logAudit({
    organizationId: session.user.organizationId,
    actorId: session.user.id,
    actorLabel: session.user.email,
    action: "user.invite",
    resourceType: "user",
    resourceId: user.id,
    resourceLabel: user.email,
    ip: getClientIp(request),
    result: "success",
  });

  return NextResponse.json(
    {
      data: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        lastActive: "—",
        mfaEnabled: false,
        status: user.status,
        tempPassword,
      },
    },
    { status: 201 },
  );
}
