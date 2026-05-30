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
    <div className="min-h-screen text-foreground">
      <header className="max-w-5xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
        <Link to="/" className="font-mono text-sm tracking-tight">gitworth</Link>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition font-mono">← appraise another</Link>
      </header>
      <main className="max-w-5xl mx-auto px-6 pb-24 pt-4">
        <GitWorthView initialUsername={username} autoFetch showSearch={false} />
      </main>
    </div>
  );
}
