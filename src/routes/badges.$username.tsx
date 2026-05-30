import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { fetchProfile } from "@/lib/github";
import { aggregate, score, rank } from "@/lib/gitworth";
import type { GhUser, Repo } from "@/components/GitWorthView";
import { Skeleton, EmptyState } from "@/components/ui-bits";

export const Route = createFileRoute("/badges/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `Embed @${params.username}'s GitWorth badge` },
      { name: "description", content: `Copy a markdown or HTML snippet to embed @${params.username}'s GitWorth score in any README or website.` },
      { property: "og:title", content: `Embed @${params.username}'s GitWorth badge` },
      { property: "og:description", content: `Markdown & HTML badge snippets.` },
      { property: "og:url", content: `/badges/${params.username}` },
    ],
    links: [{ rel: "canonical", href: `/badges/${params.username}` }],
  }),
  component: Badges,
});

function Badges() {
  const { username } = Route.useParams();
  const [data, setData] = useState<{ user: GhUser; repos: Repo[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { fetchProfile(username).then(setData).catch(e => setErr(e.message)); }, [username]);

  if (err) return <Shell><div className="pt-20"><EmptyState title="Couldn't load profile" body={err} /></div></Shell>;
  if (!data) return <Shell><div className="pt-20 space-y-3"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-24 w-full" /></div></Shell>;

  const { user, repos } = data;
  const agg = aggregate(user, repos);
  const sc = score(user, agg).value;
  const r = rank(sc);
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/u/${username}` : `/u/${username}`;

  const scoreBadge = `https://img.shields.io/badge/GitWorth-${sc.toLocaleString()}-000?style=flat-square&labelColor=000&color=fff`;
  const rankBadge = `https://img.shields.io/badge/Rank-${encodeURIComponent(r.percentile.replace(/\s+/g, "_"))}-000?style=flat-square&labelColor=000&color=fff`;
  const tierBadge = `https://img.shields.io/badge/Tier-${encodeURIComponent(r.tier)}-000?style=flat-square&labelColor=000&color=fff`;

  const examples = [
    { label: "GitWorth Score", img: scoreBadge },
    { label: "Global Rank", img: rankBadge },
    { label: "Tier", img: tierBadge },
  ];

  return (
    <Shell>
      <section className="pt-16 pb-8">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">Embed</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">@{user.login}'s badges</h1>
        <p className="mt-4 text-muted-foreground max-w-xl">
          Drop these in your GitHub README, portfolio, or anywhere markdown is supported.
        </p>
      </section>

      <section className="space-y-8">
        {examples.map(({ label, img }) => {
          const md = `[![${label}](${img})](${profileUrl})`;
          const html = `<a href="${profileUrl}"><img src="${img}" alt="${label}" /></a>`;
          return (
            <div key={label} className="border border-border p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{label}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={label} />
              </div>
              <Snippet label="Markdown" code={md} />
              <Snippet label="HTML" code={html} />
            </div>
          );
        })}
      </section>

      <div className="mt-12 text-sm">
        <Link to="/u/$username" params={{username}} className="text-muted-foreground hover:text-foreground transition">← back to profile</Link>
      </div>
    </Shell>
  );
}

function Snippet({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1500); } catch { /* ignore */ }
  }
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
        <button onClick={copy} className="font-mono text-xs hover:underline underline-offset-4">{copied ? "✓ copied" : "copy"}</button>
      </div>
      <pre className="mt-2 bg-secondary p-3 text-xs font-mono overflow-x-auto whitespace-pre">{code}</pre>
    </div>
  );
}
