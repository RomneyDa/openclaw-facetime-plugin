import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";
import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import {
  decodeFaceTimeEvent,
  encodeFaceTimeCommand,
  encodeFaceTimeFrame,
  FACETIME_FRAME_AUDIO,
  FACETIME_FRAME_JSON,
  FaceTimeFrameDecoder,
} from "./protocol.js";
import type { FaceTimeNativeCommand, FaceTimeNativeEvent } from "./types.js";

const MAX_QUEUED_OUTPUT_BYTES = 2 * 1024 * 1024;
const SHUTDOWN_GRACE_MS = 1_500;
const STARTUP_TIMEOUT_MS = 5_000;

export type FaceTimeNativeBridgeEvents = {
  event: [event: FaceTimeNativeEvent];
  audio: [audio: Buffer];
  error: [error: Error];
  exit: [code: number | null, signal: NodeJS.Signals | null];
};

export class FaceTimeNativeBridge extends EventEmitter<FaceTimeNativeBridgeEvents> {
  readonly helperPath: string;
  readonly logger: RuntimeLogger;
  readonly maxQueuedOutputBytes: number;
  readonly startupTimeoutMs: number;
  #child: ChildProcessWithoutNullStreams | null = null;
  #decoder = new FaceTimeFrameDecoder();
  #queued: Buffer[] = [];
  #queuedBytes = 0;
  #stopping = false;

  constructor(params: {
    helperPath: string;
    logger: RuntimeLogger;
    maxQueuedOutputBytes?: number;
    startupTimeoutMs?: number;
  }) {
    super();
    this.helperPath = params.helperPath;
    this.logger = params.logger;
    this.maxQueuedOutputBytes = params.maxQueuedOutputBytes ?? MAX_QUEUED_OUTPUT_BYTES;
    this.startupTimeoutMs = params.startupTimeoutMs ?? STARTUP_TIMEOUT_MS;
  }

  get running(): boolean {
    return Boolean(this.#child && this.#child.exitCode === null && !this.#child.killed);
  }

  async start(command: Extract<FaceTimeNativeCommand, { type: "configure" }>): Promise<void> {
    if (this.running) {
      return;
    }
    this.#stopping = false;
    const child = spawn(this.helperPath, ["--stdio"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, LANG: process.env.LANG ?? "en_US.UTF-8" },
    });
    this.#child = child;
    child.stdout.on("data", (chunk: Buffer | string) => {
      try {
        for (const frame of this.#decoder.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))) {
          if (frame.kind === FACETIME_FRAME_AUDIO) {
            this.emit("audio", frame.payload);
          } else if (frame.kind === FACETIME_FRAME_JSON) {
            this.emit("event", decodeFaceTimeEvent(frame.payload));
          }
        }
      } catch (error) {
        this.emit("error", error instanceof Error ? error : new Error(String(error)));
        void this.stop();
      }
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      const text = String(chunk).trim();
      if (text) {
        this.logger.debug?.(`[facetime-native] ${text}`);
      }
    });
    child.on("error", (error) => this.emit("error", error));
    child.on("exit", (code, signal) => {
      this.#child = null;
      this.#queued = [];
      this.#queuedBytes = 0;
      this.emit("exit", code, signal);
      if (!this.#stopping && code !== 0) {
        this.emit(
          "error",
          new Error(`FaceTime native helper exited (${code ?? signal ?? "unknown"})`),
        );
      }
    });
    child.stdin.on("drain", () => this.#flush());
    child.stdin.on("error", (error) => {
      if (!this.#stopping) {
        this.emit("error", error);
      }
    });
    try {
      await this.#waitUntilReady();
      this.sendCommand(command);
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  sendCommand(command: FaceTimeNativeCommand): void {
    this.#write(encodeFaceTimeCommand(command), true);
  }

  sendAudio(audio: Buffer): boolean {
    if (audio.byteLength === 0 || !this.running) {
      return false;
    }
    try {
      return this.#write(encodeFaceTimeFrame(FACETIME_FRAME_AUDIO, audio), false);
    } catch (error) {
      this.emit("error", error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  #write(frame: Buffer, control: boolean): boolean {
    const child = this.#child;
    if (!child || !this.running) {
      throw new Error("FaceTime native helper is not running");
    }
    if (this.#queued.length > 0) {
      return this.#enqueue(frame, control);
    }
    if (!child.stdin.write(frame)) {
      this.#queued.push(Buffer.alloc(0));
    }
    return true;
  }

  #enqueue(frame: Buffer, control: boolean): boolean {
    if (!control && this.#queuedBytes + frame.byteLength > this.maxQueuedOutputBytes) {
      this.logger.warn?.("[facetime-native] dropped provider audio because BlackHole output is backpressured");
      return false;
    }
    this.#queued.push(frame);
    this.#queuedBytes += frame.byteLength;
    return true;
  }

  async #waitUntilReady(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        this.off("event", onEvent);
        this.off("error", onError);
        this.off("exit", onExit);
      };
      const onEvent = (event: FaceTimeNativeEvent) => {
        if (event.type === "ready") {
          cleanup();
          resolve();
        }
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
        cleanup();
        reject(new Error(`FaceTime native helper exited before ready (${code ?? signal ?? "unknown"})`));
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`FaceTime native helper did not become ready within ${this.startupTimeoutMs}ms`));
      }, this.startupTimeoutMs);
      timer.unref?.();
      this.on("event", onEvent);
      this.on("error", onError);
      this.on("exit", onExit);
    });
  }

  #flush(): void {
    const child = this.#child;
    if (!child || !this.running) {
      return;
    }
    if (this.#queued[0]?.byteLength === 0) {
      this.#queued.shift();
    }
    while (this.#queued.length > 0) {
      const frame = this.#queued.shift()!;
      this.#queuedBytes -= frame.byteLength;
      if (!child.stdin.write(frame)) {
        this.#queued.unshift(Buffer.alloc(0));
        break;
      }
    }
  }

  async stop(): Promise<void> {
    const child = this.#child;
    if (!child) {
      return;
    }
    this.#stopping = true;
    try {
      this.sendCommand({ type: "shutdown" });
    } catch {
      // The process may already be closing.
    }
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      child.once("exit", finish);
      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        const killTimer = setTimeout(() => {
          if (child.exitCode === null) {
            child.kill("SIGKILL");
          }
        }, 1_000);
        killTimer.unref?.();
        finish();
      }, SHUTDOWN_GRACE_MS);
      timer.unref?.();
    });
  }
}
