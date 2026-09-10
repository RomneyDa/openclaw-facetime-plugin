import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";

// OpenClaw 2026.9.3 still ships this runtime module, but intentionally omits
// declarations because it is a production-private seam for official plugins.
// Keep the unsupported import isolated so the external-plugin blocker is
// explicit and all FaceTime code remains typed against the narrow shape below.
// @ts-expect-error OpenClaw intentionally does not publish declarations for this subpath.
import * as privateRealtimeVoiceSdk from "openclaw/plugin-sdk/realtime-voice";

export type RealtimeVoiceToolCallEvent = {
  name: string;
  callId?: string;
  itemId: string;
  args: unknown;
};

export type RealtimeVoiceBridgeSession = {
  connect(): Promise<void>;
  close(): void;
  sendAudio(audio: Uint8Array): void;
  sendUserMessage(message: string): void;
  acknowledgeMark(...args: unknown[]): void;
  handleBargeIn(...args: unknown[]): void;
  setMediaTimestamp(...args: unknown[]): void;
  submitToolResult(callId: string, result: unknown): Promise<void>;
  triggerGreeting(...args: unknown[]): void;
  bridge: { isConnected(): boolean };
};

type RealtimeVoiceSessionParams = {
  provider: unknown;
  cfg: OpenClawConfig;
  providerConfig: unknown;
  audioFormat: { encoding: "pcm16"; sampleRateHz: 24_000; channels: 1 };
  instructions: string;
  initialGreetingInstructions: string;
  autoRespondToAudio: boolean;
  interruptResponseOnInputAudio: boolean;
  triggerGreetingOnReady: boolean;
  markStrategy: "ack-immediately";
  tools: unknown[];
  audioSink: {
    isOpen(): boolean;
    sendAudio(audio: Buffer): void;
    clearAudio(): void;
  };
  onTranscript(role: "user" | "assistant", text: string, final: boolean): void;
  onToolCall(event: RealtimeVoiceToolCallEvent): Promise<void>;
  onReady(): void;
  onError(error: Error): void;
  onClose?: (reason: "completed" | "error") => void;
};

type PrivateRealtimeVoiceSdk = {
  REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME: string;
  consultRealtimeVoiceAgent(params: Record<string, unknown>): Promise<unknown>;
  createRealtimeVoiceBridgeSession(params: RealtimeVoiceSessionParams): RealtimeVoiceBridgeSession;
  resolveConfiguredRealtimeVoiceProvider(params: Record<string, unknown>): {
    provider: { id: string };
    providerConfig: unknown;
  };
  resolveRealtimeVoiceAgentConsultTools(policy: string): unknown[];
  resolveRealtimeVoiceAgentConsultToolsAllow(policy: string): string[];
};

const sdk = privateRealtimeVoiceSdk as unknown as PrivateRealtimeVoiceSdk;

export const REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME = sdk.REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME;
export const consultRealtimeVoiceAgent = sdk.consultRealtimeVoiceAgent;
export const createRealtimeVoiceBridgeSession = sdk.createRealtimeVoiceBridgeSession;
export const resolveConfiguredRealtimeVoiceProvider = sdk.resolveConfiguredRealtimeVoiceProvider;
export const resolveRealtimeVoiceAgentConsultTools = sdk.resolveRealtimeVoiceAgentConsultTools;
export const resolveRealtimeVoiceAgentConsultToolsAllow = sdk.resolveRealtimeVoiceAgentConsultToolsAllow;
