import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = {
    fullName: session.user.fullName,
    email: session.user.email,
    organizationName: session.user.organization.name,
  };

  return <AppShell user={user}>{children}</AppShell>;
}
