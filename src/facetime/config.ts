import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";
import { z } from "zod";
import { normalizeFaceTimeAddress } from "./targets.js";

const nonEmpty = z.string().trim().min(1);
const positiveMs = z.number().int().positive();
const providerConfigs = z.record(z.string(), z.record(z.string(), z.unknown()).optional());
const loopbackWebSocketUrl = nonEmpty.refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "ws:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}, "OBS WebSocket URL must use ws:// on loopback");
const faceTimeAddress = nonEmpty.refine(
  (value) => {
    try {
      normalizeFaceTimeAddress(value);
      return true;
    } catch {
      return false;
    }
  },
  "Use a valid Apple Account email or international phone number",
);
const allowEntry = nonEmpty.refine(
  (value) => {
    if (value === "*") {
      return true;
    }
    try {
      normalizeFaceTimeAddress(value);
      return true;
    } catch {
      return false;
    }
  },
  "Use *, a valid Apple Account email, or an international phone number",
);

export const FaceTimeRealtimeConfigSchema = z
  .object({
    provider: nonEmpty.default("openai").optional(),
    model: nonEmpty.optional(),
    voice: nonEmpty.optional(),
    instructions: nonEmpty.optional(),
    greeting: nonEmpty.optional(),
    agentId: nonEmpty.default("main").optional(),
    toolPolicy: z.enum(["none", "read-only", "owner"]).default("read-only").optional(),
    providers: providerConfigs.optional(),
  })
  .strict();

export const FaceTimeAvatarConfigSchema = z
  .object({
    enabled: z.boolean().default(false).optional(),
    provider: nonEmpty.default("lobster").optional(),
    audioDelayMs: z.number().int().min(0).max(500).default(80).optional(),
    obs: z
      .object({
        enabled: z.boolean().default(false).optional(),
        url: loopbackWebSocketUrl.default("ws://127.0.0.1:4455").optional(),
        passwordEnv: z.string().regex(/^[A-Z_][A-Z0-9_]*$/u).default("OBS_WEBSOCKET_PASSWORD").optional(),
        sceneName: nonEmpty.default("OpenClaw FaceTime Avatar").optional(),
        sourceName: nonEmpty.default("OpenClaw Avatar Renderer").optional(),
        width: z.number().int().min(320).max(3_840).default(1_280).optional(),
        height: z.number().int().min(240).max(2_160).default(720).optional(),
        autoStartVirtualCamera: z.boolean().default(true).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const FaceTimeAccountConfigSchema: z.ZodType<Record<string, unknown>> = z.lazy(() =>
  z
    .object({
      name: nonEmpty.optional(),
      enabled: z.boolean().optional(),
      identity: faceTimeAddress.optional(),
      inboundPolicy: z.enum(["allowlist", "open", "disabled"]).default("allowlist").optional(),
      allowFrom: z.array(allowEntry).optional(),
      autoAnswer: z.boolean().default(true).optional(),
      blackHoleDevice: nonEmpty.default("BlackHole 2ch").optional(),
      maxCallDurationMs: positiveMs.default(3_600_000).optional(),
      dialTimeoutMs: positiveMs.default(45_000).optional(),
      realtime: FaceTimeRealtimeConfigSchema.optional(),
      avatar: FaceTimeAvatarConfigSchema.optional(),
      accounts: z.record(z.string(), FaceTimeAccountConfigSchema).optional(),
      defaultAccount: nonEmpty.optional(),
    })
    .strict()
    .superRefine((value, context) => {
      if (
        value.identity &&
        (value.inboundPolicy ?? "allowlist") === "allowlist" &&
        (!value.allowFrom || value.allowFrom.length === 0)
      ) {
        context.addIssue({
          code: "custom",
          path: ["allowFrom"],
          message: "At least one allowed caller is required when inboundPolicy is allowlist",
        });
      }
    }),
);

const realtimeJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    provider: { type: "string", minLength: 1, default: "openai" },
    model: { type: "string", minLength: 1 },
    voice: { type: "string", minLength: 1 },
    instructions: { type: "string", minLength: 1 },
    greeting: { type: "string", minLength: 1 },
    agentId: { type: "string", minLength: 1, default: "main" },
    toolPolicy: { enum: ["none", "read-only", "owner"], default: "read-only" },
    providers: {
      type: "object",
      additionalProperties: { type: "object", additionalProperties: true }
    }
  }
} as const;

const avatarJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    enabled: { type: "boolean", default: false },
    provider: { type: "string", minLength: 1, default: "lobster" },
    audioDelayMs: { type: "integer", minimum: 0, maximum: 500, default: 80 },
    obs: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean", default: false },
        url: {
          type: "string",
          pattern: "^ws://(?:127\\.0\\.0\\.1|localhost|\\[::1\\])(?::[0-9]+)?(?:/.*)?$",
          default: "ws://127.0.0.1:4455",
        },
        passwordEnv: {
          type: "string",
          pattern: "^[A-Z_][A-Z0-9_]*$",
          default: "OBS_WEBSOCKET_PASSWORD",
        },
        sceneName: { type: "string", minLength: 1, default: "OpenClaw FaceTime Avatar" },
        sourceName: { type: "string", minLength: 1, default: "OpenClaw Avatar Renderer" },
        width: { type: "integer", minimum: 320, maximum: 3_840, default: 1_280 },
        height: { type: "integer", minimum: 240, maximum: 2_160, default: 720 },
        autoStartVirtualCamera: { type: "boolean", default: true },
      },
    },
  },
} as const;

