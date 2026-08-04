"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Bell, Plus, ChevronDown, Settings, LogOut } from "lucide-react";
import type { CurrentUser } from "./AppShell";

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function TopNav({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstName = user.fullName.trim().split(/\s+/)[0] ?? user.fullName;
  const initials = getInitials(user.fullName);

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep local input state in sync if the URL changes from elsewhere
  // (e.g. navigating to a different page clears "q").
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function handleLogout() {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search secrets, namespaces, paths…"
          className="h-7 w-full rounded-md border border-border bg-surface-2 pl-8 pr-14 text-[12.5px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
        {!query && (
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
            ⌘K
          </kbd>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => router.push("/?new=1")}
          className="flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-[12.5px] font-medium text-accent-fg transition-colors hover:bg-accent/90"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New Secret
        </button>

        <button
          aria-label="Notifications"
          className="relative flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-7 items-center gap-1.5 rounded-md border border-border pl-1 pr-1.5 text-[12.5px] text-fg transition-colors hover:bg-surface-hover"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/20 text-[10px] font-semibold text-accent">
              {initials}
            </span>
            <span className="text-fg-muted">{firstName}</span>
            <ChevronDown className="h-3 w-3 text-fg-subtle" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+4px)] w-48 rounded-md border border-border bg-surface-2 py-1"
            >
              <div className="border-b border-border-muted px-3 py-2">
                <p className="truncate text-[12.5px] font-medium text-fg">{user.fullName}</p>
                <p className="truncate text-[11.5px] text-fg-subtle">{user.email}</p>
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] text-fg-muted hover:bg-surface-hover hover:text-fg"
              >
                <Settings className="h-3.5 w-3.5" strokeWidth={1.75} />
                Settings
              </button>
              <div className="my-1 border-t border-border-muted" />
              <button
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] text-danger hover:bg-danger/10"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
