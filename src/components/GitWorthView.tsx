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

  async function loadAvatar(url: string, size = 256): Promise<string | null> {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      // circular clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(bmp, 0, 0, size, size);
      ctx.restore();
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  }

  async function exportPDF() {
    if (!user || !agg || !val) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 56;

    // Editorial palette — warm paper + deep ink + single accent
    const INK: [number, number, number] = [22, 22, 24];
    const SUB: [number, number, number] = [120, 118, 115];
    const RULE: [number, number, number] = [228, 224, 217];
    const PAPER: [number, number, number] = [250, 247, 241];
    const ACCENT: [number, number, number] = [201, 90, 56];   // burnt sienna (primary)
    const ACCENT2: [number, number, number] = [42, 76, 110];  // deep navy (secondary)
    const SOFT: [number, number, number] = [243, 238, 229];

    const setInk = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
    const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
    const setDraw = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);

    const r = rankFn(val.value);
    const st = strengthFn(val.value);
    const avatarData = await loadAvatar(user.avatar_url);

    let pageNum = 1;
    const drawPaper = () => {
      setFill(PAPER); doc.rect(0, 0, W, H, "F");
    };
    const drawChrome = () => {
      setDraw(RULE); doc.setLineWidth(0.5);
      doc.line(M, 44, W - M, 44);
      doc.line(M, H - 44, W - M, H - 44);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); setInk(INK);
      doc.text("GITWORTH", M, 36);
      doc.setFont("helvetica", "normal"); setInk(SUB);
      doc.text("DEVELOPER VALUATION", M + 56, 36);
      doc.text(new Date().toLocaleDateString(), W - M, 36, { align: "right" });
      doc.text(`@${user.login}`, M, H - 30);
      doc.text(`${String(pageNum).padStart(2, "0")}`, W - M, H - 30, { align: "right" });
    };
    const ensure = (need: number, y: number) => {
      if (y + need > H - 64) { doc.addPage(); pageNum++; drawPaper(); drawChrome(); return 80; }
      return y;
    };

    // ===== COVER =====
    drawPaper();
    drawChrome();

    // Avatar (top-right circle)
    const avSize = 96;
    const avX = W - M - avSize;
    const avY = 76;
    if (avatarData) {
      // soft ring
      setFill(SOFT); doc.circle(avX + avSize / 2, avY + avSize / 2, avSize / 2 + 4, "F");
      doc.addImage(avatarData, "PNG", avX, avY, avSize, avSize);
      setDraw(INK); doc.setLineWidth(1);
      doc.circle(avX + avSize / 2, avY + avSize / 2, avSize / 2, "S");
    }

    // Eyebrow
    setInk(ACCENT); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text("— A GITWORTH APPRAISAL", M, 96);

    // Display name (huge serif)
    setInk(INK); doc.setFont("times", "bold"); doc.setFontSize(54);
    const displayName = user.name ?? user.login;
    const nameLines = doc.splitTextToSize(displayName, W - M * 2 - avSize - 30);
    doc.text(nameLines, M, 150);
    let coverY = 150 + nameLines.length * 50;

    // Handle + profile link
    setInk(SUB); doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    doc.text(`@${user.login}`, M, coverY);
    setInk(ACCENT2); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    const link = user.html_url;
    doc.textWithLink(link, M, coverY + 16, { url: link });
    // underline link
    const linkW = doc.getTextWidth(link);
    setDraw(ACCENT2); doc.setLineWidth(0.5);
    doc.line(M, coverY + 18, M + linkW, coverY + 18);
    coverY += 36;

    // Subhead
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); setInk(SUB);
    const subhead = `An estimated market value for ${displayName}'s public GitHub presence, derived from followers, stars, repositories, and tenure.`;
    const subLines = doc.splitTextToSize(subhead, W - M * 2 - 40);
    doc.text(subLines, M, coverY);

    // Big number block
    let y = 360;
    setFill(INK); doc.rect(M, y, W - M * 2, 180, "F");
    setFill(ACCENT); doc.rect(M, y, 6, 180, "F");

    doc.setTextColor(220, 215, 205);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.text("ESTIMATED VALUE  ·  USD", M + 28, y + 30);

    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold"); doc.setFontSize(96);
    doc.text(`$${val.value.toLocaleString()}`, M + 28, y + 118);

    setFill(ACCENT); doc.rect(M + 28, y + 132, 40, 2, "F");

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.setTextColor(220, 215, 205);
    doc.text(`Tier ${st.tier.toUpperCase()}   ·   ${r.percentile.toUpperCase()}   ·   GLOBAL RANK ~${r.globalRank.toLocaleString()}`, M + 28, y + 158);

    y += 180 + 28;

    // Bio
    if (user.bio) {
      doc.setFont("times", "italic"); doc.setFontSize(12); setInk(INK);
      const lines = doc.splitTextToSize(`"${user.bio}"`, W - M * 2);
      doc.text(lines, M, y);
    }



    // ===== PAGE 2: BREAKDOWN =====
    doc.addPage(); pageNum++; drawPaper(); drawChrome();
    y = 88;

    // Section header
    setInk(ACCENT); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text("§ 01", M, y);
    setInk(INK); doc.setFont("times", "bold"); doc.setFontSize(32);
    doc.text("How the value is built.", M, y + 32);
    y += 56;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); setInk(SUB);
    doc.text("Each signal is weighted and converted to dollars. Bars below show relative contribution.", M, y);
    y += 28;

    // Contribution bars
    const parts: { label: string; value: number; raw: string; weight: string }[] = [
      { label: "Followers",      value: val.parts.followers,    raw: user.followers.toLocaleString(),  weight: `× ${weights.followers}` },
      { label: "Stars",          value: val.parts.stars,        raw: agg.stars.toLocaleString(),       weight: `× ${weights.stars}` },
      { label: "Original repos", value: val.parts.originalRepos,raw: agg.original.toLocaleString(),    weight: `× ${weights.originalRepos}` },
      { label: "Forks",          value: val.parts.forks,        raw: agg.forks.toLocaleString(),       weight: `× ${weights.forks}` },
      { label: "Account age",    value: val.parts.ageYears,     raw: `${agg.ageYears.toFixed(1)} yr`,  weight: `× ${weights.ageYears}` },
      { label: "Following",      value: val.parts.following,    raw: user.following.toLocaleString(),  weight: `× ${weights.following}` },
      { label: "Gists",          value: val.parts.gists,        raw: user.public_gists.toLocaleString(),weight: `× ${weights.gists}` },
    ];
    const maxVal = Math.max(1, ...parts.map(p => p.value));
    const barAreaW = W - M * 2;
    const labelW = 130;
    const valW = 90;
    const barW = barAreaW - labelW - valW - 20;

    parts.forEach((p) => {
      y = ensure(38, y);
      setInk(INK); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(p.label, M, y);
      doc.setFont("helvetica", "normal"); setInk(SUB); doc.setFontSize(9);
      doc.text(`${p.raw}  ${p.weight}`, M, y + 13);

      // bar track
      const bx = M + labelW;
      const by = y - 6;
      setFill(SOFT); doc.rect(bx, by, barW, 10, "F");
      const w = Math.max(1, (p.value / maxVal) * barW);
      setFill(ACCENT); doc.rect(bx, by, w, 10, "F");

      // value
      setInk(INK); doc.setFont("times", "bold"); doc.setFontSize(14);
      doc.text(`$${Math.round(p.value).toLocaleString()}`, W - M, y + 4, { align: "right" });
      y += 30;
    });

    // Total
    y = ensure(50, y);
    setDraw(INK); doc.setLineWidth(1.2); doc.line(M, y, W - M, y); y += 22;
    setInk(SUB); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text("TOTAL ESTIMATED VALUE", M, y);
    setInk(INK); doc.setFont("times", "bold"); doc.setFontSize(28);
    doc.text(`$${val.value.toLocaleString()}`, W - M, y + 6, { align: "right" });
    y += 36;

    // ===== PAGE 3: PROFILE + ACHIEVEMENTS =====
    doc.addPage(); pageNum++; drawPaper(); drawChrome();
    y = 88;

    setInk(ACCENT); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text("§ 02", M, y);
    setInk(INK); doc.setFont("times", "bold"); doc.setFontSize(32);
    doc.text("The developer.", M, y + 32);
    y += 70;

    // Two-column info
    const info: [string, string][] = [
      ["Profile",  user.html_url],
      ["Joined",   new Date(user.created_at).toLocaleDateString()],
      ["Company",  user.company ?? "—"],
      ["Location", user.location ?? "—"],
      ["Blog",     user.blog || "—"],
      ["Repos",    String(user.public_repos)],
    ];
    const colW = (W - M * 2) / 2;
    info.forEach((row, i) => {
      const cx = M + (i % 2) * colW;
      const cy = y + Math.floor(i / 2) * 28;
      setInk(SUB); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
      doc.text(row[0].toUpperCase(), cx, cy);
      setInk(INK); doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
      const v = doc.splitTextToSize(String(row[1]), colW - 20)[0];
      doc.text(v, cx, cy + 13);
    });
    y += Math.ceil(info.length / 2) * 28 + 24;

    // Achievements
    const ach = achievementsFn(user, repos, agg);
    if (ach.length) {
      y = ensure(80, y);
      setDraw(RULE); doc.setLineWidth(0.5); doc.line(M, y, W - M, y); y += 24;
      setInk(ACCENT); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text("§ 03", M, y);
      setInk(INK); doc.setFont("times", "bold"); doc.setFontSize(24);
      doc.text("Achievements.", M, y + 26);
      y += 52;

      ach.forEach((a) => {
        y = ensure(40, y);
        // numbered list, editorial
        setInk(ACCENT); doc.setFont("times", "bold"); doc.setFontSize(18);
        doc.text(a.label, M, y);
        setInk(SUB); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        doc.text(a.description, M, y + 15);
        setDraw(RULE); doc.setLineWidth(0.3); doc.line(M, y + 26, W - M, y + 26);
        y += 36;
      });
    }

    // ===== PAGE 4: GROWTH =====
    if (growth.length) {
      doc.addPage(); pageNum++; drawPaper(); drawChrome();
      y = 88;
      setInk(ACCENT); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text("§ 04", M, y);
      setInk(INK); doc.setFont("times", "bold"); doc.setFontSize(32);
      doc.text("Growth over time.", M, y + 32);
      y += 70;

      // Sparkline chart for stars
      const chartH = 160;
      const chartW = W - M * 2;
      const maxStars = Math.max(1, ...growth.map(g => g.stars));
      setFill(SOFT); doc.rect(M, y, chartW, chartH, "F");
      // baseline
      setDraw(RULE); doc.setLineWidth(0.5); doc.line(M, y + chartH, W - M, y + chartH);

      const step = growth.length > 1 ? chartW / (growth.length - 1) : 0;
      // area
      setFill(ACCENT);
      // draw bars
      const bw = Math.min(28, step * 0.6);
      growth.forEach((g, i) => {
        const h = (g.stars / maxStars) * (chartH - 30);
        const x = M + i * step - bw / 2 + (growth.length === 1 ? chartW / 2 : 0);
        doc.rect(x, y + chartH - h, bw, h, "F");
      });
      // year labels
      setInk(SUB); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      growth.forEach((g, i) => {
        const x = M + i * step + (growth.length === 1 ? chartW / 2 : 0);
        doc.text(String(g.year), x, y + chartH + 14, { align: "center" });
      });
      y += chartH + 32;

      // Table
      const g1 = M, g2 = M + 80, g3 = M + 220, g4 = W - M;
      setInk(SUB); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
      doc.text("YEAR", g1, y);
      doc.text("CUMULATIVE STARS", g2, y);
      doc.text("CUMULATIVE REPOS", g3, y);
      doc.text("FOLLOWERS (EST.)", g4, y, { align: "right" });
      y += 6;
      setDraw(INK); doc.setLineWidth(0.8); doc.line(M, y, W - M, y); y += 4;

      growth.forEach((p) => {
        y = ensure(20, y);
        setInk(INK); doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
        doc.text(String(p.year), g1, y + 12);
        doc.text(p.stars.toLocaleString(), g2, y + 12);
        doc.text(p.repos.toLocaleString(), g3, y + 12);
        doc.text(p.followersEst.toLocaleString(), g4, y + 12, { align: "right" });
        setDraw(RULE); doc.setLineWidth(0.3); doc.line(M, y + 18, W - M, y + 18);
        y += 20;
      });
    }

    // Colophon
    y = ensure(60, y + 20);
    setDraw(RULE); doc.setLineWidth(0.5); doc.line(M, y, W - M, y); y += 18;
    setInk(SUB); doc.setFont("times", "italic"); doc.setFontSize(9);
    doc.text("Generated by GitWorth — a playful appraisal, not financial advice.", M, y);
    doc.text(new Date().toLocaleString(), W - M, y, { align: "right" });

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
