import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import { fetchProfile } from "@/lib/github";
import { rank as rankFn, strength as strengthFn, achievements as achievementsFn } from "@/lib/gitworth";

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
      const { user: userData, repos: reposData } = await fetchProfile(u);
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
        <section className="pt-24 md:pt-32 pb-16">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
            What's your GitHub worth?
          </h1>
          <p className="mt-5 text-muted-foreground max-w-xl text-lg leading-relaxed">
            Type a username. Get a profile summary, growth charts, an editable formula,
            a share link, and a PDF.
          </p>
          <form onSubmit={onSubmit} className="mt-10 max-w-xl flex gap-3">
            <div className="flex-1 flex items-center border-b border-border focus-within:border-foreground transition">
              <span className="text-muted-foreground font-mono text-base">@</span>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="torvalds"
                className="flex-1 bg-transparent px-2 py-3 outline-none font-mono text-base placeholder:text-muted-foreground/50" autoFocus />
            </div>
            <button type="submit" disabled={loading}
              className="px-5 py-3 text-sm font-medium bg-foreground text-background hover:opacity-90 transition disabled:opacity-50">
              {loading ? "…" : "Appraise"}
            </button>
          </form>
          {error && <p className="mt-5 text-destructive font-mono text-sm">! {error}</p>}
          {!user && !loading && (
            <p className="mt-6 text-sm text-muted-foreground">
              <span className="font-mono">try</span>{" "}
              {["torvalds","gaearon","sindresorhus","tj"].map((name, i) => (
                <span key={name}>
                  {i > 0 && <span className="text-muted-foreground/40 mx-1.5">·</span>}
                  <button type="button" onClick={() => { setUsername(name); navigate({ to: "/u/$username", params: { username: name } }); }}
                    className="font-mono hover:text-foreground transition underline-offset-4 hover:underline">
                    @{name}
                  </button>
                </span>
              ))}
            </p>
          )}
        </section>
      )}

      {!showSearch && loading && (
        <div className="text-center mt-24 flex flex-col items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-muted border-t-foreground animate-spin" />
          <p className="text-muted-foreground font-mono text-sm">loading @{initialUsername}…</p>
        </div>
      )}
      {!showSearch && error && (
        <div className="text-center mt-24">
          <p className="text-destructive font-mono">! {error}</p>
          <Link to="/" className="inline-block mt-4 hover:underline text-sm">← back</Link>
        </div>
      )}

      {user && agg && val && (
        <section className="grid md:grid-cols-3 gap-8 md:gap-10 mt-10">
          <div className="md:col-span-1">
            <img src={user.avatar_url} alt={user.login} className="w-24 h-24 rounded-full border border-border" />
            <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-tight">{user.name ?? user.login}</h2>
            <a href={user.html_url} target="_blank" rel="noreferrer" className="font-mono text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4">@{user.login}</a>
            {user.bio && <p className="mt-4 text-[15px] text-muted-foreground leading-relaxed">{user.bio}</p>}
            <ul className="mt-6 space-y-2.5 text-sm border-t border-border pt-5">
              {user.company && <Info label="Company" value={user.company} />}
              {user.location && <Info label="Location" value={user.location} />}
              {user.blog && <Info label="Blog" value={user.blog} link />}
              {user.twitter_username && <Info label="Twitter" value={`@${user.twitter_username}`} />}
              {user.email && <Info label="Email" value={user.email} />}
              <Info label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
            </ul>
          </div>

          <div className="md:col-span-2 flex flex-col gap-10">
            <div>
              <p className="text-xs text-muted-foreground font-mono">Estimated value</p>
              <p key={val.value} className="mt-2 text-6xl md:text-7xl font-semibold tracking-tight leading-none">
                ${val.value.toLocaleString()}
              </p>
              <p className="mt-4 text-sm text-muted-foreground font-mono leading-relaxed">
                followers×{weights.followers} + stars×{weights.stars} + forks×{weights.forks} + repos×{weights.originalRepos} + age×{weights.ageYears} + …
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                A made-up score from public GitHub stats — not a real market price.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={shareLink}
                  className="px-4 py-2 text-sm border border-border hover:border-foreground transition">
                  {copied ? "✓ Copied" : "Copy share link"}
                </button>
                <button onClick={exportPDF}
                  className="px-4 py-2 text-sm bg-foreground text-background hover:opacity-90 transition">
                  Export PDF
                </button>
                <button onClick={() => setWeights(DEFAULT_WEIGHTS)}
                  className="px-4 py-2 text-sm border border-border hover:border-foreground transition">
                  Reset weights
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 border-t border-border pt-6">
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

          <div className="md:col-span-3 grid md:grid-cols-2 gap-10 border-t border-border pt-10">
            <ChartCard title="Cumulative stars">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={growth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="starGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.22 0 0)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="oklch(0.22 0 0)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.94 0 0)" />
                  <XAxis dataKey="year" stroke="oklch(0.55 0 0)" fontSize={11} />
                  <YAxis stroke="oklch(0.55 0 0)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.92 0 0)", borderRadius: 4, fontSize: 12 }} />
                  <Area type="monotone" dataKey="stars" stroke="oklch(0.22 0 0)" fill="url(#starGrad)" strokeWidth={1.75} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Followers growth (estimated)">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={growth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.94 0 0)" />
                  <XAxis dataKey="year" stroke="oklch(0.55 0 0)" fontSize={11} />
                  <YAxis stroke="oklch(0.55 0 0)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.92 0 0)", borderRadius: 4, fontSize: 12 }} />
                  <Line type="monotone" dataKey="followersEst" stroke="oklch(0.22 0 0)" strokeWidth={1.75} dot={false} />
                  <Line type="monotone" dataKey="repos" stroke="oklch(0.55 0 0)" strokeWidth={1.25} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                GitHub doesn't expose historical followers — modeled from cumulative stars, scaled to current ({user.followers}). Dashed line: repos.
              </p>
            </ChartCard>
          </div>

          <div className="md:col-span-3 border-t border-border pt-10">
            <h3 className="text-xl font-semibold tracking-tight">Tweak the formula</h3>
            <p className="mt-1 text-sm text-muted-foreground">Drag any weight — the value updates live.</p>
            <div className="mt-8 grid md:grid-cols-2 gap-x-10 gap-y-6">
              {WEIGHT_META.map(({ key, label, max, step }) => {
                const w = weights[key]; const contribution = Math.round(val.parts[key]);
                return (
                  <div key={key}>
                    <div className="flex justify-between items-baseline text-sm mb-2">
                      <span>{label}</span>
                      <span className="font-mono text-muted-foreground text-xs">
                        ×<span className="text-foreground">{w}</span> = <span className="text-foreground">${contribution.toLocaleString()}</span>
                      </span>
                    </div>
                    <input type="range" min={0} max={max} step={step} value={w}
                      onChange={e => setWeights(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-full accent-foreground" />
                  </div>
                );
              })}
            </div>
            <p className="mt-8 pt-5 border-t border-border font-mono text-xs text-muted-foreground leading-relaxed break-words">
              <span className="text-foreground">value</span> = followers×{weights.followers} + following×{weights.following} + stars×{weights.stars} + forks×{weights.forks}
              {" + "}original_repos×{weights.originalRepos} + gists×{weights.gists} + age_years×{weights.ageYears}
            </p>
          </div>

          {topLangs.length > 0 && (
            <div className="md:col-span-3 border-t border-border pt-8">
              <p className="text-sm text-muted-foreground mb-3">Top languages</p>
              <p className="font-mono text-sm leading-relaxed">
                {topLangs.map(([lang, n], i) => (
                  <span key={lang}>
                    {i > 0 && <span className="text-muted-foreground/40 mx-2">·</span>}
                    {lang} <span className="text-muted-foreground">×{n}</span>
                  </span>
                ))}
              </p>
            </div>
          )}
        </section>
      )}
    </>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{title}</p>
      {children}
    </div>
  );
}


function Info({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <li className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      {link ? (
        <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-[60%]">{value}</a>
      ) : (
        <span className="truncate max-w-[60%] text-right">{value}</span>
      )}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight mt-1 tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}
