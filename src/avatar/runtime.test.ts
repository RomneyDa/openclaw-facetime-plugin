import type { AvatarRenderer } from "openclaw-avatar-plugin/renderer";
import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import { describe, expect, it, vi } from "vitest";
import type { ResolvedFaceTimeAccount } from "../facetime/types.js";
import type { FaceTimeObsController } from "./obs.js";
import { FaceTimeAvatarRuntime } from "./runtime.js";

function account(): ResolvedFaceTimeAccount {
  return {
    accountId: "default",
    enabled: true,
    identity: "agent@example.com",
    config: {
      identity: "agent@example.com",
      avatar: { enabled: true, obs: { enabled: true, width: 960, height: 540 } },
    },
    helperPath: "/tmp/helper",
    blackHoleDevice: "BlackHole 2ch",
  };
}

function harness(options: { audioError?: Error } = {}) {
  const audio = vi.fn<(audio: Uint8Array, ptsMs: number) => boolean>(() => {
    if (options.audioError) throw options.audioError;
    return true;
  });
  const consumer = {
    start: vi.fn(),
    audio,
    visemes: vi.fn(),
    state: vi.fn(),
    expression: vi.fn(),
    clear: vi.fn(() => 1),
    end: vi.fn(),
  };
  const renderer = {
    consumer,
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
    rendererUrl: "http://127.0.0.1:18794/avatar/?token=secret",
    snapshot: vi.fn(() => ({
      readyClients: 0,
      droppedTransportMedia: 0,
      rendererError: null,
      session: { droppedMediaBytes: 0 },
    })),
  } as unknown as AvatarRenderer;
  const obs = {
    configure: vi.fn(async () => {}),
    startVirtualCamera: vi.fn(async () => {}),
    stopVirtualCamera: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
  } as unknown as FaceTimeObsController;
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as RuntimeLogger;
  return { consumer, renderer, obs, logger };
}

describe("FaceTime avatar adapter", () => {
  it("owns renderer/OBS lifecycle while passing opaque sessions and exact timed PCM", async () => {
    const { consumer, renderer, obs, logger } = harness();
    const runtime = new FaceTimeAvatarRuntime({ account: account(), logger, renderer, obs });
    await runtime.start();
    expect(obs.configure).toHaveBeenCalledWith(renderer.rendererUrl);
    await runtime.beginCall("opaque-call");
    expect(consumer.start).toHaveBeenCalledWith({
      sessionId: "opaque-call",
      video: { width: 960, height: 540, frameRate: 30 },
      initialState: "listening",
    });
    const pcm = Buffer.from([0x00, 0x80, 0xff, 0x7f]);
    expect(runtime.sendAudio(pcm, 20)).toBe(true);
    expect(consumer.audio).toHaveBeenCalledWith(pcm, 20);
    runtime.clear("barge-in");
    expect(consumer.clear).toHaveBeenCalledWith("barge-in");
    await runtime.endCall("opaque-call");
    expect(consumer.end).toHaveBeenCalledWith("hangup");
    expect(obs.stopVirtualCamera).toHaveBeenCalledOnce();
    await runtime.stop();
    expect(renderer.stop).toHaveBeenCalledOnce();
    expect(obs.stop).toHaveBeenCalledOnce();
  });

  it("records renderer failure without throwing into the audio call", async () => {
    const { renderer, obs, logger } = harness({ audioError: new Error("renderer disconnected") });
    const runtime = new FaceTimeAvatarRuntime({ account: account(), logger, renderer, obs });
    await runtime.beginCall("call");
    expect(runtime.sendAudio(Buffer.from([0, 0]), 0)).toBe(false);
    expect(runtime.snapshot().rendererError).toBe("renderer disconnected");
    await vi.waitFor(() => expect(obs.stopVirtualCamera).toHaveBeenCalledOnce());
  });

  it("stops Virtual Camera after a previously ready renderer disconnects", async () => {
    const { consumer, renderer, obs, logger } = harness();
    vi.mocked(renderer.snapshot).mockReturnValue({
      readyClients: 1,
      droppedTransportMedia: 0,
      session: { droppedMediaBytes: 0 },
    } as never);
    vi.mocked(consumer.audio).mockReturnValueOnce(true).mockReturnValueOnce(false);
    const runtime = new FaceTimeAvatarRuntime({ account: account(), logger, renderer, obs });
    await runtime.beginCall("call");
    runtime.sendAudio(Buffer.from([0, 0]), 0);
    vi.mocked(renderer.snapshot).mockReturnValue({
      readyClients: 0,
      droppedTransportMedia: 0,
      session: { droppedMediaBytes: 0 },
    } as never);
    runtime.sendAudio(Buffer.from([0, 0]), 1);
    await vi.waitFor(() => expect(obs.stopVirtualCamera).toHaveBeenCalledOnce());
    expect(runtime.snapshot().rendererError).toBe("renderer disconnected");
  });
});
