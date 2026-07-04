import { Lock } from "lucide-react";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface">
          <Lock className="h-4 w-4 text-accent" strokeWidth={2} />
        </div>
        <h1 className="text-[15px] font-semibold text-fg">{title}</h1>
        <p className="text-[12.5px] text-fg-muted">{subtitle}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">{children}</div>

      <p className="mt-4 text-center text-[12.5px] text-fg-muted">{footer}</p>
    </div>
  );
}
