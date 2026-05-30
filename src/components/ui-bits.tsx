import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted animate-pulse ${className}`} />;
}

export function EmptyState({
  title, body, icon = "∅",
}: { title: string; body?: string; icon?: ReactNode }) {
  return (
    <div className="border border-dashed border-border p-10 text-center">
      <div className="text-2xl text-muted-foreground/60 font-mono">{icon}</div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {body && <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">{body}</p>}
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border text-xs font-mono">
      {children}
    </span>
  );
}
