import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { GitWorthView } from "@/components/GitWorthView";
import { ProfileExtras } from "@/components/ProfileExtras";
import { useEffect, useState } from "react";
import { fetchProfile } from "@/lib/github";
import type { GhUser, Repo } from "@/components/GitWorthView";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} on GitWorth — score, rank & breakdown` },
      { name: "description", content: `See @${params.username}'s GitHub stats, GitWorth score, global rank, achievements and growth.` },
      { property: "og:title", content: `@${params.username} on GitWorth` },
      { property: "og:description", content: `Score, rank, achievements and charts for @${params.username}.` },
      { property: "og:url", content: `/u/${params.username}` },
      { property: "og:type", content: "profile" },
    ],
    links: [{ rel: "canonical", href: `/u/${params.username}` }],
  }),
  component: SharePage,
});

function SharePage() {
  const { username } = Route.useParams();
  const [data, setData] = useState<{ user: GhUser; repos: Repo[] } | null>(null);
  useEffect(() => { fetchProfile(username).then(setData).catch(() => {}); }, [username]);

  return (
    <Shell>
      <GitWorthView initialUsername={username} autoFetch showSearch={false} />
      {data && <ProfileExtras user={data.user} repos={data.repos} />}
      <div className="mt-12 text-sm">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition">← appraise another</Link>
      </div>
    </Shell>
  );
}
