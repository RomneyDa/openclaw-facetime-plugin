import type { OpenClawConfig, RuntimeEnv } from "openclaw/plugin-sdk";
import type { WizardPrompter } from "openclaw/plugin-sdk/setup";
import { describe, expect, it, vi } from "vitest";
import { faceTimeOnboardingAdapter } from "./onboarding.js";

function prompter(params: {
  policy?: "allowlist" | "open" | "disabled";
  confirmOpen?: boolean;
} = {}): WizardPrompter {
  const policy = params.policy ?? "allowlist";
  const textValues = ["agent@example.com"];
  if (policy === "allowlist") {
    textValues.push("caller@example.com");
  }
  textValues.push("openai", "main");
  const confirmations = policy === "open"
    ? [params.confirmOpen ?? true, true]
    : [true];
  return {
    note: vi.fn(async () => {}),
    text: vi.fn(async () => textValues.shift()),
    select: vi.fn(async () => policy),
    confirm: vi.fn(async () => confirmations.shift()),
  } as unknown as WizardPrompter;
}

async function configure(cfg: OpenClawConfig, prompts: WizardPrompter) {
  if (!faceTimeOnboardingAdapter.configure) {
    throw new Error("FaceTime setup adapter is missing configure");
  }
  return await faceTimeOnboardingAdapter.configure({
    cfg,
    prompter: prompts,
    accountOverrides: {},
    shouldPromptAccountIds: false,
    runtime: {} as RuntimeEnv,
    forceAllowFrom: false,
  });
}

describe("FaceTime setup wizard", () => {
  it("creates an allowlisted default account without modifying unrelated config", async () => {
    const cfg = { gateway: { mode: "local" }, channels: { telegram: { enabled: true } } } as OpenClawConfig;
    const result = await configure(cfg, prompter());
    expect(result.accountId).toBe("default");
    expect(result.cfg).toMatchObject({
      gateway: { mode: "local" },
      channels: {
        telegram: { enabled: true },
        facetime: {
          identity: "agent@example.com",
          inboundPolicy: "allowlist",
          allowFrom: ["caller@example.com"],
          autoAnswer: true,
          realtime: { provider: "openai", agentId: "main", toolPolicy: "read-only" },
        },
      },
    });
  });

  it("is idempotent when rerun with the same answers", async () => {
    const first = await configure({} as OpenClawConfig, prompter());
    const second = await configure(first.cfg, prompter());
    expect(second.cfg).toEqual(first.cfg);
  });

  it("requires explicit confirmation before enabling open inbound calls", async () => {
    const cfg = { gateway: { mode: "local" } } as OpenClawConfig;
    await expect(configure(cfg, prompter({ policy: "open", confirmOpen: false }))).rejects.toThrow(
      /not confirmed/,
    );
    expect(cfg).toEqual({ gateway: { mode: "local" } });
  });

  it("does not mutate configuration when prompting is cancelled", async () => {
    const cfg = { gateway: { mode: "local" } } as OpenClawConfig;
    const prompts = prompter();
    vi.mocked(prompts.text).mockRejectedValueOnce(new Error("cancelled"));
    await expect(configure(cfg, prompts)).rejects.toThrow("cancelled");
    expect(cfg).toEqual({ gateway: { mode: "local" } });
  });
});
