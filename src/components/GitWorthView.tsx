import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";

export type GhUser = {
  login: string; name: string | null; avatar_url: string; html_url: string;
  bio: string | null; company: string | null; location: string | null;
  blog: string | null; twitter_username: string | null; email: string | null;
  public_repos: number; public_gists: number; followers: number; following: number;
  created_at: string; updated_at: string;
};
export type Repo = {
  name: string; stargazers_count: number; forks_count: number;
  language: string | null; fork: boolean; created_at: string;
};
export type Weights = {
  followers: number; following: number; stars: number; forks: number;
  originalRepos: number; gists: number; ageYears: number;
};

export const DEFAULT_WEIGHTS: Weights = {
  followers: 8, following: 0.1, stars: 4, forks: 2,
  originalRepos: 2, gists: 0.5, ageYears: 5,
};

const WEIGHT_META: { key: keyof Weights; label: string; max: number; step: number }[] = [
  { key: "followers", label: "Followers", max: 50, step: 0.5 },
  { key: "stars", label: "Stars", max: 50, step: 0.5 },
  { key: "forks", label: "Forks", max: 50, step: 0.5 },
  { key: "originalRepos", label: "Original repos", max: 100, step: 1 },
  { key: "ageYears", label: "Age (years)", max: 200, step: 1 },
  { key: "gists", label: "Gists", max: 50, step: 0.5 },
  { key: "following", label: "Following", max: 10, step: 0.1 },
];

function aggregate(u: GhUser, repos: Repo[]) {
  const stars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const forks = repos.reduce((s, r) => s + r.forks_count, 0);
  const original = repos.filter(r => !r.fork).length;
  const ageYears = (Date.now() - new Date(u.created_at).getTime()) / (365.25 * 24 * 3600 * 1000);
  return { stars, forks, original, ageYears };
}

function valuate(u: GhUser, a: ReturnType<typeof aggregate>, w: Weights) {
  const parts = {
    followers: u.followers * w.followers,
    following: u.following * w.following,
    stars: a.stars * w.stars,
    forks: a.forks * w.forks,
    originalRepos: a.original * w.originalRepos,
    gists: u.public_gists * w.gists,
    ageYears: a.ageYears * w.ageYears,
  };
  return { value: Math.round(Object.values(parts).reduce((s, v) => s + v, 0)), parts };
}

function buildGrowthSeries(u: GhUser, repos: Repo[]) {
  const sorted = [...repos].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const byYear = new Map<number, { stars: number; repos: number }>();
  const startYear = new Date(u.created_at).getFullYear();
  const endYear = new Date().getFullYear();
  for (let y = startYear; y <= endYear; y++) byYear.set(y, { stars: 0, repos: 0 });
  for (const r of sorted) {
    const y = new Date(r.created_at).getFullYear();
    const cur = byYear.get(y) ?? { stars: 0, repos: 0 };
    cur.stars += r.stargazers_count; cur.repos += 1;
    byYear.set(y, cur);
  }
  let cumStars = 0, cumRepos = 0;
  const points: { year: number; stars: number; repos: number }[] = [];
  for (const [year, v] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    cumStars += v.stars; cumRepos += v.repos;
    points.push({ year, stars: cumStars, repos: cumRepos });
  }
  const maxStars = cumStars || 1;
  return points.map(p => ({ ...p, followersEst: Math.round((p.stars / maxStars) * u.followers) }));
}

