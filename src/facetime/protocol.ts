import type { FaceTimeNativeCommand, FaceTimeNativeEvent } from "./types.js";

export const FACETIME_FRAME_JSON = 1;
export const FACETIME_FRAME_AUDIO = 2;
export const FACETIME_FRAME_HEADER_BYTES = 5;
export const FACETIME_MAX_CONTROL_FRAME_BYTES = 256 * 1024;
export const FACETIME_MAX_AUDIO_FRAME_BYTES = 256 * 1024;

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
  const parsed: unknown = JSON.parse(payload.toString("utf8"));
  if (!parsed || typeof parsed !== "object" || typeof (parsed as { type?: unknown }).type !== "string") {
    throw new Error("FaceTime native event is missing type");
  }
  return parsed as FaceTimeNativeEvent;
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
}
