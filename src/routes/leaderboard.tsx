import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { fetchProfile, primaryLanguage } from "@/lib/github";
import { aggregate, score } from "@/lib/gitworth";
import type { GhUser, Repo } from "@/components/GitWorthView";
import { Skeleton } from "@/components/ui-bits";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — GitWorth" },
      { name: "description", content: "Featured developers ranked by GitWorth Score, with language and topic filters." },
      { property: "og:title", content: "Leaderboard — GitWorth" },
      { property: "og:description", content: "Top developers by GitWorth Score." },
      { property: "og:url", content: "/leaderboard" },
    ],
    links: [{ rel: "canonical", href: "/leaderboard" }],
  }),
  component: Leaderboard,
});

// Curated featured developers. The "global" leaderboard is community-curated, not a
// crawl of every GitHub user (which would require a backend).
const FEATURED: { login: string; topics: string[] }[] = [
  { login: "torvalds",       topics: ["Open Source"] },
  { login: "gaearon",        topics: ["JavaScript", "TypeScript", "React"] },
  { login: "sindresorhus",   topics: ["JavaScript", "TypeScript", "Open Source"] },
  { login: "tj",             topics: ["JavaScript", "Open Source"] },
  { login: "yyx990803",      topics: ["JavaScript", "TypeScript"] },
  { login: "fabpot",         topics: ["Open Source"] },
  { login: "addyosmani",     topics: ["JavaScript", "React"] },
  { login: "kentcdodds",     topics: ["JavaScript", "React"] },
  { login: "tannerlinsley",  topics: ["TypeScript", "React"] },
  { login: "shadcn",         topics: ["TypeScript", "React"] },
  { login: "felangel",       topics: ["Flutter"] },
  { login: "rrousselGit",    topics: ["Flutter"] },
  { login: "karpathy",       topics: ["AI/ML", "Python"] },
  { login: "ggerganov",      topics: ["AI/ML"] },
  { login: "jakevdp",        topics: ["Python", "AI/ML"] },
  { login: "wesm",           topics: ["Python"] },
  { login: "mitsuhiko",      topics: ["Python", "Open Source"] },
  { login: "antfu",          topics: ["TypeScript", "Open Source"] },
  { login: "leerob",         topics: ["JavaScript", "React"] },
];

const FILTERS = ["Global","Python","JavaScript","TypeScript","Flutter","AI/ML","React","Open Source"] as const;

type Row = { login: string; topics: string[]; user: GhUser | null; sc: number; lang: string | null };

function Leaderboard() {
  const [rows, setRows] = useState<Row[]>(FEATURED.map(f => ({ ...f, user: null, sc: 0, lang: null })));
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Global");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<"score" | "followers" | "repos">("score");

  useEffect(() => {
    let cancel = false;
    // Fetch all profiles in parallel — much faster than sequential.
    FEATURED.forEach(f => {
      fetchProfile(f.login)
        .then(p => {
          if (cancel) return;
          const sc = score(p.user, aggregate(p.user, p.repos)).value;
          setRows(prev => prev.map(r => r.login === f.login ? { ...r, user: p.user, sc, lang: primaryLanguage(p.repos) } : r));
        })
        .catch(() => { /* skip rate-limited or missing */ });
    });
    return () => { cancel = true; };
  }, []);

  const visible = useMemo(() => {
    return rows
      .filter(r => filter === "Global" || r.topics.includes(filter))
      .filter(r => !q || r.login.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => {
        if (!a.user) return 1; if (!b.user) return -1;
        if (sortKey === "followers") return b.user.followers - a.user.followers;
        if (sortKey === "repos") return b.user.public_repos - a.user.public_repos;
        return b.sc - a.sc;
      });
  }, [rows, filter, q, sortKey]);

  return (
    <Shell wide>
      <section className="pt-16 pb-8">
        <h1 className="text-5xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="mt-4 text-muted-foreground max-w-xl">
          Featured developers ranked by GitWorth Score. Curated, not crawled — submit additions on{" "}
          <a href="https://github.com" target="_blank" rel="noreferrer" className="underline underline-offset-4">GitHub</a>.
        </p>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-mono border transition ${filter === f ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center mt-5">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="search username…"
          className="flex-1 min-w-[200px] border border-border px-3 py-2 font-mono text-sm outline-none focus:border-foreground" />
        <select value={sortKey} onChange={e => setSortKey(e.target.value as typeof sortKey)}
          className="border border-border px-3 py-2 font-mono text-sm bg-background">
          <option value="score">sort: score</option>
          <option value="followers">sort: followers</option>
          <option value="repos">sort: repos</option>
        </select>
      </div>

      <table className="w-full mt-6 text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <th className="py-3 w-12">#</th>
            <th className="py-3">Developer</th>
            <th className="py-3 text-right">Score</th>
            <th className="py-3 text-right hidden sm:table-cell">Followers</th>
            <th className="py-3 text-right hidden md:table-cell">Repos</th>
            <th className="py-3 hidden md:table-cell pl-6">Lang</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <tr key={r.login} className="border-b border-border hover:bg-secondary transition">
                <td className="py-3 font-mono text-muted-foreground">
                  {medal ? <span className="text-base">{medal}</span> : i + 1}
                </td>
                <td className="py-3">
                  <Link to="/u/$username" params={{ username: r.login }} className="flex items-center gap-3 group">
                    {r.user ? (
                      <img src={r.user.avatar_url} alt={r.login} className="w-7 h-7 rounded-full border border-border" />
                    ) : (
                      <Skeleton className="w-7 h-7 rounded-full" />
                    )}
                    <span className="font-mono group-hover:underline underline-offset-4">@{r.login}</span>
                  </Link>
                </td>
                <td className="py-3 text-right font-mono tabular-nums">
                  {r.user ? r.sc.toLocaleString() : <Skeleton className="h-4 w-16 ml-auto" />}
                </td>
                <td className="py-3 text-right font-mono tabular-nums hidden sm:table-cell">
                  {r.user ? r.user.followers.toLocaleString() : "—"}
                </td>
                <td className="py-3 text-right font-mono tabular-nums hidden md:table-cell">
                  {r.user ? r.user.public_repos.toLocaleString() : "—"}
                </td>
                <td className="py-3 font-mono text-muted-foreground hidden md:table-cell pl-6">
                  {r.lang ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {visible.length === 0 && <p className="text-center text-sm text-muted-foreground mt-10">No developers match those filters.</p>}
    </Shell>
  );
}
