import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Shell } from "@/components/Shell";
import { fetchProfile, primaryLanguage } from "@/lib/github";
import { aggregate, score, rank, achievements } from "@/lib/gitworth";
import type { GhUser, Repo } from "@/components/GitWorthView";
import { Skeleton, EmptyState } from "@/components/ui-bits";

export const Route = createFileRoute("/wrapped/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username}'s GitHub Wrapped — GitWorth` },
      { name: "description", content: `A shareable yearly summary for @${params.username} — score, rank, achievements and stats.` },
      { property: "og:title", content: `@${params.username}'s GitHub Wrapped` },
      { property: "og:description", content: `Score, rank, top language, achievements.` },
      { property: "og:url", content: `/wrapped/${params.username}` },
    ],
    links: [{ rel: "canonical", href: `/wrapped/${params.username}` }],
  }),
  component: Wrapped,
});

function Wrapped() {
  const { username } = Route.useParams();
  const [data, setData] = useState<{ user: GhUser; repos: Repo[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchProfile(username).then(setData).catch(e => setErr(e.message)); }, [username]);

  async function download() {
    if (!cardRef.current) return;
    const png = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
    const a = document.createElement("a");
    a.href = png; a.download = `gitworth-wrapped-${username}.png`; a.click();
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false),2000); }
    catch { /* ignore */ }
  }
  async function share() {
    if (navigator.share) try { await navigator.share({ title: `@${username}'s GitHub Wrapped`, url: window.location.href }); } catch { /* ignore */ }
    else copyLink();
  }

  if (err) return <Shell><div className="pt-20"><EmptyState title="Couldn't load this profile" body={err} /></div></Shell>;
  if (!data) return <Shell><div className="pt-20 max-w-xl mx-auto"><Skeleton className="aspect-[3/4] w-full" /></div></Shell>;

  const { user, repos } = data;
  const agg = aggregate(user, repos);
  const sc = score(user, agg).value;
  const r = rank(sc);
  const ach = achievements(user, repos, agg).slice(0, 4);
  const lang = primaryLanguage(repos);

  return (
    <Shell>
      <section className="pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">GitHub Wrapped</h1>
        <div className="flex gap-2">
          <button onClick={download} className="px-4 py-2 text-sm bg-foreground text-background hover:opacity-90 transition">Download PNG</button>
          <button onClick={copyLink} className="px-4 py-2 text-sm border border-border hover:border-foreground transition">{copied ? "✓ Copied" : "Copy link"}</button>
          <button onClick={share} className="px-4 py-2 text-sm border border-border hover:border-foreground transition">Share</button>
        </div>
      </section>

      <div className="max-w-xl mx-auto">
        <div ref={cardRef} className="bg-background border border-border p-10">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">GitWorth · Wrapped</p>
            <p className="font-mono text-xs text-muted-foreground">{new Date().getFullYear()}</p>
          </div>

          <img src={user.avatar_url} alt={user.login} crossOrigin="anonymous" className="mt-8 w-20 h-20 rounded-full border border-border" />
          <p className="mt-5 text-2xl font-semibold tracking-tight">{user.name ?? user.login}</p>
          <p className="font-mono text-sm text-muted-foreground">@{user.login}</p>

          <div className="mt-8 border-t border-b border-border py-6">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">GitWorth Score</p>
            <p className="mt-2 text-6xl font-semibold tracking-tight tabular-nums">{sc.toLocaleString()}</p>
            <p className="mt-2 font-mono text-sm">{r.percentile} worldwide · {r.tier}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            <Stat l="Followers" v={user.followers.toLocaleString()} />
            <Stat l="Repos" v={user.public_repos.toLocaleString()} />
            <Stat l="Total stars" v={agg.stars.toLocaleString()} />
            <Stat l="Years on GitHub" v={agg.ageYears.toFixed(1)} />
            <Stat l="Top language" v={lang ?? "—"} />
            <Stat l="Global rank" v={`#${r.globalRank.toLocaleString()}`} />
          </div>

          {ach.length > 0 && (
            <div className="mt-6 border-t border-border pt-5">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">Achievements</p>
              <div className="flex flex-wrap gap-2">
                {ach.map(a => (
                  <span key={a.id} className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1 text-xs">
                    <span>{a.emoji}</span>{a.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="mt-8 font-mono text-[10px] text-muted-foreground text-center tracking-wider">gitworth.app</p>
        </div>

        <p className="mt-6 text-sm text-center">
          <Link to="/u/$username" params={{username:user.login}} className="text-muted-foreground hover:text-foreground transition">← full profile</Link>
        </p>
      </div>
    </Shell>
  );
}

function Stat({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{l}</p>
      <p className="mt-1 text-base font-semibold tabular-nums">{v}</p>
    </div>
  );
}
