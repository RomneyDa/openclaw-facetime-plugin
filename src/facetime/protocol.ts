import type { FaceTimeNativeCommand, FaceTimeNativeEvent } from "./types.js";
import { z } from "zod";

export const FACETIME_FRAME_JSON = 1;
export const FACETIME_FRAME_AUDIO = 2;
export const FACETIME_FRAME_HEADER_BYTES = 5;
export const FACETIME_MAX_CONTROL_FRAME_BYTES = 256 * 1024;
export const FACETIME_MAX_AUDIO_FRAME_BYTES = 256 * 1024;

const nativeCheckSchema = z.object({
  id: z.string().min(1),
  ok: z.boolean(),
  message: z.string(),
});

const nativeEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready"), pid: z.number().int().positive() }),
  z.object({
    type: z.literal("incoming"),
    callId: z.string().min(1),
    peer: z.string().min(1),
  }),
  z.object({
    type: z.literal("call-state"),
    callId: z.string().min(1),
    state: z.enum(["ringing", "dialing", "connecting", "connected", "ended", "failed"]),
    peer: z.string().min(1).optional(),
    reason: z.string().optional(),
  }),
  z.object({ type: z.literal("audio-cleared"), callId: z.string().min(1).optional() }),
  z.object({
    type: z.literal("error"),
    code: z.string().min(1),
    message: z.string(),
    fatal: z.boolean().optional(),
  }),
  z.object({ type: z.literal("diagnostics"), checks: z.array(nativeCheckSchema) }),
]);

export type FaceTimeFrame =
  | { kind: typeof FACETIME_FRAME_JSON; payload: Buffer }
  | { kind: typeof FACETIME_FRAME_AUDIO; payload: Buffer };

export function encodeFaceTimeFrame(kind: 1 | 2, payload: Buffer): Buffer {
  const max = kind === FACETIME_FRAME_JSON ? FACETIME_MAX_CONTROL_FRAME_BYTES : FACETIME_MAX_AUDIO_FRAME_BYTES;
  if (payload.byteLength > max) {
    throw new Error(`FaceTime frame exceeds ${max} byte limit`);
  }
  const frame = Buffer.allocUnsafe(FACETIME_FRAME_HEADER_BYTES + payload.byteLength);
  frame.writeUInt8(kind, 0);
  frame.writeUInt32BE(payload.byteLength, 1);
  payload.copy(frame, FACETIME_FRAME_HEADER_BYTES);
  return frame;
}

export function encodeFaceTimeCommand(command: FaceTimeNativeCommand): Buffer {
  return encodeFaceTimeFrame(FACETIME_FRAME_JSON, Buffer.from(JSON.stringify(command), "utf8"));
}

export function decodeFaceTimeEvent(payload: Buffer): FaceTimeNativeEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.toString("utf8"));
  } catch {
    throw new Error("FaceTime native event is not valid JSON");
  }
  const result = nativeEventSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.length ? ` at ${issue.path.join(".")}` : "";
    throw new Error(`Invalid FaceTime native event${path}: ${issue?.message ?? "unknown error"}`);
  }
  return result.data;
}

export class FaceTimeFrameDecoder {
  #buffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);

  push(chunk: Buffer): FaceTimeFrame[] {
    this.#buffer = this.#buffer.byteLength === 0 ? chunk : Buffer.concat([this.#buffer, chunk]);
    const frames: FaceTimeFrame[] = [];
    while (this.#buffer.byteLength >= FACETIME_FRAME_HEADER_BYTES) {
      const kind = this.#buffer.readUInt8(0);
      const length = this.#buffer.readUInt32BE(1);
      const max = kind === FACETIME_FRAME_JSON ? FACETIME_MAX_CONTROL_FRAME_BYTES : FACETIME_MAX_AUDIO_FRAME_BYTES;
      if ((kind !== FACETIME_FRAME_JSON && kind !== FACETIME_FRAME_AUDIO) || length > max) {
        this.#buffer = Buffer.alloc(0);
        throw new Error(`Invalid FaceTime native frame kind=${kind} length=${length}`);
      }
      const total = FACETIME_FRAME_HEADER_BYTES + length;
      if (this.#buffer.byteLength < total) {
        break;
      }
      frames.push({ kind, payload: Buffer.from(this.#buffer.subarray(FACETIME_FRAME_HEADER_BYTES, total)) } as FaceTimeFrame);
      this.#buffer = this.#buffer.subarray(total);
    }
    return frames;
  }

  finish(): void {
    if (this.#buffer.byteLength === 0) {
      return;
    }
    const buffered = this.#buffer.byteLength;
    this.#buffer = Buffer.alloc(0);
    throw new Error(`FaceTime native stream ended with ${buffered} truncated frame bytes`);
  }
}
