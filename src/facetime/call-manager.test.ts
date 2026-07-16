import type { OpenClawConfig } from "openclaw/plugin-sdk";
import type { PluginRuntime, RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import type { RealtimeVoiceBridgeSession } from "openclaw/plugin-sdk/realtime-voice";
import { describe, expect, it, vi } from "vitest";
import { FaceTimeCallManager, isFaceTimeCallerAllowed } from "./call-manager.js";
import { FaceTimeNativeBridge } from "./native-bridge.js";
import type { FaceTimeNativeCommand, ResolvedFaceTimeAccount } from "./types.js";

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as unknown as RuntimeLogger;

class FakeBridge extends FaceTimeNativeBridge {
  commands: FaceTimeNativeCommand[] = [];
  override get running() {
    return true;
  }
  override async start(): Promise<void> {}
  override sendCommand(command: FaceTimeNativeCommand): void {
    this.commands.push(command);
  }
  override sendAudio(): boolean {
    return true;
  }
  override async stop(): Promise<void> {}
}

function account(overrides: Partial<ResolvedFaceTimeAccount["config"]> = {}): ResolvedFaceTimeAccount {
  return {
    accountId: "default",
    enabled: true,
    identity: "agent@example.com",
    config: {
      identity: "agent@example.com",
      inboundPolicy: "allowlist",
      allowFrom: ["caller@example.com"],
      autoAnswer: true,
      ...overrides,
    },
    helperPath: "/tmp/helper",
    blackHoleDevice: "BlackHole 2ch",
  };
}

const fakeSession = {
  connect: vi.fn(),
  close: vi.fn(),
  sendAudio: vi.fn(),
  sendUserMessage: vi.fn(),
  acknowledgeMark: vi.fn(),
  handleBargeIn: vi.fn(),
  setMediaTimestamp: vi.fn(),
  submitToolResult: vi.fn(),
  triggerGreeting: vi.fn(),
  bridge: { isConnected: () => true },
} as unknown as RealtimeVoiceBridgeSession;

describe("FaceTime call policy and lifecycle", () => {
  it("fails closed for unknown callers and supports wildcard/open policies", () => {
    expect(
      isFaceTimeCallerAllowed({
        peer: "caller@example.com",
        policy: "allowlist",
        allowFrom: ["Caller@Example.com"],
      }),
    ).toBe(true);
    expect(
      isFaceTimeCallerAllowed({ peer: "+14155550123", policy: "allowlist", allowFrom: [] }),
    ).toBe(false);
    expect(isFaceTimeCallerAllowed({ peer: "x@y.com", policy: "open", allowFrom: [] })).toBe(true);
    expect(
      isFaceTimeCallerAllowed({ peer: "x@y.com", policy: "disabled", allowFrom: ["*"] }),
    ).toBe(false);
  });

  it("auto-answers an allowed caller and rejects a concurrent caller as busy", async () => {
    const bridge = new FakeBridge({ helperPath: "/tmp/helper", logger });
    const startRealtime = vi.fn(async () => fakeSession);
    const manager = new FaceTimeCallManager({
      account: account(),
      cfg: {} as OpenClawConfig,
      runtime: {} as PluginRuntime,
      logger,
      bridge,
      startRealtime,
    });
    await manager.start();
    bridge.emit("event", { type: "incoming", callId: "first", peer: "caller@example.com" });
    await vi.waitFor(() =>
      expect(bridge.commands).toContainEqual({ type: "accept", callId: "first" }),
    );
    bridge.emit("event", { type: "incoming", callId: "second", peer: "other@example.com" });
    await vi.waitFor(() =>
      expect(bridge.commands).toContainEqual({ type: "decline", callId: "second", reason: "busy" }),
    );
    bridge.emit("event", {
      type: "call-state",
      callId: "first",
      state: "connected",
      peer: "caller@example.com",
    });
    await vi.waitFor(() => expect(startRealtime).toHaveBeenCalledOnce());
    expect(manager.snapshot().active).toMatchObject({ id: "first", state: "connected" });
    await manager.stop();
  });

  it("declines a disallowed caller without occupying the identity", async () => {
    const bridge = new FakeBridge({ helperPath: "/tmp/helper", logger });
    const manager = new FaceTimeCallManager({
      account: account(),
      cfg: {} as OpenClawConfig,
      runtime: {} as PluginRuntime,
      logger,
      bridge,
    });
    await manager.start();
    bridge.emit("event", { type: "incoming", callId: "blocked", peer: "stranger@example.com" });
    await vi.waitFor(() =>
      expect(bridge.commands).toContainEqual({
        type: "decline",
        callId: "blocked",
        reason: "caller not allowed",
      }),
    );
    expect(manager.snapshot().active).toBeNull();
    await manager.stop();
  });
});
