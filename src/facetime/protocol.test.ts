import { describe, expect, it } from "vitest";
import {
  encodeFaceTimeFrame,
  FACETIME_FRAME_AUDIO,
  FACETIME_FRAME_JSON,
  FACETIME_MAX_AUDIO_FRAME_BYTES,
  FaceTimeFrameDecoder,
} from "./protocol.js";

describe("FaceTime framed IPC", () => {
  it("decodes fragmented and coalesced frames", () => {
    const first = encodeFaceTimeFrame(FACETIME_FRAME_JSON, Buffer.from('{"type":"ready"}'));
    const second = encodeFaceTimeFrame(FACETIME_FRAME_AUDIO, Buffer.from([1, 2, 3, 4]));
    const combined = Buffer.concat([first, second]);
    const decoder = new FaceTimeFrameDecoder();
    expect(decoder.push(combined.subarray(0, 3))).toEqual([]);
    expect(decoder.push(combined.subarray(3))).toEqual([
      { kind: FACETIME_FRAME_JSON, payload: Buffer.from('{"type":"ready"}') },
      { kind: FACETIME_FRAME_AUDIO, payload: Buffer.from([1, 2, 3, 4]) },
    ]);
  });

  it("rejects oversized audio before allocation", () => {
    expect(() =>
      encodeFaceTimeFrame(
        FACETIME_FRAME_AUDIO,
        Buffer.alloc(FACETIME_MAX_AUDIO_FRAME_BYTES + 1),
      ),
    ).toThrow(/exceeds/);
  });

  it("rejects unknown frame kinds", () => {
    const decoder = new FaceTimeFrameDecoder();
    expect(() => decoder.push(Buffer.from([99, 0, 0, 0, 0]))).toThrow(/Invalid/);
  });
});
