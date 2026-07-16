import { execFile } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";
import type { FaceTimeProbe, ResolvedFaceTimeAccount } from "./types.js";

const execFileAsync = promisify(execFile);

export async function probeFaceTime(
  account: ResolvedFaceTimeAccount,
  timeoutMs = 5_000,
): Promise<FaceTimeProbe> {
  const checks = [
    {
      id: "platform",
      ok: process.platform === "darwin",
      message:
        process.platform === "darwin"
          ? "Running on macOS"
          : `FaceTime requires macOS; current platform is ${process.platform}`,
    },
    {
      id: "identity",
      ok: Boolean(account.identity),
      message: account.identity
        ? `Configured FaceTime identity: ${account.identity}`
        : "Set channels.facetime.identity to the signed-in FaceTime address",
    },
    {
      id: "helper",
      ok: fs.existsSync(account.helperPath),
      message: fs.existsSync(account.helperPath)
        ? `Native helper found at ${account.helperPath}`
        : `Native helper missing at ${account.helperPath}; run npm run build:native`,
    },
  ];
  if (!checks.every((check) => check.ok)) {
    return { ok: false, platform: process.platform, helperPath: account.helperPath, checks };
  }
  try {
    const { stdout } = await execFileAsync(
      account.helperPath,
      ["--diagnose", "--device", account.blackHoleDevice],
      { timeout: timeoutMs, maxBuffer: 512 * 1024, encoding: "utf8" },
    );
    const native = JSON.parse(stdout) as { checks?: FaceTimeProbe["checks"] };
    checks.push(...(native.checks ?? []));
    return {
      ok: checks.every((check) => check.ok),
      platform: process.platform,
      helperPath: account.helperPath,
      checks,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push({ id: "native-diagnostics", ok: false, message });
    return {
      ok: false,
      platform: process.platform,
      helperPath: account.helperPath,
      checks,
      error: message,
    };
  }
}
