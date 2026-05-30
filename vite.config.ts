import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Force-on nitro with Vercel preset so `vite build` produces a
  // Vercel-compatible output (.vercel/output) instead of the default
  // Cloudflare Worker bundle.
  nitro: {
    preset: "vercel",
  },
});
