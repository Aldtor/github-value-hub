import { createFileRoute, Link } from "@tanstack/react-router";
import { GitWorthView } from "@/components/GitWorthView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitWorth — What is your GitHub worth?" },
      { name: "description", content: "Look up any GitHub profile, see growth charts, tweak the valuation formula, export a PDF, and share the link." },
      { property: "og:title", content: "GitWorth — What is your GitHub worth?" },
      { property: "og:description", content: "Look up any GitHub profile and get a fun dollar valuation." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 20% 10%, oklch(0.82 0.18 145 / 0.25), transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.75 0.18 65 / 0.2), transparent 45%)" }} />
      <header className="max-w-5xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm tracking-tight">
          <span className="inline-block w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />
          <span className="text-muted-foreground">git</span><span className="font-bold">worth</span>
        </Link>
        <a href="https://github.com" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition">powered by GitHub API</a>
      </header>
      <main className="max-w-5xl mx-auto px-6 pb-20">
        <GitWorthView />
      </main>
    </div>
  );
}
