import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";
import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const positiveMs = z.number().int().positive();
const providerConfigs = z.record(z.string(), z.record(z.string(), z.unknown()).optional());

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

export const FaceTimeAccountConfigSchema: z.ZodType<Record<string, unknown>> = z.lazy(() =>
  z
    .object({
      name: nonEmpty.optional(),
      enabled: z.boolean().optional(),
      identity: nonEmpty.optional(),
      inboundPolicy: z.enum(["allowlist", "open", "disabled"]).default("allowlist").optional(),
      allowFrom: z.array(nonEmpty).optional(),
      autoAnswer: z.boolean().default(true).optional(),
      helperPath: nonEmpty.optional(),
      blackHoleDevice: nonEmpty.default("BlackHole 2ch").optional(),
      maxCallDurationMs: positiveMs.default(3_600_000).optional(),
      dialTimeoutMs: positiveMs.default(45_000).optional(),
      realtime: FaceTimeRealtimeConfigSchema.optional(),
      accounts: z.record(z.string(), FaceTimeAccountConfigSchema).optional(),
      defaultAccount: nonEmpty.optional(),
    })
    .strict(),
);

export const FaceTimeConfigSchema = FaceTimeAccountConfigSchema;

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

const accountProperties = {
  name: { type: "string", minLength: 1 },
  enabled: { type: "boolean" },
  identity: { type: "string", minLength: 1 },
  inboundPolicy: { enum: ["allowlist", "open", "disabled"], default: "allowlist" },
  allowFrom: { type: "array", items: { type: "string", minLength: 1 } },
  autoAnswer: { type: "boolean", default: true },
  helperPath: { type: "string", minLength: 1 },
  blackHoleDevice: { type: "string", minLength: 1, default: "BlackHole 2ch" },
  maxCallDurationMs: { type: "integer", minimum: 1, default: 3_600_000 },
  dialTimeoutMs: { type: "integer", minimum: 1, default: 45_000 },
  realtime: realtimeJsonSchema,
  accounts: { type: "object", additionalProperties: { $ref: "#" } },
  defaultAccount: { type: "string", minLength: 1 }
} as const;

export const FaceTimeConfigJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: accountProperties,
} as const;

export const FaceTimeChannelConfigSchema = buildJsonChannelConfigSchema(
  FaceTimeConfigJsonSchema,
  {
    cacheKey: "facetime-channel-config",
    runtime: {
      safeParse: (value) => {
        const result = FaceTimeConfigSchema.safeParse(value);
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
