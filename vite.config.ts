import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Force-on Nitro with Vercel's Build Output API layout. The Lovable wrapper
  // supplies default `dist/*` output paths, so the Vercel preset paths must be
  // explicit or Vercel deploys a static shell and returns 404.
  nitro: {
    preset: "vercel",
    output: {
      dir: ".vercel/output",
      serverDir: ".vercel/output/functions/__server.func",
      publicDir: ".vercel/output/static",
    },
  },
});
