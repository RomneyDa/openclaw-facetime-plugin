import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FaceTimeAvatarRuntime } from "../avatar/runtime.js";
import { FaceTimeNativeBridge } from "./native-bridge.js";
import { FaceTimeOutputPacer } from "./output-pacer.js";

function logger(): RuntimeLogger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as RuntimeLogger;
}

afterEach(() => vi.useRealTimers());

describe("FaceTime A/V output pacer", () => {
  it("feeds the avatar immediately and BlackHole after the configured delay", async () => {
    vi.useFakeTimers();
    const nativeBridge = {
      running: true,
      sendAudio: vi.fn(() => true),
      sendCommand: vi.fn(),
    } as unknown as FaceTimeNativeBridge;
    const avatar = {
      sendAudio: vi.fn(() => true),
      clear: vi.fn(),
    } as unknown as FaceTimeAvatarRuntime;
    const delivered = vi.fn();
    const pacer = new FaceTimeOutputPacer({
      nativeBridge,
      avatar,
      callId: "call-1",
      delayMs: 80,
      logger: logger(),
      onDelivered: delivered,
    });
    const audio = Buffer.alloc(960, 7);
    pacer.send(audio);
    expect(avatar.sendAudio).toHaveBeenCalledWith(audio, 0);
    pacer.send(audio);
    expect(avatar.sendAudio).toHaveBeenNthCalledWith(2, audio, 480);
    expect(nativeBridge.sendAudio).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(79);
    expect(nativeBridge.sendAudio).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(nativeBridge.sendAudio).toHaveBeenCalledWith(audio);
    expect(delivered).toHaveBeenCalledWith(960);
  });

  it("atomically cancels delayed, native, and avatar output", async () => {
    vi.useFakeTimers();
    const nativeBridge = {
      running: true,
      sendAudio: vi.fn(() => true),
      sendCommand: vi.fn(),
    } as unknown as FaceTimeNativeBridge;
    const avatar = { sendAudio: vi.fn(), clear: vi.fn() } as unknown as FaceTimeAvatarRuntime;
    const pacer = new FaceTimeOutputPacer({
      nativeBridge,
      avatar,
      callId: "call-1",
      delayMs: 80,
      logger: logger(),
    });
    pacer.send(Buffer.from([1, 2]));
    pacer.clear("barge-in");
    await vi.advanceTimersByTimeAsync(100);
    expect(nativeBridge.sendAudio).not.toHaveBeenCalled();
    expect(nativeBridge.sendCommand).toHaveBeenCalledWith({ type: "clear-audio", callId: "call-1" });
    expect(avatar.clear).toHaveBeenCalledWith("barge-in");
    pacer.send(Buffer.from([3, 4]));
    expect(avatar.sendAudio).toHaveBeenLastCalledWith(Buffer.from([3, 4]), 0);
  });

  it("bounds delayed audio and records drops", () => {
    vi.useFakeTimers();
    const nativeBridge = {
      running: true,
      sendAudio: vi.fn(() => true),
      sendCommand: vi.fn(),
    } as unknown as FaceTimeNativeBridge;
    const log = logger();
    const pacer = new FaceTimeOutputPacer({
      nativeBridge,
      callId: "call-1",
      delayMs: 80,
      logger: log,
      maxPendingBytes: 2,
    });
    pacer.send(Buffer.from([1, 2]));
    pacer.send(Buffer.from([3]));
    expect(pacer.droppedBytes).toBe(1);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("A/V pacer is full"));
    pacer.clear();
  });
});
