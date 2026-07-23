import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/auth-schemas";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

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
    return NextResponse.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } },
      { status: 401 },
    );
  }

  await createSession(user.id, rememberMe);
  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

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
