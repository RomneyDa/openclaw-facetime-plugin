import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";
import { z } from "zod";
import { normalizeFaceTimeAddress } from "./targets.js";

const nonEmpty = z.string().trim().min(1);
const positiveMs = z.number().int().positive();
const providerConfigs = z.record(z.string(), z.record(z.string(), z.unknown()).optional());
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
