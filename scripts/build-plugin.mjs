import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outdir = path.join(root, "dist");
fs.rmSync(outdir, { recursive: true, force: true });

await build({
  absWorkingDir: root,
  entryPoints: {
    index: "index.ts",
    "setup-entry": "setup-entry.ts",
    "avatar-obs-smoke": "src/avatar/obs-smoke.ts",
  },
  outdir,
  outExtension: { ".js": ".mjs" },
  bundle: true,
  external: ["openclaw", "openclaw/*"],
  platform: "node",
  format: "esm",
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
  target: "node22",
  logLevel: "info",
});
