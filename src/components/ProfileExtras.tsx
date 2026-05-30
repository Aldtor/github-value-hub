import { Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import type { GhUser, Repo } from "@/components/GitWorthView";
import {
  aggregate, score, rank, strength, achievements, milestones,
  recordScan, getHistory,
} from "@/lib/gitworth";
import { Pill } from "./ui-bits";

export function ProfileExtras({ user, repos }: { user: GhUser; repos: Repo[] }) {
  const agg = useMemo(() => aggregate(user, repos), [user, repos]);
  const sc = useMemo(() => score(user, agg), [user, agg]);
  const r = useMemo(() => rank(sc.value), [sc.value]);
  const st = useMemo(() => strength(sc.value), [sc.value]);
  const ach = useMemo(() => achievements(user, repos, agg), [user, repos, agg]);
  const ms = useMemo(() => milestones(user, repos, agg), [user, repos, agg]);
  const history = useMemo(() => getHistory(user.login), [user.login]);

  useEffect(() => { recordScan(user.login, sc.value); }, [user.login, sc.value]);

  const breakdownRows: [string, number][] = [
    ["Followers", sc.parts.followers],
    ["Stars", sc.parts.stars],
    ["Original repos", sc.parts.originalRepos],
    ["Forks", sc.parts.forks],
    ["Account age", sc.parts.ageYears],
    ["Gists", sc.parts.gists],
    ["Following", sc.parts.following],
  ];

  return (
    <section className="mt-14 border-t border-border pt-10 space-y-12">
      {/* Rank + Strength */}
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <p className="text-xs text-muted-foreground font-mono">GitWorth Rank</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">{r.percentile}</p>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            ≈ global rank #{r.globalRank.toLocaleString()} · tier {r.tier}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Rank estimated from score against a calibrated distribution of public GitHub developers.
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-mono">Profile Strength</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">{st.tier}</p>
          <div className="mt-4 h-1.5 bg-muted overflow-hidden">
            <div className="h-full bg-foreground transition-all" style={{ width: `${st.pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            <span>Beginner</span><span>Growing</span><span>Advanced</span><span>Expert</span><span>Elite</span>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {ach.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-4">Achievements</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ach.map(a => (
              <div key={a.id} className="border border-border p-4 flex gap-3 items-start">
                <span className="text-2xl leading-none">{a.emoji}</span>
                <div>
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score breakdown */}
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-4">Score breakdown</p>
        <div className="border border-border divide-y divide-border">
          {breakdownRows.map(([label, v]) => {
            const contrib = Math.round(v);
            const pct = sc.value > 0 ? Math.min(100, (contrib / sc.value) * 100) : 0;
            return (
              <div key={label} className="p-4 flex items-center gap-4">
                <span className="text-sm w-32 flex-shrink-0">{label}</span>
                <div className="flex-1 h-1 bg-muted relative">
                  <div className="absolute inset-y-0 left-0 bg-foreground" style={{ width: `${pct}%` }} />
                </div>
                <span className="font-mono text-sm tabular-nums w-24 text-right">+{contrib.toLocaleString()}</span>
              </div>
            );
          })}
          <div className="p-4 flex items-center justify-between bg-secondary">
            <span className="text-sm font-medium">Final GitWorth Score</span>
            <span className="font-mono text-lg font-semibold tabular-nums">{sc.value.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-4">Next milestones</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {ms.map((m, i) => (
            <div key={i} className="border border-border p-4">
              <p className="text-sm">{m.label}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">+{m.gain.toLocaleString()} score</p>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length >= 2 && (
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-4">Your scan history</p>
          <div className="border border-border p-5">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-sm text-muted-foreground">{history.length} scans</span>
              <span className="text-sm font-mono">
                {history[0].score.toLocaleString()} → {history[history.length - 1].score.toLocaleString()}
              </span>
            </div>
            <Sparkline points={history.map(h => h.score)} />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Pill><Link to="/wrapped/$username" params={{ username: user.login }}>↗ GitHub Wrapped</Link></Pill>
        <Pill><Link to="/portfolio/$username" params={{ username: user.login }}>↗ Portfolio page</Link></Pill>
        <Pill><Link to="/badges/$username" params={{ username: user.login }}>↗ Embed badge</Link></Pill>
        <Pill><Link to="/compare">↗ Compare with another dev</Link></Pill>
      </div>
    </section>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 600, h = 60;
  const min = Math.min(...points), max = Math.max(...points), span = max - min || 1;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / span) * h;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14" preserveAspectRatio="none">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
