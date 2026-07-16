import type { OpenClawConfig } from "openclaw/plugin-sdk";
import { describe, expect, it } from "vitest";
import { listFaceTimeAccountIds, resolveFaceTimeAccount } from "./accounts.js";

describe("FaceTime accounts", () => {
  const cfg = {
    channels: {
      facetime: {
        enabled: true,
        identity: "default@example.com",
        blackHoleDevice: "BlackHole 2ch",
        realtime: { provider: "openai", agentId: "main" },
        accounts: {
          support: {
            identity: "+14155550123",
            realtime: { agentId: "support" },
          },
        },
      },
    },
  } as unknown as OpenClawConfig;

  it("lists base and named accounts", () => {
    expect(listFaceTimeAccountIds(cfg)).toEqual(["default", "support"]);
  });

  it("merges account-scoped realtime settings without crossing identities", () => {
    const account = resolveFaceTimeAccount({ cfg, accountId: "support", cwd: "/tmp/plugin" });
    expect(account.identity).toBe("+14155550123");
    expect(account.config.realtime).toMatchObject({ provider: "openai", agentId: "support" });
    expect(account.helperPath).toBe("/tmp/plugin/native/bin/openclaw-facetime-bridge");
  });
});
