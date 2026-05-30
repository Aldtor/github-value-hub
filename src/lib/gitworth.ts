import type { GhUser, Repo, Weights } from "@/components/GitWorthView";
import { DEFAULT_WEIGHTS } from "@/components/GitWorthView";

export type Agg = { stars: number; forks: number; original: number; ageYears: number };

export function aggregate(u: GhUser, repos: Repo[]): Agg {
  const stars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const forks = repos.reduce((s, r) => s + r.forks_count, 0);
  const original = repos.filter(r => !r.fork).length;
  const ageYears = (Date.now() - new Date(u.created_at).getTime()) / (365.25 * 24 * 3600 * 1000);
  return { stars, forks, original, ageYears };
}

export function score(u: GhUser, a: Agg, w: Weights = DEFAULT_WEIGHTS) {
  const parts = {
    followers: u.followers * w.followers,
    following: u.following * w.following,
    stars: a.stars * w.stars,
    forks: a.forks * w.forks,
    originalRepos: a.original * w.originalRepos,
    gists: u.public_gists * w.gists,
    ageYears: a.ageYears * w.ageYears,
  };
  const value = Math.round(Object.values(parts).reduce((s, v) => s + v, 0));
  return { value, parts };
}

// Calibrated rank curve. Score thresholds → percentile.
type Tier = { min: number; pct: string; tier: string; base: number };
const TIERS: Tier[] = [
  { min: 0,      pct: "Top 90%", tier: "Beginner",  base: 9_500_000 },
  { min: 250,    pct: "Top 60%", tier: "Growing",   base: 6_000_000 },
  { min: 1_000,  pct: "Top 30%", tier: "Advanced",  base: 3_000_000 },
  { min: 5_000,  pct: "Top 12%", tier: "Expert",    base: 1_200_000 },
  { min: 25_000, pct: "Top 5%",  tier: "Elite",     base: 500_000 },
  { min: 100_000,pct: "Top 1%",  tier: "Legend",    base: 100_000 },
  { min: 500_000,pct: "Top 0.1%",tier: "Legend",    base: 10_000 },
];

export type Rank = { percentile: string; tier: string; globalRank: number };

export function rank(s: number): Rank {
  let t = TIERS[0];
  for (const x of TIERS) if (s >= x.min) t = x;
  // shrink rank as score grows past the threshold
  const next = TIERS[TIERS.indexOf(t) + 1];
  const span = (next?.min ?? t.min * 4) - t.min || 1;
  const progress = Math.min(1, (s - t.min) / span);
  const globalRank = Math.max(1, Math.round(t.base * (1 - progress * 0.85)));
  return { percentile: t.pct, tier: t.tier, globalRank };
}

export type Strength = "Beginner" | "Growing" | "Advanced" | "Expert" | "Elite";
export function strength(s: number): { tier: Strength; pct: number } {
  if (s >= 25_000) return { tier: "Elite", pct: 100 };
  if (s >= 5_000)  return { tier: "Expert", pct: 80 };
  if (s >= 1_000)  return { tier: "Advanced", pct: 60 };
  if (s >= 250)    return { tier: "Growing", pct: 35 };
  return { tier: "Beginner", pct: 15 };
}

export type Achievement = { id: string; label: string; description: string; emoji: string };
export function achievements(u: GhUser, repos: Repo[], a: Agg): Achievement[] {
  const out: Achievement[] = [];
  const langs = new Set(repos.map(r => r.language).filter(Boolean) as string[]);
  if (a.original >= 1) out.push({ id: "builder", label: "Builder", description: "Shipped public code", emoji: "🚀" });
  if (a.original >= 5) out.push({ id: "creator", label: "Creator", description: "5+ original repositories", emoji: "🏗" });
  if (langs.size >= 3) out.push({ id: "polyglot", label: "Polyglot", description: `${langs.size} languages used`, emoji: "💻" });
  if (a.stars >= 10) out.push({ id: "rising", label: "Rising Developer", description: `${a.stars.toLocaleString()} stars earned`, emoji: "⭐" });
  if (a.forks >= 5 || a.stars >= 100) out.push({ id: "oss", label: "Open Source", description: "Code others rely on", emoji: "🔥" });
  if (u.followers >= 100) out.push({ id: "community", label: "Community Builder", description: `${u.followers.toLocaleString()} followers`, emoji: "👥" });
  if (a.ageYears >= 5) out.push({ id: "veteran", label: "Veteran", description: `${a.ageYears.toFixed(0)} years on GitHub`, emoji: "⏳" });
  return out;
}

export type Milestone = { label: string; gain: number };
export function milestones(u: GhUser, _repos: Repo[], a: Agg, w: Weights = DEFAULT_WEIGHTS): Milestone[] {
  const nextStep = (cur: number, steps: number[]) => steps.find(s => s > cur) ?? cur + steps[steps.length - 1];
  const fNext = nextStep(u.followers, [10, 50, 100, 500, 1_000, 5_000, 10_000]);
  const sNext = nextStep(a.stars, [10, 50, 250, 1_000, 5_000, 25_000]);
  const rNext = nextStep(a.original, [3, 10, 25, 50, 100]);
  return [
    { label: `Reach ${fNext.toLocaleString()} followers (+${fNext - u.followers})`, gain: Math.round((fNext - u.followers) * w.followers) },
    { label: `Earn ${sNext.toLocaleString()} total stars (+${sNext - a.stars})`, gain: Math.round((sNext - a.stars) * w.stars) },
    { label: `Publish ${rNext} original repos (+${rNext - a.original})`, gain: Math.round((rNext - a.original) * w.originalRepos) },
  ];
}

// localStorage history
const HKEY = (u: string) => `gw:hist:${u.toLowerCase()}`;
export type HistPoint = { ts: number; score: number };

export function recordScan(username: string, s: number) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(HKEY(username));
    const arr: HistPoint[] = raw ? JSON.parse(raw) : [];
    const last = arr[arr.length - 1];
    if (!last || Date.now() - last.ts > 60_000) arr.push({ ts: Date.now(), score: s });
    localStorage.setItem(HKEY(username), JSON.stringify(arr.slice(-50)));
  } catch { /* ignore */ }
}

export function getHistory(username: string): HistPoint[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HKEY(username)) ?? "[]"); } catch { return []; }
}
