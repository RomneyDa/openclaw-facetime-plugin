import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FaceTimeNativeBridge } from "./native-bridge.js";

const temporaryDirectories: string[] = [];

function helper(source: string): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "facetime-native-test-"));
  temporaryDirectories.push(directory);
  const helperPath = path.join(directory, "helper");
  fs.writeFileSync(helperPath, `#!${process.execPath}\n${source}\n`, { mode: 0o755 });
  return helperPath;
}

function frame(value: unknown): string {
  return `(() => {
    const payload = Buffer.from(${JSON.stringify(JSON.stringify(value))});
    const frame = Buffer.alloc(5 + payload.length);
    frame.writeUInt8(1, 0);
    frame.writeUInt32BE(payload.length, 1);
    payload.copy(frame, 5);
    process.stdout.write(frame);
  })();`;
}

function logger(): RuntimeLogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as RuntimeLogger;
}

const configure = {
  type: "configure" as const,
  identity: "agent@example.com",
  blackHoleDevice: "BlackHole 2ch",
  sampleRateHz: 24_000 as const,
  channels: 1 as const,
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("FaceTime native bridge failures", () => {
  it("fails startup when the helper never completes the ready handshake", async () => {
    const bridge = new FaceTimeNativeBridge({
      helperPath: helper("setInterval(() => {}, 1000);"),
      logger: logger(),
      startupTimeoutMs: 25,
    });
    await expect(bridge.start(configure)).rejects.toThrow(/did not become ready/);
    expect(bridge.running).toBe(false);
  }, 3_000);

  it("surfaces malformed native events and shuts down the helper", async () => {
    const bridge = new FaceTimeNativeBridge({
      helperPath: helper(`
        ${frame({ type: "ready", pid: 123 })}
        setTimeout(() => { ${frame({ type: "unknown-event" })} }, 10);
        setTimeout(() => process.exit(0), 100);
      `),
      logger: logger(),
    });
    const errors: Error[] = [];
    bridge.on("error", (error) => errors.push(error));
    await bridge.start(configure);
    await vi.waitFor(() =>
      expect(errors.some((error) => /Invalid FaceTime native event/.test(error.message))).toBe(true),
    );
    await vi.waitFor(() => expect(bridge.running).toBe(false));
  });

  it("reports a helper crash after a successful handshake", async () => {
    const bridge = new FaceTimeNativeBridge({
      helperPath: helper(`
        ${frame({ type: "ready", pid: 123 })}
        setTimeout(() => process.exit(23), 20);
      `),
      logger: logger(),
    });
    const errors: Error[] = [];
    bridge.on("error", (error) => errors.push(error));
    await bridge.start(configure);
    await vi.waitFor(() =>
      expect(errors.some((error) => /exited \(23\)/.test(error.message))).toBe(true),
    );
    expect(bridge.running).toBe(false);
  });

  it("rejects a truncated frame when helper stdout closes", async () => {
    const bridge = new FaceTimeNativeBridge({
      helperPath: helper(`
        ${frame({ type: "ready", pid: 123 })}
        setTimeout(() => {
          process.stdout.write(Buffer.from([2, 0, 0, 0, 8, 1, 2]));
          process.exit(0);
        }, 20);
      `),
      logger: logger(),
    });
    const errors: Error[] = [];
    bridge.on("error", (error) => errors.push(error));
    await bridge.start(configure);
    await vi.waitFor(() =>
      expect(errors.some((error) => /truncated frame bytes/.test(error.message))).toBe(true),
    );
  });

  it("bounds queued provider audio and reports dropped chunks", async () => {
    const log = logger();
    const bridge = new FaceTimeNativeBridge({
      helperPath: helper(`
        ${frame({ type: "ready", pid: 123 })}
        process.stdin.pause();
        setTimeout(() => process.exit(0), 500);
      `),
      logger: log,
      maxQueuedOutputBytes: 4_096,
    });
    await bridge.start(configure);
    const chunk = Buffer.alloc(256 * 1024);
    const results = Array.from({ length: 8 }, () => bridge.sendAudio(chunk));
    expect(results).toContain(false);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("dropped provider audio"));
    await Promise.all([bridge.stop(), bridge.stop(), bridge.stop()]);
    expect(bridge.running).toBe(false);
  });
});
