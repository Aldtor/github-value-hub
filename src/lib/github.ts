import type { GhUser, Repo } from "@/components/GitWorthView";

const TTL = 5 * 60 * 1000;
const REQUEST_TIMEOUT = 8_000;

type Snapshot = {
  login: string;
  name: string;
  bio?: string;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  created_at: string;
  stars: number;
  forks: number;
  original: number;
  language: string;
};

const SNAPSHOTS: Snapshot[] = [
  { login: "torvalds", name: "Linus Torvalds", bio: "Creator of Linux and Git.", followers: 236000, following: 0, public_repos: 8, public_gists: 0, created_at: "2011-09-03T15:26:22Z", stars: 194000, forks: 65000, original: 8, language: "C" },
  { login: "gaearon", name: "Dan Abramov", bio: "Working on React.", followers: 88000, following: 171, public_repos: 277, public_gists: 77, created_at: "2011-06-02T18:14:33Z", stars: 97000, forks: 17000, original: 82, language: "JavaScript" },
  { login: "sindresorhus", name: "Sindre Sorhus", bio: "Full-time open-sourcerer.", followers: 79000, following: 83, public_repos: 1200, public_gists: 70, created_at: "2009-12-20T22:57:02Z", stars: 292000, forks: 17000, original: 900, language: "TypeScript" },
  { login: "tj", name: "TJ Holowaychuk", bio: "Open source developer.", followers: 52000, following: 0, public_repos: 295, public_gists: 556, created_at: "2008-09-18T22:37:28Z", stars: 156000, forks: 19000, original: 210, language: "JavaScript" },
  { login: "yyx990803", name: "Evan You", bio: "Creator of Vue.js and Vite.", followers: 104000, following: 95, public_repos: 218, public_gists: 28, created_at: "2010-11-28T01:05:40Z", stars: 253000, forks: 39000, original: 120, language: "TypeScript" },
  { login: "fabpot", name: "Fabien Potencier", bio: "Symfony creator.", followers: 14000, following: 0, public_repos: 116, public_gists: 21, created_at: "2009-01-17T13:42:51Z", stars: 47000, forks: 16000, original: 64, language: "PHP" },
  { login: "addyosmani", name: "Addy Osmani", bio: "Engineering leader working on the web.", followers: 36000, following: 161, public_repos: 349, public_gists: 95, created_at: "2010-08-19T13:42:49Z", stars: 71000, forks: 11000, original: 130, language: "JavaScript" },
  { login: "kentcdodds", name: "Kent C. Dodds", bio: "Helping people make the world better through quality software.", followers: 35000, following: 90, public_repos: 613, public_gists: 160, created_at: "2010-08-28T19:19:38Z", stars: 56000, forks: 9500, original: 260, language: "TypeScript" },
  { login: "tannerlinsley", name: "Tanner Linsley", bio: "Creator of TanStack.", followers: 18000, following: 74, public_repos: 261, public_gists: 9, created_at: "2010-05-03T19:50:31Z", stars: 98000, forks: 9000, original: 115, language: "TypeScript" },
  { login: "shadcn", name: "shadcn", bio: "Design engineer.", followers: 52000, following: 0, public_repos: 67, public_gists: 14, created_at: "2011-01-09T19:05:44Z", stars: 98000, forks: 6200, original: 40, language: "TypeScript" },
  { login: "felangel", name: "Felix Angelov", bio: "Software engineer and open source maintainer.", followers: 9600, following: 88, public_repos: 242, public_gists: 10, created_at: "2015-02-15T04:41:31Z", stars: 39000, forks: 7200, original: 112, language: "Dart" },
  { login: "rrousselGit", name: "Rémi Rousselet", bio: "Flutter and Dart open source.", followers: 11000, following: 0, public_repos: 136, public_gists: 18, created_at: "2016-04-21T19:38:19Z", stars: 34000, forks: 4300, original: 86, language: "Dart" },
  { login: "karpathy", name: "Andrej Karpathy", bio: "AI educator and builder.", followers: 115000, following: 1, public_repos: 58, public_gists: 4, created_at: "2013-07-16T01:07:33Z", stars: 97000, forks: 26000, original: 35, language: "Python" },
  { login: "ggerganov", name: "Georgi Gerganov", bio: "AI tooling and systems software.", followers: 30000, following: 37, public_repos: 112, public_gists: 8, created_at: "2014-02-11T15:42:58Z", stars: 124000, forks: 18000, original: 76, language: "C++" },
  { login: "jakevdp", name: "Jake VanderPlas", bio: "Python, data science, and astronomy.", followers: 15000, following: 3, public_repos: 96, public_gists: 60, created_at: "2012-09-24T22:09:37Z", stars: 41000, forks: 13000, original: 64, language: "Python" },
  { login: "wesm", name: "Wes McKinney", bio: "Creator of pandas.", followers: 14000, following: 14, public_repos: 92, public_gists: 17, created_at: "2008-11-11T21:02:04Z", stars: 51000, forks: 18000, original: 48, language: "Python" },
  { login: "mitsuhiko", name: "Armin Ronacher", bio: "Creator of Flask and many Python projects.", followers: 17000, following: 0, public_repos: 183, public_gists: 30, created_at: "2009-03-28T20:50:25Z", stars: 65000, forks: 13000, original: 110, language: "Python" },
  { login: "antfu", name: "Anthony Fu", bio: "Open source developer.", followers: 31000, following: 829, public_repos: 570, public_gists: 65, created_at: "2014-11-08T13:44:20Z", stars: 77000, forks: 5200, original: 320, language: "TypeScript" },
  { login: "leerob", name: "Lee Robinson", bio: "Developer, writer, and builder.", followers: 33000, following: 315, public_repos: 187, public_gists: 17, created_at: "2011-01-24T23:06:16Z", stars: 37000, forks: 5200, original: 92, language: "TypeScript" },
];

