import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { OpenClawConfig } from "openclaw/plugin-sdk";
import type { ChannelPlugin } from "openclaw/plugin-sdk/core";
import { jsonResult } from "openclaw/plugin-sdk/tool-results";
import { Type } from "typebox";
import { faceTimePlugin } from "./src/channel.js";
import { resolveFaceTimeAccount } from "./src/facetime/accounts.js";
import { getFaceTimeCallManager } from "./src/facetime/call-manager.js";
import { probeFaceTime } from "./src/facetime/probe.js";
import { setFaceTimeRuntime } from "./src/runtime.js";

const FaceTimeToolSchema = Type.Object({
  action: Type.String({
    enum: ["call", "answer", "decline", "hangup", "speak", "status", "preflight"],
  }),
  accountId: Type.Optional(Type.String()),
  target: Type.Optional(Type.String({ description: "FaceTime phone number or Apple Account email" })),
  callId: Type.Optional(Type.String()),
  message: Type.Optional(Type.String()),
});

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const plugin = {
  id: "facetime",
  name: "FaceTime Audio",
  description: "macOS FaceTime Audio channel using ScreenCaptureKit, BlackHole, and realtime voice",
  configSchema: faceTimePlugin.configSchema,
  register(api: OpenClawPluginApi) {
    setFaceTimeRuntime(api.runtime);
    api.registerChannel({ plugin: faceTimePlugin as ChannelPlugin });
    api.registerTool(() => ({
      name: "facetime_call",
      label: "FaceTime Call",
      description:
        "Place, answer, decline, inspect, speak into, or hang up FaceTime Audio calls on the configured Mac.",
      parameters: FaceTimeToolSchema,
      async execute(_toolCallId, value) {
        const params = asRecord(value);
        const action = readString(params, "action");
        const accountId = readString(params, "accountId") ?? "default";
        if (action === "preflight") {
          const cfg = api.runtime.config.current() as OpenClawConfig;
          return jsonResult(
            await probeFaceTime(resolveFaceTimeAccount({ cfg, accountId }), 8_000),
          );
        }
        const manager = getFaceTimeCallManager(accountId);
        switch (action) {
          case "call": {
            const target = readString(params, "target");
            if (!target) {
              throw new Error("target is required for action=call");
            }
            return jsonResult(await manager.dial(target, readString(params, "message")));
          }
          case "answer":
            return jsonResult(await manager.answer(readString(params, "callId")));
          case "decline":
            return jsonResult(await manager.decline(readString(params, "callId")));
          case "hangup":
            return jsonResult(await manager.hangup(readString(params, "callId")));
          case "speak": {
            const message = readString(params, "message");
            if (!message) {
              throw new Error("message is required for action=speak");
            }
            manager.speak(message);
            return jsonResult({ ok: true, call: manager.snapshot().active });
          }
          case "status":
            return jsonResult(manager.snapshot());
          default:
            throw new Error(`Unsupported FaceTime action: ${action ?? "missing"}`);
        }
      },
    }));
  },
};

export default plugin;
