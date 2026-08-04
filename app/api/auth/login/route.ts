import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/auth-schemas";
import { createSession } from "@/lib/session";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  const ip = getClientIp(request);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const { email, password, rememberMe } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    // Only logged when the account is real — an unknown email has no organization
    // to attribute the attempt to, and confirming it exists would itself leak info.
    if (user) {
      await logAudit({
        organizationId: user.organizationId,
        actorId: user.id,
        actorLabel: user.email,
        action: "login.failed",
        resourceType: "session",
        resourceLabel: user.email,
        ip,
        result: "denied",
      });
    }
    return NextResponse.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } },
      { status: 401 },
    );
  }

  if (user.status === "suspended") {
    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      actorLabel: user.email,
      action: "login.failed",
      resourceType: "session",
      resourceLabel: user.email,
      ip,
      result: "denied",
    });
    return NextResponse.json(
      { error: { code: "ACCOUNT_SUSPENDED", message: "This account has been suspended." } },
      { status: 403 },
    );
  }

  await createSession(user.id, rememberMe);
  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  await logAudit({
    organizationId: user.organizationId,
    actorId: user.id,
    actorLabel: user.email,
    action: "login.success",
    resourceType: "session",
    resourceLabel: user.email,
    ip,
    result: "success",
  });

  return NextResponse.json(
    {
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    },
    { status: 200 },
  );
}
