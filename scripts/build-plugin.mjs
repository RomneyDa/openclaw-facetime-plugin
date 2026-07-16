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
    "avatar-preview": "src/avatar/preview.ts",
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

const avatarOutdir = path.join(outdir, "avatar");
fs.mkdirSync(avatarOutdir, { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ["avatar/client.ts"],
  outfile: path.join(avatarOutdir, "avatar.js"),
  bundle: true,
  platform: "browser",
  format: "esm",
  target: ["chrome120", "safari17"],
  minify: true,
  logLevel: "info",
});
const avatarBundle = path.join(avatarOutdir, "avatar.js");
fs.writeFileSync(
  avatarBundle,
  fs.readFileSync(avatarBundle, "utf8").replace(/[ \t]+$/gmu, ""),
);
for (const [source, destination] of [
  ["avatar/index.html", "index.html"],
  ["node_modules/@met4citizen/headaudio/dist/headworklet.min.mjs", "headworklet.mjs"],
  ["node_modules/@met4citizen/headaudio/dist/model-en-mixed.bin", "model-en-mixed.bin"],
  ["node_modules/@met4citizen/talkinghead/modules/playback-worklet.js", "playback-worklet.js"],
]) {
  fs.copyFileSync(path.join(root, source), path.join(avatarOutdir, destination));
}
