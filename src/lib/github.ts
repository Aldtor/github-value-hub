import type { GhUser, Repo } from "@/components/GitWorthView";

const TTL = 5 * 60 * 1000;

function cacheGet<T>(key: string): T | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > TTL) return null;
    return data as T;
  } catch { return null; }
}
function cacheSet(key: string, data: unknown) {
  if (typeof sessionStorage === "undefined") return;
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch { /* ignore */ }
}

export async function fetchProfile(username: string): Promise<{ user: GhUser; repos: Repo[] }> {
  const key = `gh:${username.toLowerCase()}`;
  const cached = cacheGet<{ user: GhUser; repos: Repo[] }>(key);
  if (cached) return cached;
  const u = encodeURIComponent(username);
  const userRes = await fetch(`https://api.github.com/users/${u}`);
  if (!userRes.ok) throw new Error(userRes.status === 404 ? "User not found" : "GitHub API error");
  const user: GhUser = await userRes.json();
  const reposRes = await fetch(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`);
  const repos: Repo[] = reposRes.ok ? await reposRes.json() : [];
  const data = { user, repos };
  cacheSet(key, data);
  return data;
}

export function primaryLanguage(repos: Repo[]): string | null {
  const m = new Map<string, number>();
  for (const r of repos) if (r.language) m.set(r.language, (m.get(r.language) ?? 0) + 1);
  let best: [string, number] | null = null;
  for (const e of m.entries()) if (!best || e[1] > best[1]) best = e;
  return best?.[0] ?? null;
}
