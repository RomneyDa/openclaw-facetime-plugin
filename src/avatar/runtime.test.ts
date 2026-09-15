import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import { describe, expect, it, vi } from "vitest";
import type { ResolvedFaceTimeAccount } from "../facetime/types.js";
import type { LiveVisualHealth, LiveVisualProvider } from "./live-visual-sdk.js";
import type { FaceTimeObsController } from "./obs.js";
import { FaceTimeAvatarRuntime } from "./runtime.js";

function account(): ResolvedFaceTimeAccount {
  return {
    accountId: "default",
    enabled: true,
    identity: "agent@example.com",
    config: {
      identity: "agent@example.com",
      avatar: { enabled: true, provider: "lobster", obs: { enabled: true, width: 960, height: 540 } },
    },
    helperPath: "/tmp/helper",
    blackHoleDevice: "BlackHole 2ch",
  };
}

function harness(options: { obsError?: Error; writeError?: Error } = {}) {
  let health: LiveVisualHealth = { status: "ready", droppedMediaBytes: 0 };
  const write = vi.fn(() => {
    if (options.writeError) throw options.writeError;
    return true;
  });
  const session = {
    output: {
      kind: "browser-source" as const,
      url: "http://127.0.0.1:18794/avatar/?token=secret",
      video: { width: 960, height: 540, frameRate: 30 },
    },
    write,
    health: vi.fn(() => health),
    close: vi.fn(async () => {}),
  };
  const provider = {
    id: "lobster",
    label: "Lobster",
    open: vi.fn(async () => session),
  } satisfies LiveVisualProvider;
  const obs = {
    configure: vi.fn(async () => {
      if (options.obsError) throw options.obsError;
    }),
    startVirtualCamera: vi.fn(async () => {}),
    stopVirtualCamera: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
  } as unknown as FaceTimeObsController;
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as RuntimeLogger;
  return {
    provider,
    session,
    obs,
    logger,
    setHealth(next: LiveVisualHealth) {
      health = next;
    },
  };
}

describe("FaceTime live-visual adapter", () => {
  it("resolves one generic provider and passes exact sample-clock PCM to its browser surface", async () => {
    const { provider, session, obs, logger } = harness();
    const resolveProvider = vi.fn(async () => provider);
    const runtime = new FaceTimeAvatarRuntime({ account: account(), logger, resolveProvider, obs });
    await runtime.start();
    expect(resolveProvider).toHaveBeenCalledWith("lobster", undefined);
    await runtime.beginCall("opaque-call");
    expect(provider.open).toHaveBeenCalledWith({
      streamId: "opaque-call",
      clock: { unitsPerSecond: 24_000 },
      video: { width: 960, height: 540, frameRate: 30 },
      audio: { encoding: "pcm-s16le", sampleRateHz: 24_000, channels: 1 },
    });
    expect(obs.configure).toHaveBeenCalledWith(session.output.url);
    const pcm = Buffer.from([0x00, 0x80, 0xff, 0x7f]);
    expect(runtime.sendAudio(pcm, 480)).toBe(true);
    expect(session.write).toHaveBeenCalledWith({ type: "audio", pts: 480, data: pcm });
    runtime.clear("barge-in");
    expect(session.write).toHaveBeenCalledWith({ type: "flush", reason: "barge-in" });
    await runtime.endCall("opaque-call");
    expect(session.close).toHaveBeenCalledWith("hangup");
    expect(obs.stopVirtualCamera).toHaveBeenCalledOnce();
    await runtime.stop();
    expect(obs.stop).toHaveBeenCalledOnce();
  });

  it("keeps the audio call alive when the provider is missing", async () => {
    const { obs, logger } = harness();
    const runtime = new FaceTimeAvatarRuntime({
      account: account(),
      logger,
      resolveProvider: async () => undefined,
      obs,
    });
    await expect(runtime.start()).rejects.toThrow("live-visual provider not found: lobster");
    expect(runtime.sendAudio(Buffer.from([0, 0]), 0)).toBe(false);
  });

  it("records provider failure without throwing into the audio call", async () => {
    const { provider, obs, logger } = harness({ writeError: new Error("provider disconnected") });
    const runtime = new FaceTimeAvatarRuntime({ account: account(), logger, provider, obs });
    await runtime.start();
    await runtime.beginCall("call");
    expect(runtime.sendAudio(Buffer.from([0, 0]), 0)).toBe(false);
    expect(runtime.snapshot().visualError).toBe("provider disconnected");
    await vi.waitFor(() => expect(obs.stopVirtualCamera).toHaveBeenCalledOnce());
  });

  it("keeps the visual session alive for cleanup when OBS fails", async () => {
    const { provider, session, obs, logger } = harness({ obsError: new Error("OBS unavailable") });
    const runtime = new FaceTimeAvatarRuntime({ account: account(), logger, provider, obs });
    await runtime.start();
    await runtime.beginCall("call");
    expect(runtime.snapshot().obsError).toBe("OBS unavailable");
    expect(runtime.sendAudio(Buffer.from([0, 0]), 0)).toBe(true);
    await runtime.endCall("call");
    expect(session.close).toHaveBeenCalledWith("hangup");
  });

  it("degrades video after provider overflow while preserving the session for cleanup", async () => {
    const { provider, session, obs, logger, setHealth } = harness();
    const runtime = new FaceTimeAvatarRuntime({ account: account(), logger, provider, obs });
    await runtime.start();
    await runtime.beginCall("call");
    setHealth({ status: "degraded", droppedMediaBytes: 2, error: "slow subscriber" });
    runtime.sendAudio(Buffer.from([0, 0]), 0);
    await vi.waitFor(() => expect(obs.stopVirtualCamera).toHaveBeenCalledOnce());
    expect(runtime.snapshot().visualError).toBe("slow subscriber");
    await runtime.endCall("call");
    expect(session.close).toHaveBeenCalledWith("hangup");
  });
});
