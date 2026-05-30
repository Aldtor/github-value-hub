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
    <div className="min-h-screen text-foreground">
      <header className="max-w-5xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
        <Link to="/" className="font-mono text-sm tracking-tight">gitworth</Link>
        <a href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition font-mono">
          github api ↗
        </a>
      </header>
      <main className="max-w-5xl mx-auto px-6 pb-24">
        <GitWorthView />
      </main>
    </div>
  );
}
