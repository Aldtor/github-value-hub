import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitWorth — What is your GitHub worth?" },
      { name: "description", content: "Look up any GitHub profile and get a fun dollar valuation based on followers, repos, and stars." },
      { property: "og:title", content: "GitWorth — What is your GitHub worth?" },
      { property: "og:description", content: "Look up any GitHub profile and get a fun dollar valuation." },
    ],
  }),
  component: Index,
});

type GhUser = {
  login: string; name: string | null; avatar_url: string; html_url: string;
  bio: string | null; company: string | null; location: string | null;
  blog: string | null; twitter_username: string | null; email: string | null;
  public_repos: number; public_gists: number; followers: number; following: number;
  created_at: string; updated_at: string;
};
type Repo = { stargazers_count: number; forks_count: number; language: string | null; fork: boolean };

function valuate(u: GhUser, repos: Repo[]) {
  const stars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const forks = repos.reduce((s, r) => s + r.forks_count, 0);
  const original = repos.filter(r => !r.fork).length;
  const ageYears = (Date.now() - new Date(u.created_at).getTime()) / (365.25 * 24 * 3600 * 1000);
  const value =
    u.followers * 12 +
    u.following * 0.5 +
    stars * 7 +
    forks * 4 +
    original * 15 +
    u.public_gists * 3 +
    ageYears * 50;
  return { value: Math.round(value), stars, forks, original, ageYears };
}

function Index() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<GhUser | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof valuate> | null>(null);
  const [topLangs, setTopLangs] = useState<[string, number][]>([]);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const u = username.trim();
    if (!u) return;
    setLoading(true); setError(null); setUser(null); setStats(null);
    try {
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}`);
      if (!userRes.ok) throw new Error(userRes.status === 404 ? "User not found" : "GitHub API error");
      const userData: GhUser = await userRes.json();
      const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}/repos?per_page=100&sort=updated`);
      const reposData: Repo[] = reposRes.ok ? await reposRes.json() : [];
      const langCount = new Map<string, number>();
      reposData.forEach(r => { if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1); });
      setTopLangs([...langCount.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5));
      setUser(userData);
      setStats(valuate(userData, reposData));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 20% 10%, oklch(0.82 0.18 145 / 0.25), transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.75 0.18 65 / 0.2), transparent 45%)" }} />

      <header className="max-w-5xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-sm tracking-tight">
          <span className="inline-block w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />
          <span className="text-muted-foreground">git</span><span className="font-bold">worth</span>
        </div>
        <a href="https://github.com" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition">powered by GitHub API</a>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-20">
        <section className="text-center pt-12 pb-10">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            What's your <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>GitHub</span> worth?
          </h1>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto text-lg">
            Drop any GitHub username. Get the full profile, the stats, and a totally unscientific dollar valuation.
          </p>

          <form onSubmit={lookup} className="mt-10 max-w-xl mx-auto flex gap-2">
            <div className="flex-1 flex items-center bg-input rounded-lg border border-border focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_oklch(0.82_0.18_145/0.15)] transition">
              <span className="pl-4 text-muted-foreground font-mono">@</span>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="torvalds"
                className="flex-1 bg-transparent px-2 py-3 outline-none font-mono"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundImage: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}
            >
              {loading ? "..." : "Appraise"}
            </button>
          </form>

          {error && <p className="mt-6 text-destructive font-mono text-sm">! {error}</p>}
        </section>

        {user && stats && (
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
                  ${stats.value.toLocaleString()}
                </p>
                <p className="mt-3 text-xs text-muted-foreground font-mono">
                  followers×12 + stars×7 + forks×4 + original repos×15 + age×50
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Followers" value={user.followers} />
                <Stat label="Following" value={user.following} />
                <Stat label="Repos" value={user.public_repos} />
                <Stat label="Gists" value={user.public_gists} />
                <Stat label="Stars" value={stats.stars} />
                <Stat label="Forks" value={stats.forks} />
                <Stat label="Original" value={stats.original} />
                <Stat label="Years" value={stats.ageYears.toFixed(1)} />
              </div>

              {topLangs.length > 0 && (
                <div className="p-6 rounded-2xl border border-border" style={{ background: "var(--gradient-card)" }}>
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
            </div>
          </section>
        )}

        {!user && !loading && (
          <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
            try: torvalds · gaearon · sindresorhus · tj
          </p>
        )}
      </main>
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