const accountProperties = {
  name: { type: "string", minLength: 1 },
  enabled: { type: "boolean" },
  identity: {
    type: "string",
    minLength: 1,
    pattern: "^(?:[^\\s@]+@[^\\s@]+\\.[^\\s@]+|\\+?[0-9 ()\\-.]{7,25})$",
  },
  inboundPolicy: { enum: ["allowlist", "open", "disabled"], default: "allowlist" },
  allowFrom: {
    type: "array",
    items: {
      anyOf: [
        { const: "*" },
        {
          type: "string",
          minLength: 1,
          pattern: "^(?:[^\\s@]+@[^\\s@]+\\.[^\\s@]+|\\+?[0-9 ()\\-.]{7,25})$",
        },
      ],
    },
  },
  autoAnswer: { type: "boolean", default: true },
  blackHoleDevice: { type: "string", minLength: 1, default: "BlackHole 2ch" },
  maxCallDurationMs: { type: "integer", minimum: 1, default: 3_600_000 },
  dialTimeoutMs: { type: "integer", minimum: 1, default: 45_000 },
  realtime: realtimeJsonSchema,
  avatar: avatarJsonSchema,
  accounts: { type: "object", additionalProperties: { $ref: "#" } },
  defaultAccount: { type: "string", minLength: 1 }
} as const;

export const FaceTimeConfigJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: accountProperties,
  allOf: [
    {
      if: {
        required: ["identity"],
        properties: { inboundPolicy: { enum: ["allowlist"] } },
      },
      then: { required: ["allowFrom"], properties: { allowFrom: { minItems: 1 } } },
    },
  ],
} as const;

export const FaceTimeChannelConfigSchema = buildJsonChannelConfigSchema(
  FaceTimeConfigJsonSchema,
  {
    cacheKey: "facetime-channel-config",
    runtime: {
      safeParse: (value) => {
        const result = FaceTimeAccountConfigSchema.safeParse(value);
        if (result.success) {
          return { success: true, data: result.data };
        }
        return {
          success: false,
          issues: result.error.issues.map((issue) => ({
            path: issue.path.filter(
              (segment): segment is string | number =>
                typeof segment === "string" || typeof segment === "number",
            ),
            message: issue.message,
          })),
        };
      },
    },
  },
);
