import { createFileRoute, Link } from "@tanstack/react-router";
import { GitWorthView } from "@/components/GitWorthView";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username}'s GitHub worth — GitWorth` },
      { name: "description", content: `See @${params.username}'s GitHub profile summary, growth charts, and fun dollar valuation.` },
      { property: "og:title", content: `@${params.username}'s GitHub worth` },
      { property: "og:description", content: `GitHub profile summary, growth charts, and dollar valuation for @${params.username}.` },
    ],
  }),
  component: SharePage,
});

function SharePage() {
  const { username } = Route.useParams();
  return (
    <div className="min-h-screen text-foreground relative">
      <header className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm tracking-tight">
          <span className="inline-block w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />
          <span className="font-serif text-xl"><span className="text-muted-foreground italic">git</span>worth</span>
        </Link>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition font-mono">← appraise another</Link>
      </header>
      <main className="max-w-6xl mx-auto px-6 pb-24 pt-4">
        <GitWorthView initialUsername={username} autoFetch showSearch={false} />
      </main>
    </div>
  );
}
