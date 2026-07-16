import type { OpenClawConfig } from "openclaw/plugin-sdk";
import type {
  ChannelSetupWizardAdapter,
  WizardPrompter,
} from "openclaw/plugin-sdk/setup";
import {
  DEFAULT_ACCOUNT_ID,
  normalizeAccountId,
  promptAccountId,
} from "openclaw/plugin-sdk/setup";
import {
  listFaceTimeAccountIds,
  resolveDefaultFaceTimeAccountId,
  resolveFaceTimeAccountForStatus,
} from "./facetime/accounts.js";

function readFaceTimeSection(cfg: OpenClawConfig): Record<string, unknown> {
  const value = (cfg.channels as Record<string, unknown> | undefined)?.facetime;
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function setFaceTimeAccountPatch(
  cfg: OpenClawConfig,
  accountId: string,
  patch: Record<string, unknown>,
): OpenClawConfig {
  const section = readFaceTimeSection(cfg);
  if (accountId === DEFAULT_ACCOUNT_ID) {
    return {
      ...cfg,
      channels: {
        ...cfg.channels,
        facetime: { ...section, ...patch },
      } as OpenClawConfig["channels"],
    };
  }
  const accounts =
    section.accounts && typeof section.accounts === "object"
      ? (section.accounts as Record<string, unknown>)
      : {};
  const current =
    accounts[accountId] && typeof accounts[accountId] === "object"
      ? (accounts[accountId] as Record<string, unknown>)
      : {};
  return {
    ...cfg,
    channels: {
      ...cfg.channels,
      facetime: {
        ...section,
        enabled: true,
        accounts: { ...accounts, [accountId]: { ...current, ...patch } },
      },
    } as OpenClawConfig["channels"],
  };
}

async function promptAllowFrom(prompter: WizardPrompter, existing: string[]): Promise<string[]> {
  const value = String(
    await prompter.text({
      message: "Allowed caller phone numbers or Apple Account emails (comma-separated)",
      initialValue: existing.join(", "),
      validate: (raw) => (raw?.trim() ? undefined : "At least one caller is required"),
    }),
  );
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const faceTimeOnboardingAdapter: ChannelSetupWizardAdapter = {
  channel: "facetime",
  getStatus: async ({ cfg }) => {
    const configured = listFaceTimeAccountIds(cfg).some((accountId) =>
      Boolean(resolveFaceTimeAccountForStatus({ cfg, accountId }).identity),
    );
    return {
      channel: "facetime",
      configured,
      statusLines: [`FaceTime: ${configured ? "configured" : "needs signed-in identity"}`],
      selectionHint: configured ? "configured · macOS only" : "macOS · realtime voice",
      quickstartScore: configured ? 1 : 20,
    };
  },
  configure: async ({
    cfg,
    prompter,
    accountOverrides,
    shouldPromptAccountIds,
  }) => {
    const override = accountOverrides.facetime?.trim();
    let accountId = override
      ? normalizeAccountId(override)
      : resolveDefaultFaceTimeAccountId(cfg);
    if (shouldPromptAccountIds && !override) {
      accountId = await promptAccountId({
        cfg,
        prompter,
        label: "FaceTime",
        currentId: accountId,
        listAccountIds: listFaceTimeAccountIds,
        defaultAccountId: resolveDefaultFaceTimeAccountId(cfg),
      });
    }
    const current = resolveFaceTimeAccountForStatus({ cfg, accountId });
    await prompter.note(
      [
        "FaceTime must already be signed in on this Mac.",
        "The native helper needs Screen & System Audio Recording and Accessibility permission.",
        "Install BlackHole 2ch, reboot, and select BlackHole 2ch as FaceTime's microphone.",
        "Build the helper with: npm run build:native",
      ].join("\n"),
      "FaceTime Audio prerequisites",
    );
    const identity = String(
      await prompter.text({
        message: "Signed-in FaceTime phone number or Apple Account email",
        initialValue: current.identity,
        validate: (value) => (value?.trim() ? undefined : "Required"),
      }),
    ).trim();
    const inboundPolicy = String(
      await prompter.select({
        message: "Inbound call policy",
        initialValue: current.config.inboundPolicy ?? "allowlist",
        options: [
          { value: "allowlist", label: "Allowlist (recommended)" },
          { value: "open", label: "Open — answer any caller" },
          { value: "disabled", label: "Disabled — outbound only" },
        ],
      }),
    );
    if (inboundPolicy === "open") {
      const confirmed = Boolean(
        await prompter.confirm({
          message: "Open policy answers any detected caller before identity can be verified. Continue?",
          initialValue: false,
        }),
      );
      if (!confirmed) {
        throw new Error("Open inbound policy was not confirmed");
      }
    }
    const allowFrom =
      inboundPolicy === "allowlist"
        ? await promptAllowFrom(prompter, current.config.allowFrom ?? [])
        : current.config.allowFrom ?? [];
    const autoAnswer = Boolean(
      await prompter.confirm({
        message: "Answer allowed callers automatically?",
        initialValue: current.config.autoAnswer !== false,
      }),
    );
    const provider = String(
      await prompter.text({
        message: "OpenClaw realtime voice provider",
        initialValue: current.config.realtime?.provider ?? "openai",
        validate: (value) => (value?.trim() ? undefined : "Required"),
      }),
    ).trim();
    const agentId = String(
      await prompter.text({
        message: "OpenClaw agent used by voice consults",
        initialValue: current.config.realtime?.agentId ?? "main",
        validate: (value) => (value?.trim() ? undefined : "Required"),
      }),
    ).trim();
    const next = setFaceTimeAccountPatch(cfg, accountId, {
      enabled: true,
      identity,
      inboundPolicy,
      allowFrom,
      autoAnswer,
      blackHoleDevice: current.blackHoleDevice,
      realtime: {
        ...current.config.realtime,
        provider,
        agentId,
        toolPolicy: current.config.realtime?.toolPolicy ?? "read-only",
      },
    });
    await prompter.note(
      [
        `Account: ${accountId}`,
        `Identity: ${identity}`,
        `Inbound: ${inboundPolicy}${autoAnswer ? " · auto-answer" : " · manual answer"}`,
        `Realtime provider: ${provider}`,
        "Next: run npm run build:native, grant permissions, start the Gateway, then use facetime_call action=preflight.",
      ].join("\n"),
      "FaceTime setup saved",
    );
    return { cfg: next, accountId };
  },
  disable: (cfg) => ({
    ...cfg,
    channels: {
      ...cfg.channels,
      facetime: { ...readFaceTimeSection(cfg), enabled: false },
    } as OpenClawConfig["channels"],
  }),
};
