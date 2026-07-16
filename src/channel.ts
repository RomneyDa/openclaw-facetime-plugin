import type { OpenClawConfig } from "openclaw/plugin-sdk";
import { DEFAULT_ACCOUNT_ID, type ChannelPlugin } from "openclaw/plugin-sdk/core";
import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import { createFaceTimePluginBase } from "./channel-base.js";
import { resolveFaceTimeAccount } from "./facetime/accounts.js";
import {
  FaceTimeCallManager,
  getFaceTimeCallManager,
  registerFaceTimeCallManager,
  unregisterFaceTimeCallManager,
} from "./facetime/call-manager.js";
import { probeFaceTime } from "./facetime/probe.js";
import { formatFaceTimeTarget, parseFaceTimeTarget } from "./facetime/targets.js";
import type { FaceTimeProbe, ResolvedFaceTimeAccount } from "./facetime/types.js";
import { getFaceTimeRuntime } from "./runtime.js";

export const faceTimePlugin: ChannelPlugin<ResolvedFaceTimeAccount, FaceTimeProbe> = {
  ...createFaceTimePluginBase(),
  messaging: {
    normalizeTarget: (raw) => {
      if (!raw) {
        return "";
      }
      try {
        return formatFaceTimeTarget(parseFaceTimeTarget(raw));
      } catch {
        return raw;
      }
    },
    targetResolver: {
      looksLikeId: (id) => {
        try {
          parseFaceTimeTarget(id ?? "");
          return true;
        } catch {
          return false;
        }
      },
      hint: "facetime:<phone-or-email> | facetime:<accountId>:<phone-or-email>",
    },
  },
  outbound: {
    deliveryMode: "direct",
    chunker: (text) => [text],
    chunkerMode: "text",
    textChunkLimit: 4_000,
    sendText: async ({ to, text, accountId }) => {
      const target = parseFaceTimeTarget(to, accountId ?? undefined);
      const manager = getFaceTimeCallManager(target.accountId ?? accountId ?? DEFAULT_ACCOUNT_ID);
      const call = await manager.sendText(target.address, text);
      return {
        channel: "facetime",
        messageId: call.id,
        chatId: call.peer,
      };
    },
    sendMedia: async () => {
      throw new Error("FaceTime Audio does not support media sends");
    },
  },
  status: {
    defaultRuntime: {
      accountId: DEFAULT_ACCOUNT_ID,
      running: false,
      lastStartAt: null,
      lastStopAt: null,
      lastError: null,
    },
    collectStatusIssues: (accounts) =>
      accounts.flatMap((account) => {
        const issues = [];
        const probe = account.probe as FaceTimeProbe | undefined;
        for (const check of probe?.checks ?? []) {
          if (!check.ok) {
            issues.push({
              channel: "facetime",
              accountId: account.accountId,
              kind: "runtime" as const,
              message: check.message,
            });
          }
        }
        if (account.lastError) {
          issues.push({
            channel: "facetime",
            accountId: account.accountId,
            kind: "runtime" as const,
            message: `Channel error: ${String(account.lastError)}`,
          });
        }
        return issues;
      }),
    probeAccount: async ({ account, timeoutMs }) => probeFaceTime(account, timeoutMs),
    buildAccountSnapshot: ({ account, runtime, probe }) => {
      let calls: unknown;
      try {
        calls = getFaceTimeCallManager(account.accountId).snapshot();
      } catch {
        calls = { active: null, recent: [] };
      }
      return {
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured: Boolean(account.identity),
        identity: account.identity,
        running: runtime?.running ?? false,
        lastStartAt: runtime?.lastStartAt ?? null,
        lastStopAt: runtime?.lastStopAt ?? null,
        lastError: runtime?.lastError ?? null,
        probe,
        calls,
      };
    },
  },
  gateway: {
    startAccount: async (ctx) => {
      const rt = getFaceTimeRuntime();
      const account = resolveFaceTimeAccount({ cfg: ctx.cfg, accountId: ctx.account.accountId });
      const manager = new FaceTimeCallManager({
        account,
        cfg: ctx.cfg as OpenClawConfig,
        runtime: rt,
        logger:
          ctx.log ??
          ({
            info: () => {},
            warn: () => {},
            error: () => {},
          } as RuntimeLogger),
      });
      registerFaceTimeCallManager(manager);
      ctx.log?.info(
        `[${account.accountId}] starting FaceTime bridge for ${account.identity ?? "unconfigured identity"}`,
      );
      try {
        await manager.start(ctx.abortSignal);
        await new Promise<void>((resolve) => {
          if (ctx.abortSignal?.aborted) {
            resolve();
            return;
          }
          ctx.abortSignal?.addEventListener("abort", () => resolve(), { once: true });
        });
      } finally {
        await manager.stop();
        unregisterFaceTimeCallManager(account.accountId, manager);
      }
    },
  },
};
