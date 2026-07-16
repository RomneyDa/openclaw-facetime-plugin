import { describe, expect, it } from "vitest";
import {
  decodeFaceTimeEvent,
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

  it("rejects a truncated final frame", () => {
    const decoder = new FaceTimeFrameDecoder();
    decoder.push(Buffer.from([FACETIME_FRAME_AUDIO, 0, 0, 0, 4, 1, 2]));
    expect(() => decoder.finish()).toThrow(/2 truncated frame bytes|7 truncated frame bytes/);
  });

  it("rejects malformed and unknown native events", () => {
    expect(() => decodeFaceTimeEvent(Buffer.from("{"))).toThrow(/not valid JSON/);
    expect(() => decodeFaceTimeEvent(Buffer.from('{"type":"surprise"}'))).toThrow(
      /Invalid FaceTime native event/,
    );
    expect(() =>
      decodeFaceTimeEvent(Buffer.from('{"type":"ready","pid":"not-a-number"}')),
    ).toThrow(/Invalid FaceTime native event/);
  });

  it("keeps generated frame input bounded and deterministic", () => {
    let state = 0x5eed1234;
    const random = () => {
      state = (state * 1_664_525 + 1_013_904_223) >>> 0;
      return state;
    };
    for (let iteration = 0; iteration < 1_000; iteration += 1) {
      const length = random() % 512;
      const input = Buffer.alloc(length);
      for (let index = 0; index < length; index += 1) {
        input[index] = random() & 0xff;
      }
      const decoder = new FaceTimeFrameDecoder();
      try {
        decoder.push(input);
        decoder.finish();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    }
  });
});
