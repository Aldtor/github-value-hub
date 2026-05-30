import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { fetchProfile, primaryLanguage } from "@/lib/github";
import { aggregate, score, rank } from "@/lib/gitworth";
import type { GhUser, Repo } from "@/components/GitWorthView";
import { Skeleton, EmptyState } from "@/components/ui-bits";

export const Route = createFileRoute("/compare_/$user1/$user2")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.user1} vs @${params.user2} — GitWorth Compare` },
      { name: "description", content: `Side-by-side GitHub comparison of @${params.user1} and @${params.user2}.` },
      { property: "og:title", content: `@${params.user1} vs @${params.user2}` },
      { property: "og:description", content: `See who wins on followers, stars, repos and overall GitWorth score.` },
      { property: "og:url", content: `/compare/${params.user1}/${params.user2}` },
    ],
    links: [{ rel: "canonical", href: `/compare/${params.user1}/${params.user2}` }],
  }),
  component: CompareResult,
});

type D = { user: GhUser; repos: Repo[]; agg: ReturnType<typeof aggregate>; sc: number; rk: ReturnType<typeof rank>; lang: string | null };

function CompareResult() {
  const { user1, user2 } = Route.useParams();
  const [a, setA] = useState<D | null>(null);
  const [b, setB] = useState<D | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setA(null); setB(null); setErr(null);
    Promise.all([fetchProfile(user1), fetchProfile(user2)])
      .then(([p1, p2]) => {
        const make = (p: { user: GhUser; repos: Repo[] }): D => {
          const agg = aggregate(p.user, p.repos);
          const sc = score(p.user, agg).value;
          return { ...p, agg, sc, rk: rank(sc), lang: primaryLanguage(p.repos) };
        };
        setA(make(p1)); setB(make(p2));
      })
      .catch(e => setErr(e.message));
  }, [user1, user2]);

  async function shareLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false),2000); }
    catch { window.prompt("Copy link:", window.location.href); }
  }

  if (err) return <Shell><div className="pt-20"><EmptyState title="Couldn't load both profiles" body={err} /></div></Shell>;
  if (!a || !b) return <Shell><div className="pt-20 space-y-4"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-64 w-full" /></div></Shell>;

  const rows: { label: string; a: number; b: number; fmt?: (n: number) => string }[] = [
    { label: "GitWorth Score", a: a.sc, b: b.sc },
    { label: "Followers", a: a.user.followers, b: b.user.followers },
    { label: "Following", a: a.user.following, b: b.user.following },
    { label: "Repositories", a: a.user.public_repos, b: b.user.public_repos },
    { label: "Total stars", a: a.agg.stars, b: b.agg.stars },
    { label: "Total forks", a: a.agg.forks, b: b.agg.forks },
    { label: "Original repos", a: a.agg.original, b: b.agg.original },
    { label: "Account age (yrs)", a: +a.agg.ageYears.toFixed(1), b: +b.agg.ageYears.toFixed(1) },
  ];

  let aWins = 0, bWins = 0;
  rows.forEach(r => { if (r.a > r.b) aWins++; else if (r.b > r.a) bWins++; });
  const winner = aWins === bWins ? "tie" : aWins > bWins ? "a" : "b";

  return (
    <Shell>
      <section className="pt-16 pb-10">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          @{a.user.login} <span className="text-muted-foreground">vs</span> @{b.user.login}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="font-mono text-xs text-muted-foreground">
            {winner === "tie" ? "It's a tie" : `Overall winner: @${winner === "a" ? a.user.login : b.user.login}`} · {aWins}–{bWins}
          </span>
          <button onClick={shareLink} className="ml-auto px-3 py-1.5 border border-border text-xs hover:border-foreground transition">
            {copied ? "✓ Copied" : "Copy link"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4 md:gap-8">
        <div></div>
        <Card d={a} winner={winner === "a"} />
        <Card d={b} winner={winner === "b"} />
      </section>

      <section className="mt-10 border border-border divide-y divide-border">
        {rows.map(r => {
          const aw = r.a > r.b, bw = r.b > r.a;
          return (
            <div key={r.label} className="grid grid-cols-3 gap-4 md:gap-8 px-4 md:px-6 py-3 items-center">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <Val v={r.a} winner={aw} fmt={r.fmt} />
              <Val v={r.b} winner={bw} fmt={r.fmt} />
            </div>
          );
        })}
      </section>

      <section className="mt-10 grid grid-cols-3 gap-4 md:gap-8 items-start">
        <span className="text-sm text-muted-foreground">Primary language</span>
        <span className="font-mono text-sm">{a.lang ?? "—"}</span>
        <span className="font-mono text-sm">{b.lang ?? "—"}</span>
      </section>

      <div className="mt-12 text-sm">
        <Link to="/compare" className="text-muted-foreground hover:text-foreground transition">← compare different devs</Link>
      </div>
    </Shell>
  );
}

function Card({ d, winner }: { d: D; winner: boolean }) {
  return (
    <div className={`border p-5 ${winner ? "border-foreground" : "border-border"}`}>
      <img src={d.user.avatar_url} alt={d.user.login} className="w-16 h-16 rounded-full border border-border" />
      <p className="mt-3 font-medium truncate">{d.user.name ?? d.user.login}</p>
      <p className="font-mono text-xs text-muted-foreground">@{d.user.login}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{d.sc.toLocaleString()}</p>
      <p className="font-mono text-xs text-muted-foreground">{d.rk.percentile} · {d.rk.tier}</p>
      {winner && <p className="mt-3 font-mono text-xs">★ winner</p>}
    </div>
  );
}

function Val({ v, winner, fmt }: { v: number; winner: boolean; fmt?: (n:number)=>string }) {
  return (
    <span className={`font-mono text-base tabular-nums ${winner ? "font-semibold" : "text-muted-foreground"}`}>
      {fmt ? fmt(v) : v.toLocaleString()} {winner && <span className="ml-1">★</span>}
    </span>
  );
}
