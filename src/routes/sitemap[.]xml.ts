import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://git-worth-whiz.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

// Featured developers also indexed (curated, mirrors leaderboard).
const FEATURED = [
  "torvalds", "gaearon", "sindresorhus", "tj", "yyx990803", "fabpot",
  "addyosmani", "kentcdodds", "tannerlinsley", "shadcn", "felangel",
  "rrousselGit", "karpathy", "ggerganov", "jakevdp", "wesm",
  "mitsuhiko", "antfu", "leerob",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/leaderboard", changefreq: "daily", priority: "0.9" },
          { path: "/compare", changefreq: "monthly", priority: "0.7" },
        ];

        for (const u of FEATURED) {
          entries.push({ path: `/u/${u}`, changefreq: "weekly", priority: "0.6" });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
