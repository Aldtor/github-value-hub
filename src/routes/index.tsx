import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitWorth — Discover your GitHub value" },
      { name: "description", content: "Analyze repositories, followers, stars, and contributions. Compare with developers worldwide and see where you rank." },
      { property: "og:title", content: "GitWorth — Discover your GitHub value" },
      { property: "og:description", content: "Score, rank, compare, and share your GitHub profile." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Landing() {
  const [u, setU] = useState("");
  return (
    <Shell>
      {/* Hero */}
      <section className="pt-20 md:pt-28 pb-20">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">A developer appraisal tool</p>
        <h1 className="mt-4 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] max-w-3xl">
          Discover your <span className="underline decoration-2 underline-offset-[10px]">GitHub value</span>.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          Analyze repositories, followers, stars and contributions — then compare yourself with developers worldwide.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); const v = u.trim(); if (v) window.location.assign(`/u/${encodeURIComponent(v)}`); }}
          className="mt-10 flex max-w-xl gap-3"
        >
          <div className="flex-1 flex items-center border border-border focus-within:border-foreground transition px-3">
            <span className="text-muted-foreground font-mono">@</span>
            <input
              autoFocus value={u} onChange={(e) => setU(e.target.value)} placeholder="your-github-username"
              className="flex-1 bg-transparent px-2 py-3 outline-none font-mono text-base placeholder:text-muted-foreground/50"
            />
          </div>
          <button className="px-6 py-3 text-sm font-medium bg-foreground text-background hover:opacity-90 transition">
            Analyze profile
          </button>
        </form>
        <p className="mt-5 text-sm text-muted-foreground">
          <span className="font-mono">try </span>
          {["torvalds","gaearon","sindresorhus","tj"].map((n,i)=>(
            <span key={n}>
              {i>0 && <span className="text-muted-foreground/40 mx-1.5">·</span>}
              <Link to="/u/$username" params={{username:n}} className="font-mono hover:text-foreground underline-offset-4 hover:underline">@{n}</Link>
            </span>
          ))}
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-border py-16 grid md:grid-cols-3 gap-10">
        {[
          { t: "Score & rank", b: "Get a transparent GitWorth Score and see where you rank globally." },
          { t: "Side-by-side compare", b: "Pick any two devs and see who wins each category." },
          { t: "Shareable wrapped", b: "Download a poster-style yearly summary as PNG." },
          { t: "Achievements", b: "Earn badges for milestones — Builder, Polyglot, Veteran, more." },
          { t: "Embed badges", b: "Drop a GitWorth badge in your README or portfolio." },
          { t: "Tweakable formula", b: "Adjust the weights, the score recalculates live." },
        ].map(f => (
          <div key={f.t}>
            <p className="font-medium">{f.t}</p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.b}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="border-t border-border py-16">
        <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-10">
          {[
            ["01","Enter a username","We pull public profile data from the GitHub REST API."],
            ["02","We score it","Followers, stars, forks, repos and account age are weighted into one number."],
            ["03","Share or compare","Send the link, embed the badge, or stack two profiles side-by-side."],
          ].map(([n,t,b]) => (
            <div key={n}>
              <p className="font-mono text-xs text-muted-foreground">{n}</p>
              <p className="mt-2 font-medium">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Previews */}
      <section className="border-t border-border py-16 grid md:grid-cols-2 gap-10">
        <PreviewCard title="Leaderboard" to="/leaderboard" desc="Featured developers ranked by GitWorth.">
          <div className="text-sm divide-y divide-border">
            {[["1","🥇","torvalds","98,420"],["2","🥈","gaearon","42,180"],["3","🥉","sindresorhus","38,900"]].map(([r,m,n,s]) => (
              <div key={r} className="flex items-center gap-3 py-2">
                <span className="font-mono text-xs text-muted-foreground w-4">{r}</span>
                <span>{m}</span>
                <span className="font-mono flex-1">@{n}</span>
                <span className="font-mono tabular-nums">{s}</span>
              </div>
            ))}
          </div>
        </PreviewCard>
        <PreviewCard title="Compare two devs" to="/compare" desc="Head-to-head on every stat that matters.">
          <div className="grid grid-cols-3 text-sm font-mono">
            <span></span><span className="text-center">@torvalds</span><span className="text-center">@gaearon</span>
            {[["Followers","220k","85k"],["Stars","182k","94k"],["Repos","11","240"]].map(([l,a,b]) => (
              <>
                <span className="text-muted-foreground py-1.5">{l}</span>
                <span className="text-center py-1.5">{a}</span>
                <span className="text-center py-1.5">{b}</span>
              </>
            ))}
          </div>
        </PreviewCard>
      </section>

      {/* FAQ */}
      <section className="border-t border-border py-16">
        <h2 className="text-3xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-8">
          {[
            ["Is this a real valuation?","No. It's a playful score derived from public stats — fun, not financial."],
            ["Do you store my data?","Scan history lives only in your browser's localStorage."],
            ["Where does the data come from?","The public GitHub REST API. No login required."],
            ["Can I embed my score?","Yes — every profile page has an embeddable badge."],
            ["How is the rank calculated?","Score is bucketed against a calibrated distribution of public devs."],
            ["Is this free?","Yes. No ads, no signup."],
          ].map(([q,a]) => (
            <div key={q}>
              <p className="font-medium">{q}</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

function PreviewCard({ title, to, desc, children }: { title: string; to: "/leaderboard" | "/compare"; desc: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="block border border-border p-6 hover:border-foreground transition group">
      <div className="flex items-baseline justify-between">
        <p className="font-medium">{title}</p>
        <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition">view →</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      <div className="mt-5">{children}</div>
    </Link>
  );
}
