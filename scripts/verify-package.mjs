import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

const pack = JSON.parse(run("npm", ["pack", "--dry-run", "--ignore-scripts", "--json"]))[0];
const entries = pack.files.map((file) => file.path).sort();
const required = [
  "ARCHITECTURE.md",
  "LICENSE",
  "PLAN.md",
  "README.md",
  "dist/index.mjs",
  "dist/setup-entry.mjs",
  "dist/avatar-preview.mjs",
  "dist/avatar-obs-smoke.mjs",
  "dist/avatar/avatar.js",
  "dist/avatar/headworklet.mjs",
  "dist/avatar/model-en-mixed.bin",
  "index.ts",
  "native/Package.swift",
  "native/bin/openclaw-facetime-bridge",
  "openclaw.plugin.json",
  "package.json",
  "setup-entry.ts",
  "src/channel.ts",
];
for (const entry of required) {
  if (!entries.includes(entry)) {
    throw new Error(`Package is missing required entry: ${entry}`);
  }
}
const nativeHelper = path.join(root, "native", "bin", "openclaw-facetime-bridge");
if ((fs.statSync(nativeHelper).mode & 0o111) === 0) {
  throw new Error("Packaged native helper is not executable");
}
const forbidden = entries.filter((entry) =>
  /(^|\/)(?:node_modules|tmp|coverage|\.git|\.worktrees)(?:\/|$)|\.test\.[cm]?[jt]s$|native\/\.build\//u.test(
    entry,
  ),
);
if (forbidden.length > 0) {
  throw new Error(`Package contains forbidden entries:\n${forbidden.join("\n")}`);
}

const secretPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/u,
  /\bsk-[A-Za-z0-9_-]{20,}\b/u,
  /\bgh[opsu]_[A-Za-z0-9]{30,}\b/u,
];
for (const entry of entries) {
  const filename = path.join(root, entry);
  if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    continue;
  }
  const contents = fs.readFileSync(filename, "utf8");
  if (secretPatterns.some((pattern) => pattern.test(contents))) {
    throw new Error(`Package entry looks like it contains a credential: ${entry}`);
  }
}

const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
const deniedLicenses = /(?:^|[^A-Z])(?:A?GPL|SSPL|BUSL|UNLICENSED)(?:[^A-Z]|$)/iu;
const licenses = [];
for (const [packagePath, metadata] of Object.entries(lock.packages ?? {})) {
  if (!packagePath.startsWith("node_modules/") || metadata.dev === true) {
    continue;
  }
  const packageJsonPath = path.join(root, packagePath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Installed production dependency is missing package.json: ${packagePath}`);
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const license = String(packageJson.license ?? "");
  if (!license || deniedLicenses.test(license)) {
    throw new Error(`Production dependency has a missing or denied license: ${packageJson.name} (${license || "missing"})`);
  }
  licenses.push(`${packageJson.name}@${packageJson.version}: ${license}`);
}

console.log(
  `package verification passed: ${entries.length} entries, ${pack.size} bytes, ${licenses.length} production dependency licenses checked`,
);
