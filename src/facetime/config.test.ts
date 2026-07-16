import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FaceTimeConfigJsonSchema, FaceTimeConfigSchema } from "./config.js";

const pluginRoot = fileURLToPath(new URL("../../", import.meta.url));

describe("FaceTime config", () => {
  it("keeps runtime and both manifest schemas identical", () => {
    const manifest = JSON.parse(
      fs.readFileSync(new URL("../../openclaw.plugin.json", import.meta.url), "utf8"),
    ) as {
      configSchema: unknown;
      channelConfigs: { facetime: { schema: unknown } };
    };
    expect(manifest.configSchema).toEqual(FaceTimeConfigJsonSchema);
    expect(manifest.channelConfigs.facetime.schema).toEqual(FaceTimeConfigJsonSchema);
    expect(pluginRoot).toMatch(/facetime-channel\/?$/);
  });

  it("defaults to an allowlisted, auto-answer, OpenAI realtime account", () => {
    const parsed = FaceTimeConfigSchema.parse({
      identity: "agent@example.com",
      allowFrom: ["caller@example.com"],
    });
    expect(parsed).toMatchObject({
      identity: "agent@example.com",
      inboundPolicy: "allowlist",
      autoAnswer: true,
      blackHoleDevice: "BlackHole 2ch",
    });
  });

  it("rejects unknown public configuration", () => {
    expect(() => FaceTimeConfigSchema.parse({ identity: "a@b.com", secretThing: true })).toThrow();
    expect(() => FaceTimeConfigSchema.parse({ identity: "a@b.com", helperPath: "/tmp/helper" })).toThrow();
    expect(() => FaceTimeConfigSchema.parse({ identity: "not-an-identity" })).toThrow(
      /valid Apple Account email/,
    );
    expect(() => FaceTimeConfigSchema.parse({ identity: "a@b.com", allowFrom: [] })).toThrow(
      /At least one allowed caller/,
    );
  });
});
