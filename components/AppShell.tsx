import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export interface CurrentUser {
  fullName: string;
  email: string;
  organizationName: string;
}

export function AppShell({ children, user }: { children: ReactNode; user: CurrentUser }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas text-fg">
      <Sidebar organizationName={user.organizationName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav user={user} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
