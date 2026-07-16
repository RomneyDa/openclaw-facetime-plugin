import {
  applyAccountNameToChannelSection,
  DEFAULT_ACCOUNT_ID,
  deleteAccountFromConfigSection,
  normalizeAccountId,
  setAccountEnabledInConfigSection,
  type ChannelPlugin,
} from "openclaw/plugin-sdk/core";
import {
  listFaceTimeAccountIds,
  resolveDefaultFaceTimeAccountId,
  resolveFaceTimeAccountForStatus,
} from "./facetime/accounts.js";
import { FaceTimeChannelConfigSchema } from "./facetime/config.js";
import type { FaceTimeProbe, ResolvedFaceTimeAccount } from "./facetime/types.js";
import { faceTimeOnboardingAdapter } from "./onboarding.js";

export function createFaceTimePluginBase(): ChannelPlugin<ResolvedFaceTimeAccount, FaceTimeProbe> {
  return {
    id: "facetime",
    meta: {
      id: "facetime",
      label: "FaceTime",
      selectionLabel: "FaceTime Audio (macOS)",
      docsPath: "/channels/facetime",
      blurb: "Answer and place FaceTime Audio calls through a realtime voice agent on this Mac.",
      aliases: ["facetime-audio"],
      showInSetup: true,
      quickstartAllowFrom: true,
    },
    setupWizard: faceTimeOnboardingAdapter,
    capabilities: {
      chatTypes: ["direct"],
      reactions: false,
      media: false,
      blockStreaming: true,
    },
    reload: { configPrefixes: ["channels.facetime"] },
    configSchema: FaceTimeChannelConfigSchema,
    config: {
      listAccountIds: listFaceTimeAccountIds,
      resolveAccount: (cfg, accountId) => resolveFaceTimeAccountForStatus({ cfg, accountId }),
      defaultAccountId: resolveDefaultFaceTimeAccountId,
      setAccountEnabled: ({ cfg, accountId, enabled }) =>
        setAccountEnabledInConfigSection({
          cfg,
          sectionKey: "facetime",
          accountId,
          enabled,
          allowTopLevel: true,
        }),
      deleteAccount: ({ cfg, accountId }) =>
        deleteAccountFromConfigSection({
          cfg,
          sectionKey: "facetime",
          accountId,
          clearBaseFields: ["identity", "name", "allowFrom"],
        }),
      isConfigured: (account) => Boolean(account.identity?.trim()),
      describeAccount: (account) => ({
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured: Boolean(account.identity),
        identity: account.identity,
        helperPath: account.helperPath,
        blackHoleDevice: account.blackHoleDevice,
      }),
      resolveAllowFrom: ({ cfg, accountId }) =>
        resolveFaceTimeAccountForStatus({ cfg, accountId }).config.allowFrom ?? [],
      formatAllowFrom: ({ allowFrom }) =>
        allowFrom.map((entry) => String(entry).trim()).filter(Boolean),
    },
    setup: {
      resolveAccountId: ({ accountId }) => normalizeAccountId(accountId),
      applyAccountName: ({ cfg, accountId, name }) =>
        applyAccountNameToChannelSection({
          cfg,
          channelKey: "facetime",
          accountId,
          name,
        }),
      validateInput: ({ accountId }) =>
        accountId === DEFAULT_ACCOUNT_ID || accountId.trim()
          ? null
          : "FaceTime requires an account id",
      applyAccountConfig: ({ cfg }) => cfg,
    },
  };
}
