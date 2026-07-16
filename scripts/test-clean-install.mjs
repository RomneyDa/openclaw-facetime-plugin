import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-facetime-install-"));
const stateDir = path.join(temporaryRoot, "state");
const homeDir = path.join(temporaryRoot, "home");
const consumerDir = path.join(temporaryRoot, "consumer");
const openclaw = path.join(root, "node_modules", ".bin", "openclaw");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    env: options.env ?? process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

try {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(homeDir, { recursive: true });
  fs.mkdirSync(consumerDir, { recursive: true });
  fs.writeFileSync(
    path.join(consumerDir, "package.json"),
    JSON.stringify({ name: "facetime-install-fixture", private: true }),
  );

  const packed = JSON.parse(
    run("npm", ["pack", "--pack-destination", temporaryRoot, "--json"]),
  )[0];
  const tarball = path.join(temporaryRoot, packed.filename);
  run("npm", ["install", "--no-audit", "--no-fund", tarball], { cwd: consumerDir });

  const pluginPath = path.join(consumerDir, "node_modules", "openclaw-facetime-plugin");
  const helperPath = path.join(
    pluginPath,
    "native",
    ".build",
    "release",
    "openclaw-facetime-bridge",
  );
  if (!fs.existsSync(helperPath)) {
    throw new Error("Archive postinstall did not build the release native helper");
  }

  const isolatedEnv = {
    ...process.env,
    HOME: homeDir,
    OPENCLAW_STATE_DIR: stateDir,
    OPENCLAW_CONFIG_PATH: path.join(stateDir, "openclaw.json"),
    NO_COLOR: "1",
  };
  run(openclaw, ["plugins", "install", "--force", pluginPath], {
    env: isolatedEnv,
  });
  run(
    openclaw,
    [
      "config",
      "set",
      "channels.facetime",
      JSON.stringify({
        enabled: true,
        identity: "agent@example.com",
        inboundPolicy: "allowlist",
        allowFrom: ["caller@example.com"],
      }),
      "--strict-json",
    ],
    { env: isolatedEnv },
  );
  run(openclaw, ["config", "validate"], { env: isolatedEnv });
  const installed = JSON.parse(run(openclaw, ["plugins", "list", "--json"], { env: isolatedEnv }));
  const facetime = installed.plugins.find((plugin) => plugin.id === "facetime");
  if (facetime?.status !== "loaded" || facetime.loadError) {
    throw new Error(`Archive plugin did not load cleanly: ${JSON.stringify(facetime)}`);
  }
  const doctor = run(openclaw, ["plugins", "doctor"], { env: isolatedEnv });
  if (/facetime.*(?:error|failed|missing)/iu.test(doctor)) {
    throw new Error(`Plugin doctor reported a FaceTime failure:\n${doctor}`);
  }
  run(openclaw, ["plugins", "uninstall", "--force", "facetime"], { env: isolatedEnv });
  const removed = JSON.parse(run(openclaw, ["plugins", "list", "--json"], { env: isolatedEnv }));
  if (removed.plugins.some((plugin) => plugin.id === "facetime")) {
    throw new Error("FaceTime plugin remained registered after uninstall");
  }

  console.log(`clean archive install passed with ${run(openclaw, ["--version"], { env: isolatedEnv }).trim()}`);
} catch (error) {
  if (error && typeof error === "object" && "stderr" in error) {
    const stderr = String(error.stderr ?? "").trim();
    if (stderr) {
      console.error(stderr);
    }
  }
  throw error;
} finally {
  if (process.env.KEEP_FACETIME_TEST_TMP !== "1") {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  } else {
    console.log(`kept test directory: ${temporaryRoot}`);
  }
}
