import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  ".vercel/output/config.json",
  ".vercel/output/functions/__server.func/.vc-config.json",
  ".vercel/output/functions/__server.func/index.mjs",
];

const missing = requiredFiles.filter((file) => !existsSync(file));

if (missing.length > 0) {
  console.error("Vercel Build Output API verification failed.");
  console.error("Missing files:");
  for (const file of missing) console.error(`- ${file}`);
  console.error("Expected Nitro to generate .vercel/output for Vercel SSR.");
  process.exit(1);
}

const config = JSON.parse(readFileSync(".vercel/output/config.json", "utf8"));
const hasCatchAllServerRoute = Array.isArray(config.routes)
  && config.routes.some((route) => route?.src === "/(.*)" && route?.dest === "/__server");

if (config.version !== 3 || !hasCatchAllServerRoute) {
  console.error("Vercel Build Output API verification failed.");
  console.error(".vercel/output/config.json does not route all pages to the Nitro server function.");
  process.exit(1);
}

console.info("Verified Vercel Build Output API files:");
for (const file of requiredFiles) console.info(`- ${file}`);
console.info("Verified catch-all SSR route: /(.*) -> /__server");