import { Link } from "@tanstack/react-router";

const items = [
  { to: "/compare" as const, label: "Compare" },
  { to: "/leaderboard" as const, label: "Leaderboard" },
];

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="font-mono text-sm tracking-tight">gitworth</Link>
        <nav className="flex items-center gap-1">
          {items.map(i => (
            <Link
              key={i.to}
              to={i.to}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition"
              activeProps={{ className: "px-3 py-1.5 text-sm text-foreground" }}
            >
              {i.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
