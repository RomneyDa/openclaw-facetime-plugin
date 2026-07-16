import path from "node:path";
import { fileURLToPath } from "node:url";
import type { OpenClawConfig } from "openclaw/plugin-sdk";
import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "openclaw/plugin-sdk/core";
import type { FaceTimeAccountConfig, ResolvedFaceTimeAccount } from "./types.js";
import { FACETIME_DEFAULT_HELPER_RELATIVE_PATH } from "./types.js";

const PLUGIN_ROOT = fileURLToPath(new URL("../../", import.meta.url));

function readSection(cfg: OpenClawConfig): FaceTimeAccountConfig {
  const section = (cfg.channels as Record<string, unknown> | undefined)?.facetime;
  return section && typeof section === "object" ? (section as FaceTimeAccountConfig) : {};
}

function mergeAccountConfig(
  base: FaceTimeAccountConfig,
  account: FaceTimeAccountConfig | undefined,
): FaceTimeAccountConfig {
  return {
    ...base,
    ...account,
    realtime: {
      ...base.realtime,
      ...account?.realtime,
      providers: {
        ...base.realtime?.providers,
        ...account?.realtime?.providers,
      },
    },
    accounts: base.accounts,
  };
}

export function listFaceTimeAccountIds(cfg: OpenClawConfig): string[] {
  const section = readSection(cfg);
  const ids = Object.keys(section.accounts ?? {});
  if (section.identity || ids.length === 0) {
    ids.unshift(DEFAULT_ACCOUNT_ID);
  }
  return [...new Set(ids.map(normalizeAccountId))];
}

export function resolveDefaultFaceTimeAccountId(cfg: OpenClawConfig): string {
  return normalizeAccountId(readSection(cfg).defaultAccount ?? DEFAULT_ACCOUNT_ID);
}

export function resolveFaceTimeAccount(params: {
  cfg: OpenClawConfig;
  accountId?: string | null;
  cwd?: string;
}): ResolvedFaceTimeAccount {
  const section = readSection(params.cfg);
  const accountId = normalizeAccountId(
    params.accountId ?? section.defaultAccount ?? DEFAULT_ACCOUNT_ID,
  );
  const accountConfig = accountId === DEFAULT_ACCOUNT_ID ? undefined : section.accounts?.[accountId];
  const merged = mergeAccountConfig(section, accountConfig);
  const baseEnabled = section.enabled !== false;
  const accountEnabled = accountConfig?.enabled !== false;
  const helperPath = path.resolve(
    params.cwd ?? PLUGIN_ROOT,
    FACETIME_DEFAULT_HELPER_RELATIVE_PATH,
  );
  return {
    accountId,
    enabled: baseEnabled && accountEnabled,
    name: merged.name?.trim() || undefined,
    identity: merged.identity?.trim() || undefined,
    config: merged,
    helperPath,
    blackHoleDevice: merged.blackHoleDevice?.trim() || "BlackHole 2ch",
  };
}

export const resolveFaceTimeAccountForStatus = resolveFaceTimeAccount;
