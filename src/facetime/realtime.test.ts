import type { OpenClawConfig } from "openclaw/plugin-sdk";
import type { PluginRuntime, RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import type { RealtimeVoiceBridgeSession } from "openclaw/plugin-sdk/realtime-voice";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FaceTimeNativeBridge } from "./native-bridge.js";
import { startFaceTimeRealtimeSession } from "./realtime.js";
import type { ResolvedFaceTimeAccount } from "./types.js";

const sdk = vi.hoisted(() => ({
  createSession: vi.fn(),
  consultAgent: vi.fn(),
  resolveProvider: vi.fn(),
  resolveTools: vi.fn(),
  resolveToolsAllow: vi.fn(),
}));

vi.mock("openclaw/plugin-sdk/realtime-voice", () => ({
  REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME: "openclaw_agent_consult",
  consultRealtimeVoiceAgent: sdk.consultAgent,
  createRealtimeVoiceBridgeSession: sdk.createSession,
  resolveConfiguredRealtimeVoiceProvider: sdk.resolveProvider,
  resolveRealtimeVoiceAgentConsultTools: sdk.resolveTools,
  resolveRealtimeVoiceAgentConsultToolsAllow: sdk.resolveToolsAllow,
}));

type SessionOptions = {
  audioFormat: { encoding: string; sampleRateHz: number; channels: number };
  audioSink: {
    isOpen(): boolean;
    sendAudio(audio: Buffer): void;
    clearAudio(): void;
  };
  onToolCall(event: { name: string; callId?: string; itemId: string; args: unknown }): Promise<void>;
};

function account(toolPolicy: "none" | "read-only" | "owner" = "read-only"): ResolvedFaceTimeAccount {
  return {
    accountId: "default",
    enabled: true,
    identity: "agent@example.com",
    config: {
      identity: "agent@example.com",
      realtime: { provider: "mock", agentId: "main", toolPolicy },
    },
    helperPath: "/tmp/helper",
    blackHoleDevice: "BlackHole 2ch",
  };
}

describe("FaceTime realtime bridge", () => {
  let options: SessionOptions;
  let session: RealtimeVoiceBridgeSession;
  let nativeBridge: FaceTimeNativeBridge;
  let outputBytes: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    outputBytes = vi.fn();
    session = {
      connect: vi.fn(async () => {}),
      close: vi.fn(),
      sendAudio: vi.fn(),
      sendUserMessage: vi.fn(),
      acknowledgeMark: vi.fn(),
      handleBargeIn: vi.fn(),
      setMediaTimestamp: vi.fn(),
      submitToolResult: vi.fn(async () => {}),
      triggerGreeting: vi.fn(),
      bridge: { isConnected: () => true },
    } as unknown as RealtimeVoiceBridgeSession;
    nativeBridge = {
      running: true,
      sendAudio: vi.fn(() => true),
      sendCommand: vi.fn(),
    } as unknown as FaceTimeNativeBridge;
    sdk.resolveProvider.mockReturnValue({ provider: { id: "mock" }, providerConfig: {} });
    sdk.resolveTools.mockReturnValue([{ name: "openclaw_agent_consult" }]);
    sdk.resolveToolsAllow.mockReturnValue(["safe-read-only"]);
    sdk.createSession.mockImplementation((value: SessionOptions) => {
      options = value;
      return session;
    });
  });

  async function start(toolPolicy: "none" | "read-only" | "owner" = "read-only") {
    return await startFaceTimeRealtimeSession({
      cfg: {} as OpenClawConfig,
      runtime: { agent: {} } as PluginRuntime,
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as RuntimeLogger,
      account: account(toolPolicy),
      callId: "call-1",
      peer: "caller@example.com",
      nativeBridge,
      onOutputAudio: outputBytes,
    });
  }

  it("uses PCM16 24 kHz mono and counts only audio accepted by the native sink", async () => {
    const result = await start();
    expect(result).toBe(session);
    expect(session.connect).toHaveBeenCalledOnce();
    expect(options.audioFormat).toEqual({ encoding: "pcm16", sampleRateHz: 24_000, channels: 1 });
    const audio = Buffer.from([1, 2, 3, 4]);
    options.audioSink.sendAudio(audio);
    expect(nativeBridge.sendAudio).toHaveBeenCalledWith(audio);
    expect(outputBytes).toHaveBeenCalledWith(4);
    vi.mocked(nativeBridge.sendAudio).mockReturnValue(false);
    options.audioSink.sendAudio(audio);
    expect(outputBytes).toHaveBeenCalledTimes(1);
  });

  it("clears queued BlackHole audio on provider interruption", async () => {
    await start();
    options.audioSink.clearAudio();
    expect(nativeBridge.sendCommand).toHaveBeenCalledWith({ type: "clear-audio", callId: "call-1" });
  });

  it("fails closed for provider tool calls that are unavailable by policy", async () => {
    await start("none");
    await options.onToolCall({
      name: "openclaw_agent_consult",
      callId: "tool-1",
      itemId: "item-1",
      args: { question: "secret?" },
    });
    expect(session.submitToolResult).toHaveBeenCalledWith("tool-1", {
      error: "Tool openclaw_agent_consult is not available",
    });
    expect(sdk.consultAgent).not.toHaveBeenCalled();
  });
});
