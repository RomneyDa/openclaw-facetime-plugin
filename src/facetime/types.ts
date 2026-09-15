export const FACETIME_CHANNEL_ID = "facetime" as const;
export const FACETIME_DEFAULT_HELPER_RELATIVE_PATH =
  "native/bin/openclaw-facetime-bridge";
export const FACETIME_AUDIO_FORMAT = {
  encoding: "pcm16" as const,
  sampleRateHz: 24_000 as const,
  channels: 1 as const,
};

export type FaceTimeInboundPolicy = "allowlist" | "open" | "disabled";
export type FaceTimeToolPolicy = "none" | "read-only" | "owner";

export type FaceTimeRealtimeConfig = {
  provider?: string;
  model?: string;
  voice?: string;
  instructions?: string;
  greeting?: string;
  agentId?: string;
  toolPolicy?: FaceTimeToolPolicy;
  providers?: Record<string, Record<string, unknown> | undefined>;
};

export type FaceTimeAvatarConfig = {
  enabled?: boolean;
  port?: number;
  audioDelayMs?: number;
  maxBufferedBytes?: number;
  obs?: {
    enabled?: boolean;
    url?: string;
    passwordEnv?: string;
    sceneName?: string;
    sourceName?: string;
    width?: number;
    height?: number;
    autoStartVirtualCamera?: boolean;
  };
};

export type FaceTimeAccountConfig = {
  name?: string;
  enabled?: boolean;
  identity?: string;
  inboundPolicy?: FaceTimeInboundPolicy;
  allowFrom?: string[];
  autoAnswer?: boolean;
  blackHoleDevice?: string;
  maxCallDurationMs?: number;
  dialTimeoutMs?: number;
  realtime?: FaceTimeRealtimeConfig;
  avatar?: FaceTimeAvatarConfig;
  accounts?: Record<string, FaceTimeAccountConfig | undefined>;
  defaultAccount?: string;
};

export type ResolvedFaceTimeAccount = {
  accountId: string;
  enabled: boolean;
  name?: string;
  identity?: string;
  config: FaceTimeAccountConfig;
  helperPath: string;
  blackHoleDevice: string;
};

export type FaceTimeNativeCheck = {
  id: string;
  ok: boolean;
  message: string;
};

export type FaceTimeProbe = {
  ok: boolean;
  platform: NodeJS.Platform;
  helperPath: string;
  checks: FaceTimeNativeCheck[];
  error?: string;
};

export type FaceTimeCallDirection = "inbound" | "outbound";
export type FaceTimeCallState =
  | "ringing"
  | "dialing"
  | "connecting"
  | "connected"
  | "ending"
  | "ended"
  | "failed";

export type FaceTimeCallSnapshot = {
  id: string;
  accountId: string;
  direction: FaceTimeCallDirection;
  peer: string;
  state: FaceTimeCallState;
  startedAt: string;
  connectedAt?: string;
  endedAt?: string;
  reason?: string;
  realtimeProvider?: string;
  inputBytes: number;
  outputBytes: number;
  outputDroppedBytes?: number;
  avatarDroppedBytes?: number;
};

export type FaceTimeNativeEvent =
  | { type: "ready"; pid: number }
  | { type: "incoming"; callId: string; peer: string }
  | {
      type: "call-state";
      callId: string;
      state: "ringing" | "dialing" | "connecting" | "connected" | "ended" | "failed";
      peer?: string;
      reason?: string;
    }
  | { type: "audio-cleared"; callId?: string }
  | { type: "error"; code: string; message: string; fatal?: boolean }
  | { type: "diagnostics"; checks: FaceTimeNativeCheck[] };

export type FaceTimeNativeCommand =
  | {
      type: "configure";
      identity: string;
      blackHoleDevice: string;
      sampleRateHz: 24_000;
      channels: 1;
    }
  | { type: "dial"; callId: string; target: string }
  | { type: "accept"; callId: string }
  | { type: "decline"; callId: string; reason?: string }
  | { type: "hangup"; callId: string }
  | { type: "clear-audio"; callId?: string }
  | { type: "diagnose" }
  | { type: "shutdown" };