export function GitWorthView({ initialUsername = "", autoFetch = false, showSearch = true }:
  { initialUsername?: string; autoFetch?: boolean; showSearch?: boolean }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState(initialUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<GhUser | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [topLangs, setTopLangs] = useState<[string, number][]>([]);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [copied, setCopied] = useState(false);

  const agg = useMemo(() => (user ? aggregate(user, repos) : null), [user, repos]);
  const val = useMemo(() => (user && agg ? valuate(user, agg, weights) : null), [user, agg, weights]);
  const growth = useMemo(() => (user ? buildGrowthSeries(user, repos) : []), [user, repos]);

  async function doLookup(name: string) {
    const u = name.trim();
    if (!u) return;
    setLoading(true); setError(null); setUser(null); setRepos([]);
    try {
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}`);
      if (!userRes.ok) throw new Error(userRes.status === 404 ? "User not found" : "GitHub API error");
      const userData: GhUser = await userRes.json();
      const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}/repos?per_page=100&sort=updated`);
      const reposData: Repo[] = reposRes.ok ? await reposRes.json() : [];
      const langCount = new Map<string, number>();
      reposData.forEach(r => { if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1); });
      setTopLangs([...langCount.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5));
      setUser(userData); setRepos(reposData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (autoFetch && initialUsername) doLookup(initialUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUsername, autoFetch]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const u = username.trim();
    if (!u) return;
    navigate({ to: "/u/$username", params: { username: u } });
  }

  async function shareLink() {
    if (!user) return;
    const url = `${window.location.origin}/u/${encodeURIComponent(user.login)}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt("Copy link:", url); }
  }

  function exportPDF() {
    if (!user || !agg || !val) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    let y = 56;
    doc.setFont("helvetica", "bold"); doc.setFontSize(22);
    doc.text("GitWorth Report", 40, y); y += 28;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(110);
    doc.text(`Generated ${new Date().toLocaleString()}`, 40, y); y += 24;
    doc.setTextColor(20); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text(`${user.name ?? user.login} (@${user.login})`, 40, y); y += 18;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    if (user.bio) { const lines = doc.splitTextToSize(user.bio, W - 80); doc.text(lines, 40, y); y += lines.length * 14 + 4; }
    const info: [string, string][] = [
      ["Profile", user.html_url], ["Company", user.company ?? "—"],
      ["Location", user.location ?? "—"], ["Blog", user.blog || "—"],
      ["Joined", new Date(user.created_at).toLocaleDateString()],
    ];
    info.forEach(([k, v]) => { doc.setFont("helvetica","bold"); doc.text(`${k}:`, 40, y); doc.setFont("helvetica","normal"); doc.text(String(v), 110, y); y += 16; });
    y += 8; doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("Estimated value", 40, y); y += 22;
    doc.setFontSize(28); doc.text(`$${val.value.toLocaleString()}`, 40, y); y += 26;
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text("Breakdown (input × weight = contribution):", 40, y); y += 16;
    const rows: [string, string][] = [
      ["Followers", `${user.followers} × ${weights.followers} = $${Math.round(val.parts.followers).toLocaleString()}`],
      ["Following", `${user.following} × ${weights.following} = $${Math.round(val.parts.following).toLocaleString()}`],
      ["Stars", `${agg.stars} × ${weights.stars} = $${Math.round(val.parts.stars).toLocaleString()}`],
      ["Forks", `${agg.forks} × ${weights.forks} = $${Math.round(val.parts.forks).toLocaleString()}`],
      ["Original repos", `${agg.original} × ${weights.originalRepos} = $${Math.round(val.parts.originalRepos).toLocaleString()}`],
      ["Gists", `${user.public_gists} × ${weights.gists} = $${Math.round(val.parts.gists).toLocaleString()}`],
      ["Account age (yrs)", `${agg.ageYears.toFixed(1)} × ${weights.ageYears} = $${Math.round(val.parts.ageYears).toLocaleString()}`],
    ];
    rows.forEach(([k, v]) => { doc.setFont("helvetica","bold"); doc.text(k, 40, y); doc.setFont("helvetica","normal"); doc.text(v, 180, y); y += 15; });
    y += 10; doc.setFont("helvetica","bold"); doc.setFontSize(14);
    doc.text("Growth over time", 40, y); y += 18;
    doc.setFont("helvetica","normal"); doc.setFontSize(10);
    doc.text("Year   Cumulative stars   Cumulative repos   Followers (est.)", 40, y); y += 14;
    growth.forEach(p => {
      if (y > 780) { doc.addPage(); y = 56; }
      doc.text(`${p.year}      ${p.stars}                ${p.repos}                ${p.followersEst}`, 40, y); y += 13;
    });
    doc.save(`gitworth-${user.login}.pdf`);
  }

  return (
    <>
      {showSearch && (
        <section className="text-center pt-12 pb-10">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            What's your <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>GitHub</span> worth?
          </h1>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto text-lg">
            Drop any GitHub username. See growth charts, tweak the formula, export a PDF, share the link.
          </p>
          <form onSubmit={onSubmit} className="mt-10 max-w-xl mx-auto flex gap-2">
            <div className="flex-1 flex items-center bg-input rounded-lg border border-border focus-within:border-primary/60 transition">
              <span className="pl-4 text-muted-foreground font-mono">@</span>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="torvalds"
                className="flex-1 bg-transparent px-2 py-3 outline-none font-mono" autoFocus />
            </div>
            <button type="submit" disabled={loading}
              className="px-6 py-3 rounded-lg font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundImage: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}>
              {loading ? "..." : "Appraise"}
            </button>
          </form>
          {error && <p className="mt-6 text-destructive font-mono text-sm">! {error}</p>}
        </section>
      )}

      {!showSearch && loading && <p className="text-center mt-12 text-muted-foreground font-mono">Loading @{initialUsername}…</p>}
      {!showSearch && error && (
        <div className="text-center mt-12">
          <p className="text-destructive font-mono">! {error}</p>
          <Link to="/" className="inline-block mt-4 text-primary hover:underline text-sm">← back to home</Link>
        </div>
      )}

      {user && agg && val && (
        <section className="grid md:grid-cols-3 gap-5 mt-6 animate-in fade-in duration-500">
          <div className="md:col-span-1 p-6 rounded-2xl border border-border" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}>
            <img src={user.avatar_url} alt={user.login} className="w-28 h-28 rounded-full border-2 border-primary/40" />
            <h2 className="mt-4 text-2xl font-bold">{user.name ?? user.login}</h2>
            <a href={user.html_url} target="_blank" rel="noreferrer" className="text-primary font-mono text-sm hover:underline">@{user.login}</a>
            {user.bio && <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>}
            <ul className="mt-5 space-y-2 text-sm">
              {user.company && <Info label="Company" value={user.company} />}
              {user.location && <Info label="Location" value={user.location} />}
              {user.blog && <Info label="Blog" value={user.blog} link />}
              {user.twitter_username && <Info label="Twitter" value={`@${user.twitter_username}`} />}
              {user.email && <Info label="Email" value={user.email} />}
              <Info label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
            </ul>
          </div>

          <div className="md:col-span-2 flex flex-col gap-5">
            <div className="p-8 rounded-2xl border border-primary/30 text-center relative overflow-hidden"
              style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-glow)" }}>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Estimated value</p>
              <p className="mt-3 text-6xl md:text-7xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
                ${val.value.toLocaleString()}
              </p>
              <p className="mt-3 text-xs text-muted-foreground font-mono">
                followers×{weights.followers} + stars×{weights.stars} + forks×{weights.forks} + repos×{weights.originalRepos} + age×{weights.ageYears} + …
              </p>
              <p className="mt-2 text-[11px] text-accent/90 max-w-md mx-auto">
                ⚠ Just for fun — not a real market price. A made-up score from public GitHub stats.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button onClick={shareLink}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25 transition">
                  {copied ? "✓ Link copied!" : "🔗 Copy share link"}
                </button>
                <button onClick={exportPDF}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
                  style={{ backgroundImage: "var(--gradient-hero)" }}>
                  ↓ Export PDF
                </button>
                <button onClick={() => setWeights(DEFAULT_WEIGHTS)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-secondary border border-border hover:bg-muted transition">
                  Reset weights
                </button>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground font-mono break-all">
                share: /u/{user.login}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Followers" value={user.followers} />
              <Stat label="Following" value={user.following} />
              <Stat label="Repos" value={user.public_repos} />
              <Stat label="Gists" value={user.public_gists} />
              <Stat label="Stars" value={agg.stars} />
              <Stat label="Forks" value={agg.forks} />
              <Stat label="Original" value={agg.original} />
              <Stat label="Years" value={agg.ageYears.toFixed(1)} />
            </div>
          </div>

          <div className="md:col-span-3 grid md:grid-cols-2 gap-5">
            <ChartCard title="Cumulative stars">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={growth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="starGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.82 0.18 145)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.82 0.18 145)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.025 260)" />
                  <XAxis dataKey="year" stroke="oklch(0.68 0.02 255)" fontSize={11} />
                  <YAxis stroke="oklch(0.68 0.02 255)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.21 0.025 260)", border: "1px solid oklch(0.3 0.025 260)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="stars" stroke="oklch(0.82 0.18 145)" fill="url(#starGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Followers growth (estimated)">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={growth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.025 260)" />
                  <XAxis dataKey="year" stroke="oklch(0.68 0.02 255)" fontSize={11} />
                  <YAxis stroke="oklch(0.68 0.02 255)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.21 0.025 260)", border: "1px solid oklch(0.3 0.025 260)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="followersEst" stroke="oklch(0.75 0.18 65)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="repos" stroke="oklch(0.6 0.12 260)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                Historical followers aren't exposed by GitHub — modeled from cumulative stars scaled to current ({user.followers}). Blue line: repos.
              </p>
            </ChartCard>
          </div>

          <div className="md:col-span-3 p-6 rounded-2xl border border-border" style={{ background: "var(--gradient-card)" }}>
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-lg font-bold">Valuation formula — tweak the weights</h3>
              <span className="text-xs text-muted-foreground font-mono">live updates ↑</span>
            </div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
              {WEIGHT_META.map(({ key, label, max, step }) => {
                const w = weights[key]; const contribution = Math.round(val.parts[key]);
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{label}</span>
                      <span className="font-mono text-muted-foreground">
                        ×<span className="text-foreground">{w}</span> = <span className="text-primary">${contribution.toLocaleString()}</span>
                      </span>
                    </div>
                    <input type="range" min={0} max={max} step={step} value={w}
                      onChange={e => setWeights(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-full accent-[oklch(0.82_0.18_145)]" />
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-border font-mono text-xs text-muted-foreground leading-relaxed">
              value = followers×{weights.followers} + following×{weights.following} + stars×{weights.stars} + forks×{weights.forks}
              {" + "}original_repos×{weights.originalRepos} + gists×{weights.gists} + age_years×{weights.ageYears}
            </div>
          </div>

          {topLangs.length > 0 && (
            <div className="md:col-span-3 p-6 rounded-2xl border border-border" style={{ background: "var(--gradient-card)" }}>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Top languages</p>
              <div className="flex flex-wrap gap-2">
                {topLangs.map(([lang, n]) => (
                  <span key={lang} className="px-3 py-1 rounded-full text-sm bg-secondary border border-border font-mono">
                    {lang} <span className="text-muted-foreground">×{n}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {showSearch && !user && !loading && (
        <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
          try: torvalds · gaearon · sindresorhus · tj
        </p>
      )}
    </>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl border border-border" style={{ background: "var(--gradient-card)" }}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}

function Info({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <li className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      {link ? (
        <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[60%]">{value}</a>
      ) : (
        <span className="truncate max-w-[60%] text-right">{value}</span>
      )}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-4 rounded-xl border border-border" style={{ background: "var(--gradient-card)" }}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1 font-mono">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}
