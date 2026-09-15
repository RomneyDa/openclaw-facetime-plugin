import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import type { ResolvedFaceTimeAccount } from "../facetime/types.js";
import {
  resolveLiveVisualProvider,
  type LiveVisualHealth,
  type LiveVisualProvider,
  type LiveVisualSession,
} from "./live-visual-sdk.js";
import { FaceTimeObsController } from "./obs.js";

export type FaceTimeAvatarState = "listening" | "thinking" | "speaking" | "idle";

export class FaceTimeAvatarRuntime {
  readonly logger: RuntimeLogger;
  readonly obs: FaceTimeObsController | null;
  readonly providerId: string;
  readonly video: { width: number; height: number; frameRate: number };
  #provider?: LiveVisualProvider;
  #session: LiveVisualSession | null = null;
  #obsError?: string;
  #visualError?: string;
  #activeSessionId: string | null = null;
  #callDroppedStart = 0;
  #hadReadyVisual = false;
  #lastHealth: LiveVisualHealth = { status: "closed", droppedMediaBytes: 0 };
  readonly #config?: OpenClawConfig;
  readonly #resolveProvider: (
    providerId: string,
    config?: OpenClawConfig,
  ) => Promise<LiveVisualProvider | undefined>;

  constructor(params: {
    account: ResolvedFaceTimeAccount;
    config?: OpenClawConfig;
    logger: RuntimeLogger;
    provider?: LiveVisualProvider;
    resolveProvider?: (
      providerId: string,
      config?: OpenClawConfig,
    ) => Promise<LiveVisualProvider | undefined>;
    obs?: FaceTimeObsController | null;
  }) {
    const config = params.account.config.avatar ?? {};
    this.logger = params.logger;
    this.#config = params.config;
    this.providerId = config.provider ?? "lobster";
    this.#provider = params.provider;
    this.#resolveProvider = params.resolveProvider ?? resolveLiveVisualProvider;
    this.obs =
      params.obs !== undefined
        ? params.obs
        : config.obs?.enabled
          ? new FaceTimeObsController({ config: config.obs, logger: params.logger })
          : null;
    this.video = {
      width: config.obs?.width ?? 1_280,
      height: config.obs?.height ?? 720,
      frameRate: 30,
    };
  }

  async start(): Promise<void> {
    this.#provider ??= await this.#resolveProvider(this.providerId, this.#config);
    if (!this.#provider) {
      throw new Error(`live-visual provider not found: ${this.providerId}`);
    }
    this.logger.info(`[facetime-avatar] using live-visual provider ${this.#provider.id}`);
  }

  async beginCall(sessionId: string): Promise<void> {
    if (!this.#provider) return;
    if (this.#session) {
      await this.#session.close("replaced").catch((error) => this.#recordVisualError(error));
    }
    this.#activeSessionId = null;
    try {
      const session = await this.#provider.open({
        streamId: sessionId,
        clock: { unitsPerSecond: 24_000 },
        video: this.video,
        audio: { encoding: "pcm-s16le", sampleRateHz: 24_000, channels: 1 },
      });
      this.#session = session;
      this.#activeSessionId = sessionId;
      this.#lastHealth = this.#readHealth();
      this.#callDroppedStart = this.#lastHealth.droppedMediaBytes;
      this.#hadReadyVisual = this.#lastHealth.status === "ready";
    } catch (error) {
      this.#activeSessionId = null;
      this.#recordVisualError(error);
      return;
    }
    const session = this.#session;
    if (!session) return;
    try {
      await this.obs?.configure(session.output.url);
      await this.obs?.startVirtualCamera();
    } catch (error) {
      this.#recordObsError(error);
      await this.obs?.stopVirtualCamera().catch((obsError) => this.#recordObsError(obsError));
    }
  }

  sendAudio(audio: Uint8Array, ptsSamples: number): boolean {
    return this.#write({ type: "audio", pts: ptsSamples, data: audio });
  }

  state(state: FaceTimeAvatarState, ptsSamples: number): void {
    this.#write({ type: "cue", pts: ptsSamples, name: "activity", value: state });
  }

  clear(reason: string): void {
    if (!this.#session) return;
    try {
      const flushed = this.#session.write({ type: "flush", reason });
      const reset = this.#session.write({
        type: "cue",
        pts: 0,
        name: "activity",
        value: "listening",
      });
      this.#inspectHealth(flushed && reset);
    } catch (error) {
      this.#degradeVideo(error instanceof Error ? error.message : String(error));
    }
  }

  async endCall(sessionId: string): Promise<number> {
    if (this.#activeSessionId === sessionId) {
      const session = this.#session;
      if (session) {
        this.#lastHealth = this.#readHealth();
        await session.close("hangup").catch((error) => this.#recordVisualError(error));
      }
      this.#session = null;
      this.#activeSessionId = null;
    }
    await this.obs?.stopVirtualCamera().catch((error) => this.#recordObsError(error));
    return Math.max(0, this.#lastHealth.droppedMediaBytes - this.#callDroppedStart);
  }

  snapshot() {
    return {
      providerId: this.providerId,
      output: this.#session?.output ?? null,
      health: this.#readHealth(),
      activeSessionId: this.#activeSessionId,
      visualError: this.#visualError,
      obsError: this.#obsError,
    };
  }

  async stop(): Promise<void> {
    const session = this.#session;
    this.#session = null;
    this.#activeSessionId = null;
    const results = await Promise.allSettled([this.obs?.stop(), session?.close("shutdown")]);
    for (const result of results) {
      if (result.status === "rejected") this.#recordVisualError(result.reason);
    }
  }

  #write(event: Parameters<LiveVisualSession["write"]>[0]): boolean {
    if (!this.#session || !this.#activeSessionId) return false;
    try {
      const accepted = this.#session.write(event);
      this.#inspectHealth(accepted);
      return accepted;
    } catch (error) {
      this.#degradeVideo(error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  #inspectHealth(accepted: boolean): void {
    if (!this.#session) return;
    const health = this.#readHealth();
    const overflowed = health.droppedMediaBytes > this.#lastHealth.droppedMediaBytes;
    if (health.status === "ready") this.#hadReadyVisual = true;
    this.#lastHealth = health;
    if (health.status === "degraded" || overflowed || (!accepted && this.#hadReadyVisual)) {
      this.#degradeVideo(
        health.error ??
          (overflowed ? "live-visual provider overflow" : "live-visual provider disconnected"),
      );
    }
  }

  #recordVisualError(error: unknown): void {
    this.#visualError = error instanceof Error ? error.message : String(error);
    this.logger.warn?.(`[facetime-avatar] visual degraded: ${this.#visualError}`);
  }

  #readHealth(): LiveVisualHealth {
    if (!this.#session) return this.#lastHealth;
    try {
      return this.#session.health();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.#recordVisualError(message);
      return { ...this.#lastHealth, status: "degraded", error: message };
    }
  }

  #recordObsError(error: unknown): void {
    this.#obsError = error instanceof Error ? error.message : String(error);
    this.logger.warn?.(`[facetime-avatar] OBS degraded: ${this.#obsError}`);
  }

  #degradeVideo(reason: string): void {
    this.#recordVisualError(reason);
    void this.obs?.stopVirtualCamera().catch((error) => {
      this.#recordObsError(error);
    });
  }
}
