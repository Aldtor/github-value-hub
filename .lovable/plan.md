## Scope

I'll ship this as one big slice, no backend required. Everything runs against the public GitHub REST API client-side, with `sessionStorage` caching to avoid rate limits. Profile history uses `localStorage` (per device). The Leaderboard ships as a curated "Featured developers" list (no public global ranking dataset exists without a backend job — flagged honestly in the UI).

Design stays exactly as today: white bg, black ink, Inter + JetBrains Mono, thin borders, no gradients, no color accents.

## New shared logic — `src/lib/gitworth.ts`

- `computeScore(user, repos, weights)` → returns score, dollar value, breakdown parts
- `computeRank(score)` → `{ percentile: "Top 12%", tier: "Expert", globalRank: 4382 }` from a calibrated curve
- `computeStrength(score)` → Beginner / Growing / Advanced / Expert / Elite
- `computeAchievements(user, repos, agg)` → array of badges (Builder, Creator, Polyglot, Rising, Open Source, Community, Veteran)
- `computeMilestones(user, repos, agg, weights)` → next 3 goals + score gain
- History helpers: `recordScan(username, score)`, `getHistory(username)` (localStorage)

## New routes

- `src/routes/compare.tsx` — form for two usernames → navigates to result route
- `src/routes/compare.$user1.$user2.tsx` — fetches both, side-by-side stat table with per-row winner highlight, overall winner badge, copy link
- `src/routes/leaderboard.tsx` — curated featured list with filter chips (Global, Python, JS, TS, React, AI/ML, Open Source), search, sort, top-3 gold/silver/bronze rank treatment
- `src/routes/wrapped.$username.tsx` — single-screen shareable card (avatar, score, rank, top lang, followers, repos, account age, achievements). "Download PNG" via `html-to-image`, "Copy link", "Share"
- `src/routes/portfolio.$username.tsx` — auto-generated portfolio: avatar, bio, top repos, languages, score, achievements
- `src/routes/badges.$username.tsx` — embed page with HTML + markdown snippets using shields.io static badges (no backend needed)

## Updates

- `src/routes/index.tsx` — premium landing: hero + features grid + how-it-works + leaderboard preview + comparison preview + wrapped preview + FAQ + footer
- `src/routes/u.$username.tsx` / `GitWorthView` — adds rank pill, strength meter, score breakdown card, achievements row, growth milestones, developer snapshot, skeleton loader, history sparkline (if any prior scans exist)
- New `Header.tsx` / `Footer.tsx` with nav across all routes (Home, Compare, Leaderboard)
- New `EmptyState.tsx`, `Skeleton.tsx` shared components
- Each route gets unique SEO `head()` (title, description, og:title, og:description, og:url, canonical)

## Dependencies

- `html-to-image` (for Wrapped PNG download)

## What I'm NOT building (and why)

- **Real global leaderboard** — needs a backend + scheduled GitHub crawler. Ship as curated "Featured developers" with a small "How is this list built?" note. Can swap to Lovable Cloud later.
- **Persistent multi-device history** — using `localStorage` so it works instantly. Cloud-backed history requires auth + DB. Can upgrade later.
- **Server-rendered OG image** for Wrapped — using client-side `html-to-image` PNG download instead.

Want me to proceed as-is, or trim/expand any section first?