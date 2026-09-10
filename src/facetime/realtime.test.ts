import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { PluginRuntime, RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import type { RealtimeVoiceBridgeSession } from "./realtime-sdk.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FaceTimeOutputPacer } from "./output-pacer.js";
import { startFaceTimeRealtimeSession } from "./realtime.js";
import type { ResolvedFaceTimeAccount } from "./types.js";

const sdk = vi.hoisted(() => ({
  createSession: vi.fn(),
  consultAgent: vi.fn(),
  resolveProvider: vi.fn(),
  resolveTools: vi.fn(),
  resolveToolsAllow: vi.fn(),
}));

vi.mock("./realtime-sdk.js", () => ({
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
  let output: FaceTimeOutputPacer;

  beforeEach(() => {
    vi.clearAllMocks();
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
    output = {
      isOpen: true,
      send: vi.fn(),
      clear: vi.fn(),
    } as unknown as FaceTimeOutputPacer;
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
      output,
    });
  }

  it("uses PCM16 24 kHz mono and delegates output to the shared pacer", async () => {
    const result = await start();
    expect(result).toBe(session);
    expect(session.connect).toHaveBeenCalledOnce();
    expect(options.audioFormat).toEqual({ encoding: "pcm16", sampleRateHz: 24_000, channels: 1 });
    const audio = Buffer.from([1, 2, 3, 4]);
    options.audioSink.sendAudio(audio);
    expect(output.send).toHaveBeenCalledWith(audio);
  });

  it("clears queued BlackHole audio on provider interruption", async () => {
    await start();
    options.audioSink.clearAudio();
    expect(output.clear).toHaveBeenCalledOnce();
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

  it("uses a hashed caller id in consult state and metadata", async () => {
    sdk.consultAgent.mockResolvedValue({ answer: "ok" });
    await start("read-only");
    await options.onToolCall({
      name: "openclaw_agent_consult",
      callId: "tool-1",
      itemId: "item-1",
      args: { question: "status" },
    });
    const consult = sdk.consultAgent.mock.calls[0]?.[0];
    expect(consult.sessionKey).toMatch(/^agent:main:facetime:direct:[a-f0-9]{12}$/u);
    expect(consult.surface).toMatch(/caller [a-f0-9]{12}/u);
    expect(JSON.stringify(consult)).not.toContain("caller@example.com");
  });
});
