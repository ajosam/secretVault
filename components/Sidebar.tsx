"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KeyRound,
  FolderTree,
  ScrollText,
  ShieldCheck,
  RefreshCw,
  Users,
  Settings,
  Lock,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Secrets", icon: KeyRound },
  { href: "/namespaces", label: "Namespaces", icon: FolderTree },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/access-policies", label: "Access Policies", icon: ShieldCheck },
  { href: "/rotations", label: "Rotations", icon: RefreshCw },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ organizationName }: { organizationName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-12 items-center gap-2 border-b border-border px-4">
        <Lock className="h-4 w-4 text-accent" strokeWidth={2} />
        <span className="text-[13px] font-semibold tracking-tight text-fg">Vaultline</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                    active
                      ? "bg-surface-hover text-fg font-medium"
                      : "text-fg-muted hover:bg-surface-hover hover:text-fg"
                  }`}
                >
                  <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border px-3 py-2.5 text-[11px] text-fg-subtle">
        v2.4.1 · org: {organizationName}
      </div>
    </aside>
  );
}
