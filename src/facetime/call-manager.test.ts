import type { OpenClawConfig } from "openclaw/plugin-sdk";
import type { PluginRuntime, RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import type { RealtimeVoiceBridgeSession } from "openclaw/plugin-sdk/realtime-voice";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

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
    const logged = JSON.stringify(vi.mocked(logger.info).mock.calls);
    expect(logged).not.toContain("caller@example.com");
    expect(logged).not.toContain("other@example.com");
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

  it("enforces the configured outbound dial timeout and releases the identity", async () => {
    vi.useFakeTimers();
    const bridge = new FakeBridge({ helperPath: "/tmp/helper", logger });
    const manager = new FaceTimeCallManager({
      account: account({ dialTimeoutMs: 25 }),
      cfg: {} as OpenClawConfig,
      runtime: {} as PluginRuntime,
      logger,
      bridge,
    });
    await manager.start();
    const call = await manager.dial("target@example.com");
    await vi.advanceTimersByTimeAsync(25);
    expect(bridge.commands).toContainEqual({ type: "hangup", callId: call.id });
    expect(manager.snapshot()).toMatchObject({
      active: null,
      recent: [{ id: call.id, state: "failed", reason: "dial timed out" }],
    });
    await manager.stop();
  });

  it("starts one realtime session for duplicate connected events and forwards caller audio", async () => {
    const bridge = new FakeBridge({ helperPath: "/tmp/helper", logger });
    let resolveRealtime!: (session: RealtimeVoiceBridgeSession) => void;
    const startRealtime = vi.fn(
      () =>
        new Promise<RealtimeVoiceBridgeSession>((resolve) => {
          resolveRealtime = resolve;
        }),
    );
    const manager = new FaceTimeCallManager({
      account: account(),
      cfg: {} as OpenClawConfig,
      runtime: {} as PluginRuntime,
      logger,
      bridge,
      startRealtime,
    });
    await manager.start();
    bridge.emit("event", { type: "incoming", callId: "call", peer: "caller@example.com" });
    await vi.waitFor(() => expect(bridge.commands).toContainEqual({ type: "accept", callId: "call" }));
    const connected = {
      type: "call-state" as const,
      callId: "call",
      state: "connected" as const,
      peer: "caller@example.com",
    };
    bridge.emit("event", connected);
    bridge.emit("event", connected);
    await vi.waitFor(() => expect(startRealtime).toHaveBeenCalledOnce());
    resolveRealtime(fakeSession);
    await vi.waitFor(() => expect(manager.snapshot().active?.state).toBe("connected"));
    bridge.emit("audio", Buffer.from([1, 2, 3, 4]));
    expect(fakeSession.sendAudio).toHaveBeenCalledWith(Buffer.from([1, 2, 3, 4]));
    expect(manager.snapshot().active?.inputBytes).toBe(4);
    await manager.stop();
  });

  it("hangs up and records a failed call when realtime startup fails", async () => {
    const bridge = new FakeBridge({ helperPath: "/tmp/helper", logger });
    const manager = new FaceTimeCallManager({
      account: account(),
      cfg: {} as OpenClawConfig,
      runtime: {} as PluginRuntime,
      logger,
      bridge,
      startRealtime: vi.fn(async () => {
        throw new Error("provider unavailable");
      }),
    });
    await manager.start();
    const call = await manager.dial("target@example.com");
    bridge.emit("event", {
      type: "call-state",
      callId: call.id,
      state: "connected",
      peer: "target@example.com",
    });
    await vi.waitFor(() => expect(manager.snapshot().active).toBeNull());
    expect(bridge.commands).toContainEqual({ type: "hangup", callId: call.id });
    expect(manager.snapshot().recent[0]).toMatchObject({
      id: call.id,
      state: "failed",
      reason: "realtime startup failed: provider unavailable",
    });
    await manager.stop();
  });

  it("closes a late realtime session after the native call has already ended", async () => {
    const bridge = new FakeBridge({ helperPath: "/tmp/helper", logger });
    let resolveRealtime!: (session: RealtimeVoiceBridgeSession) => void;
    const manager = new FaceTimeCallManager({
      account: account(),
      cfg: {} as OpenClawConfig,
      runtime: {} as PluginRuntime,
      logger,
      bridge,
      startRealtime: vi.fn(
        () =>
          new Promise<RealtimeVoiceBridgeSession>((resolve) => {
            resolveRealtime = resolve;
          }),
      ),
    });
    await manager.start();
    const call = await manager.dial("target@example.com");
    bridge.emit("event", {
      type: "call-state",
      callId: call.id,
      state: "connected",
      peer: "target@example.com",
    });
    await vi.waitFor(() => expect(resolveRealtime).toBeTypeOf("function"));
    bridge.emit("event", { type: "call-state", callId: call.id, state: "ended" });
    await vi.waitFor(() => expect(manager.snapshot().active).toBeNull());
    resolveRealtime(fakeSession);
    await vi.waitFor(() => expect(fakeSession.close).toHaveBeenCalledOnce());
    await manager.stop();
  });

  it("keeps only ten terminal snapshots through a synthetic lifecycle soak", async () => {
    const bridge = new FakeBridge({ helperPath: "/tmp/helper", logger });
    const manager = new FaceTimeCallManager({
      account: account(),
      cfg: {} as OpenClawConfig,
      runtime: {} as PluginRuntime,
      logger,
      bridge,
      startRealtime: vi.fn(async () => fakeSession),
    });
    await manager.start();
    for (let index = 0; index < 25; index += 1) {
      const call = await manager.dial(`target${index}@example.com`);
      bridge.emit("event", {
        type: "call-state",
        callId: call.id,
        state: "connected",
        peer: `target${index}@example.com`,
      });
      await vi.waitFor(() => expect(manager.snapshot().active?.state).toBe("connected"));
      bridge.emit("event", {
        type: "call-state",
        callId: call.id,
        state: "ended",
        reason: "synthetic remote hangup",
      });
      await vi.waitFor(() => expect(manager.snapshot().active).toBeNull());
    }
    const recent = manager.snapshot().recent;
    expect(recent).toHaveLength(10);
    expect(recent[0]?.peer).toBe("target24@example.com");
    expect(recent[9]?.peer).toBe("target15@example.com");
    await manager.stop();
    expect(bridge.listenerCount("event")).toBe(0);
    expect(bridge.listenerCount("audio")).toBe(0);
    expect(bridge.listenerCount("error")).toBe(0);
    expect(bridge.listenerCount("exit")).toBe(0);
  });
});