function fromSnapshot(s: Snapshot): { user: GhUser; repos: Repo[] } {
  const repoCount = Math.max(1, Math.min(12, s.original));
  const repos = Array.from({ length: repoCount }, (_, i): Repo => {
    const weight = i === 0 ? 0.42 : (0.58 / Math.max(1, repoCount - 1));
    return {
      name: i === 0 ? `${s.login}-main` : `${s.login}-project-${i}`,
      stargazers_count: Math.round(s.stars * weight),
      forks_count: Math.round(s.forks * weight),
      language: i % 5 === 0 ? s.language : s.language,
      fork: false,
      created_at: new Date(new Date(s.created_at).getTime() + i * 86_400_000 * 120).toISOString(),
    };
  });
  return {
    user: {
      login: s.login,
      name: s.name,
      avatar_url: `https://github.com/${s.login}.png?size=120`,
      html_url: `https://github.com/${s.login}`,
      bio: s.bio ?? null,
      company: null,
      location: null,
      blog: "",
      twitter_username: null,
      email: null,
      public_repos: s.public_repos,
      public_gists: s.public_gists,
      followers: s.followers,
      following: s.following,
      created_at: s.created_at,
      updated_at: new Date().toISOString(),
    },
    repos,
  };
}

export function getFallbackProfile(username: string): { user: GhUser; repos: Repo[] } | null {
  const hit = SNAPSHOTS.find(s => s.login.toLowerCase() === username.toLowerCase());
  return hit ? fromSnapshot(hit) : null;
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function cacheGet<T>(key: string, allowStale = false): T | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (!allowStale && Date.now() - ts > TTL) return null;
    return data as T;
  } catch { return null; }
}
function cacheSet(key: string, data: unknown) {
  if (typeof sessionStorage === "undefined") return;
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch { /* ignore */ }
}

export async function fetchProfile(username: string): Promise<{ user: GhUser; repos: Repo[] }> {
  const key = `gh:${username.toLowerCase()}`;
  const fresh = cacheGet<{ user: GhUser; repos: Repo[] }>(key);
  if (fresh) return fresh;
  const fallback = () =>
    getFallbackProfile(username) ?? cacheGet<{ user: GhUser; repos: Repo[] }>(key, true);
  const u = encodeURIComponent(username);
  try {
    const userRes = await fetchWithTimeout(`https://api.github.com/users/${u}`);
    if (!userRes.ok) {
      if (userRes.status === 404) {
        const fb = fallback();
        if (fb) return fb;
        throw new Error("User not found");
      }
      const fb = fallback();
      if (fb) return fb;
      throw new Error("GitHub is rate-limiting requests. Try again shortly.");
    }
    const user: GhUser = await userRes.json();
    const reposRes = await fetchWithTimeout(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`);
    const repos: Repo[] = reposRes.ok ? await reposRes.json() : (fallback()?.repos ?? []);
    const data = { user, repos };
    cacheSet(key, data);
    return data;
  } catch (error) {
    const fb = fallback();
    if (fb) return fb;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("GitHub took too long to respond. Try again shortly.");
    }
    throw error instanceof Error ? error : new Error("GitHub is unavailable. Try again shortly.");
  }
}


export function primaryLanguage(repos: Repo[]): string | null {
  const m = new Map<string, number>();
  for (const r of repos) if (r.language) m.set(r.language, (m.get(r.language) ?? 0) + 1);
  let best: [string, number] | null = null;
  for (const e of m.entries()) if (!best || e[1] > best[1]) best = e;
  return best?.[0] ?? null;
}
