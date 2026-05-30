import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { fetchProfile, primaryLanguage } from "@/lib/github";
import { aggregate, score, rank, achievements } from "@/lib/gitworth";
import type { GhUser, Repo } from "@/components/GitWorthView";
import { Skeleton, EmptyState } from "@/components/ui-bits";

export const Route = createFileRoute("/portfolio/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Portfolio · GitWorth` },
      { name: "description", content: `Auto-generated developer portfolio for @${params.username} with top repositories, languages and GitWorth score.` },
      { property: "og:title", content: `@${params.username} — Portfolio` },
      { property: "og:description", content: `Developer portfolio with top repos and stats.` },
      { property: "og:url", content: `/portfolio/${params.username}` },
    ],
    links: [{ rel: "canonical", href: `/portfolio/${params.username}` }],
  }),
  component: Portfolio,
});

function Portfolio() {
  const { username } = Route.useParams();
  const [data, setData] = useState<{ user: GhUser; repos: Repo[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { fetchProfile(username).then(setData).catch(e => setErr(e.message)); }, [username]);

  const topRepos = useMemo(() => {
    if (!data) return [];
    return [...data.repos].filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
  }, [data]);

  if (err) return <Shell><div className="pt-20"><EmptyState title="Couldn't load portfolio" body={err} /></div></Shell>;
  if (!data) return <Shell><div className="pt-20 space-y-3"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div></Shell>;

  const { user, repos } = data;
  const agg = aggregate(user, repos);
  const sc = score(user, agg).value;
  const r = rank(sc);
  const ach = achievements(user, repos, agg);
  const langs = new Map<string, number>();
  repos.forEach(r => { if (r.language) langs.set(r.language, (langs.get(r.language) ?? 0) + 1); });
  const lang = primaryLanguage(repos);

  return (
    <Shell>
      <section className="pt-16 pb-10 flex flex-col md:flex-row gap-8 items-start">
        <img src={user.avatar_url} alt={user.login} className="w-28 h-28 rounded-full border border-border" />
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">{user.name ?? user.login}</h1>
          <a href={user.html_url} target="_blank" rel="noreferrer" className="font-mono text-sm text-muted-foreground hover:text-foreground hover:underline">@{user.login}</a>
          {user.bio && <p className="mt-4 text-base text-muted-foreground max-w-2xl leading-relaxed">{user.bio}</p>}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground">
            {user.location && <span>📍 {user.location}</span>}
            {user.company && <span>🏢 {user.company}</span>}
            {lang && <span>● {lang}</span>}
            <span>{r.percentile} · {r.tier}</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 border-y border-border py-6">
        <SItem l="GitWorth" v={sc.toLocaleString()} />
        <SItem l="Followers" v={user.followers.toLocaleString()} />
        <SItem l="Total stars" v={agg.stars.toLocaleString()} />
        <SItem l="Repos" v={user.public_repos.toLocaleString()} />
      </section>

      <section className="mt-12">
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-5">Top repositories</h2>
        {topRepos.length === 0 ? (
          <EmptyState title="No public repositories yet" body="When this developer publishes original code it'll show up here." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {topRepos.map(r => (
              <a key={r.name} href={`${user.html_url}/${r.name}`} target="_blank" rel="noreferrer"
                className="block border border-border p-4 hover:border-foreground transition">
                <p className="font-mono text-sm">{r.name}</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  ★ {r.stargazers_count.toLocaleString()} · ⑂ {r.forks_count.toLocaleString()}{r.language && ` · ${r.language}`}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>

      {langs.size > 0 && (
        <section className="mt-12">
          <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-5">Languages</h2>
          <p className="font-mono text-sm leading-relaxed">
            {[...langs.entries()].sort((a,b)=>b[1]-a[1]).map(([l,n],i) => (
              <span key={l}>
                {i>0 && <span className="text-muted-foreground/40 mx-2">·</span>}
                {l} <span className="text-muted-foreground">×{n}</span>
              </span>
            ))}
          </p>
        </section>
      )}

      {ach.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-5">Achievements</h2>
          <div className="flex flex-wrap gap-2">
            {ach.map(a => (
              <span key={a.id} className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-sm">
                <span>{a.emoji}</span>{a.label}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="mt-14 flex gap-3 text-sm">
        <Link to="/u/$username" params={{username}} className="px-4 py-2 border border-border hover:border-foreground transition">Full appraisal →</Link>
        <Link to="/wrapped/$username" params={{username}} className="px-4 py-2 border border-border hover:border-foreground transition">Wrapped →</Link>
        <Link to="/badges/$username" params={{username}} className="px-4 py-2 border border-border hover:border-foreground transition">Embed badge →</Link>
      </div>
    </Shell>
  );
}

function SItem({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{l}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{v}</p>
    </div>
  );
}
