export type LiveVisualVideoFormat = Readonly<{
  width: number;
  height: number;
  frameRate: number;
}>;

export type LiveVisualSessionOpenRequest = Readonly<{
  streamId: string;
  clock: Readonly<{ unitsPerSecond: number }>;
  video: LiveVisualVideoFormat;
  audio?: Readonly<{
    encoding: "pcm-s16le";
    sampleRateHz: number;
    channels: number;
  }>;
}>;

export type LiveVisualInputEvent =
  | Readonly<{ type: "audio"; pts: number; data: Uint8Array }>
  | Readonly<{ type: "cue"; pts: number; name: string; value: string | number | boolean }>
  | Readonly<{ type: "flush"; reason?: string }>;

export type LiveVisualHealth = Readonly<{
  status: "starting" | "ready" | "degraded" | "closed";
  droppedMediaBytes: number;
  error?: string;
}>;

export type LiveVisualSession = {
  readonly output: Readonly<{
    kind: "browser-source";
    url: string;
    video: LiveVisualVideoFormat;
  }>;
  write(event: LiveVisualInputEvent): boolean;
  health(): LiveVisualHealth;
  close(reason?: string): Promise<void>;
};

export type LiveVisualProvider = {
  id: string;
  label: string;
  open(request: LiveVisualSessionOpenRequest): Promise<LiveVisualSession>;
};

type LiveVisualSdk = {
  resolveLiveVisualProvider(params: {
    providerId: string;
    config?: OpenClawConfig;
  }): LiveVisualProvider | undefined;
};

export async function resolveLiveVisualProvider(
  providerId: string,
  config?: OpenClawConfig,
): Promise<LiveVisualProvider | undefined> {
  // Computed until the first OpenClaw release that includes this new SDK subpath.
  const moduleName = ["openclaw/plugin-sdk", "live-visual"].join("/");
  const sdk = (await import(moduleName)) as LiveVisualSdk;
  return sdk.resolveLiveVisualProvider({ providerId, config });
}
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
