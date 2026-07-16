import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import { describe, expect, it, vi } from "vitest";
import { FaceTimeNativeBridge } from "./native-bridge.js";
import type { FaceTimeNativeEvent } from "./types.js";

const helperPath = fileURLToPath(
  new URL("../../native/.build/release/openclaw-facetime-bridge", import.meta.url),
);
const canRunNative = process.platform === "darwin" && fs.existsSync(helperPath);

describe.skipIf(!canRunNative)("FaceTime Swift helper integration", () => {
  it("exchanges framed configure, diagnostics, and shutdown messages", async () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as RuntimeLogger;
    const bridge = new FaceTimeNativeBridge({ helperPath, logger });
    const events: FaceTimeNativeEvent[] = [];
    bridge.on("event", (event) => events.push(event));
    await bridge.start({
      type: "configure",
      identity: "agent@example.com",
      blackHoleDevice: "BlackHole 2ch",
      sampleRateHz: 24_000,
      channels: 1,
    });
    await vi.waitFor(() => expect(events.some((event) => event.type === "ready")).toBe(true));
    bridge.sendCommand({ type: "diagnose" });
    await vi.waitFor(
      () => expect(events.some((event) => event.type === "diagnostics")).toBe(true),
      { timeout: 8_000 },
    );
    const diagnostics = events.find(
      (event): event is Extract<FaceTimeNativeEvent, { type: "diagnostics" }> =>
        event.type === "diagnostics",
    );
    expect(diagnostics?.checks.map((check) => check.id)).toEqual([
      "facetime-app",
      "blackhole",
      "screen-recording",
      "accessibility",
    ]);
    await bridge.stop();
    expect(bridge.running).toBe(false);
  }, 15_000);
});
