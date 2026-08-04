import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { AppUser } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
  });

  const data: AppUser[] = users.map((u) => ({
    id: u.id,
    name: u.fullName,
    email: u.email,
    role: u.role,
    lastActive: u.lastActiveAt ? u.lastActiveAt.toISOString() : "—",
    mfaEnabled: u.mfaEnabled,
    status: u.status as AppUser["status"],
  }));

  return NextResponse.json({ data }, { status: 200 });
}
