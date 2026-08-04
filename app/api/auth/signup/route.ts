import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupApiSchema } from "@/lib/auth-schemas";
import { logAudit, getClientIp } from "@/lib/audit";

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupApiSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const { fullName, organizationName, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.$transaction(async (tx) => {
      // Checked explicitly (rather than relying on catching the DB's unique-constraint
      // error) so the caller gets an accurate "which field conflicted" message —
      // the underlying error metadata shape isn't reliable across driver adapters.
      const [existingUser, existingOrg] = await Promise.all([
        tx.user.findUnique({ where: { email } }),
        tx.organization.findUnique({ where: { name: organizationName } }),
      ]);

      if (existingUser) throw new ConflictError("An account with this email already exists.");
      if (existingOrg) throw new ConflictError("That organization name is already taken.");

      const organization = await tx.organization.create({
        data: { name: organizationName },
      });

      return tx.user.create({
        data: {
          fullName,
          email,
          passwordHash,
          organizationId: organization.id,
          role: "super_admin",
        },
      });
    });

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      actorLabel: user.email,
      action: "organization.create",
      resourceType: "organization",
      resourceId: user.organizationId,
      resourceLabel: organizationName,
      ip: getClientIp(request),
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
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: { code: "CONFLICT", message: err.message } }, { status: 409 });
    }

    console.error("signup failed", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } },
      { status: 500 },
    );
  }
}
