import { describe, expect, it } from "vitest";
import { formatFaceTimeTarget, parseFaceTimeTarget } from "./targets.js";

describe("FaceTime targets", () => {
  it("normalizes phone and email targets", () => {
    expect(parseFaceTimeTarget("facetime:(415) 555-0123").address).toBe("+4155550123");
    expect(parseFaceTimeTarget("facetime:Agent@Example.com").address).toBe("agent@example.com");
  });

  it("preserves explicit account scope", () => {
    const parsed = parseFaceTimeTarget("facetime:support:caller@example.com");
    expect(parsed).toMatchObject({ accountId: "support", address: "caller@example.com" });
    expect(formatFaceTimeTarget(parsed)).toBe("facetime:support:caller@example.com");
  });

  it("rejects ambiguous identifiers", () => {
    expect(() => parseFaceTimeTarget("not-a-face-time-address")).toThrow(/Invalid FaceTime/);
  });
});
