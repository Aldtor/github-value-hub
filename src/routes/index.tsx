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
    <div className="min-h-screen text-foreground relative">
      <header className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm tracking-tight">
          <span className="inline-block w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />
          <span className="font-serif text-xl"><span className="text-muted-foreground italic">git</span>worth</span>
        </Link>
        <a href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition font-mono">
          powered by GitHub API ↗
        </a>
      </header>
      <main className="max-w-6xl mx-auto px-6 pb-24">
        <GitWorthView />
      </main>
    </div>
  );
}
