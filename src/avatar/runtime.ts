import {
  createAvatarRenderer,
  type AvatarClearReason,
  type AvatarRenderer,
  type AvatarState,
} from "openclaw-avatar-plugin/renderer";
import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import type { ResolvedFaceTimeAccount } from "../facetime/types.js";
import { FaceTimeObsController } from "./obs.js";

export class FaceTimeAvatarRuntime {
  readonly renderer: AvatarRenderer;
  readonly logger: RuntimeLogger;
  readonly obs: FaceTimeObsController | null;
  readonly video: { width: number; height: number; frameRate: number };
  #obsError?: string;
  #rendererError?: string;
  #activeSessionId: string | null = null;
  #callDroppedStart = 0;
  #hadReadyRenderer = false;
  #lastTransportDrops = 0;

  constructor(params: {
    account: ResolvedFaceTimeAccount;
    logger: RuntimeLogger;
    renderer?: AvatarRenderer;
    obs?: FaceTimeObsController | null;
  }) {
    const config = params.account.config.avatar ?? {};
    this.logger = params.logger;
    this.renderer =
      params.renderer ??
      createAvatarRenderer({
        port: config.port ?? 18_794,
        maxSubscriberMediaBytes: config.maxBufferedBytes ?? 1_048_576,
        maxTransportBufferedBytes: config.maxBufferedBytes ?? 1_048_576,
        onSubscriberError: (_id, error) => this.#recordRendererError(error),
      });
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
    await this.renderer.start();
    this.logger.info(`[facetime-avatar] renderer listening on ${new URL(this.renderer.rendererUrl).origin}`);
    if (this.obs) {
      try {
        await this.obs.configure(this.renderer.rendererUrl);
      } catch (error) {
        this.#obsError = error instanceof Error ? error.message : String(error);
        this.logger.warn?.(`[facetime-avatar] OBS setup failed: ${this.#obsError}`);
      }
    }
  }

  async beginCall(sessionId: string): Promise<void> {
    try {
      if (this.#activeSessionId) this.renderer.consumer.end("replaced");
      this.#activeSessionId = sessionId;
      this.#callDroppedStart = this.#droppedBytes();
      this.#hadReadyRenderer = false;
      this.#lastTransportDrops = this.renderer.snapshot().droppedTransportMedia;
      this.renderer.consumer.start({ sessionId, video: this.video, initialState: "listening" });
    } catch (error) {
      this.#activeSessionId = null;
      this.#recordRendererError(error);
    }
    if (!this.#activeSessionId) return;
    try {
      await this.obs?.startVirtualCamera();
    } catch (error) {
      this.#obsError = error instanceof Error ? error.message : String(error);
      this.logger.warn?.(`[facetime-avatar] virtual camera start failed: ${this.#obsError}`);
    }
  }

  sendAudio(audio: Uint8Array, ptsMs: number): boolean {
    if (!this.#activeSessionId) return false;
    try {
      const accepted = this.renderer.consumer.audio(audio, ptsMs);
      const snapshot = this.renderer.snapshot();
      if (snapshot.readyClients > 0) this.#hadReadyRenderer = true;
      const overflowed = snapshot.droppedTransportMedia > this.#lastTransportDrops;
      this.#lastTransportDrops = snapshot.droppedTransportMedia;
      if (snapshot.rendererError || overflowed || (!accepted && this.#hadReadyRenderer)) {
        this.#degradeVideo(
          snapshot.rendererError ?? (overflowed ? "renderer transport overflow" : "renderer disconnected"),
        );
      }
      return accepted;
    } catch (error) {
      this.#degradeVideo(error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  state(state: AvatarState, ptsMs: number): void {
    if (!this.#activeSessionId) return;
    try {
      this.renderer.consumer.state(state, ptsMs);
    } catch (error) {
      this.#recordRendererError(error);
    }
  }

  clear(reason: AvatarClearReason): void {
    if (!this.#activeSessionId) return;
    try {
      this.renderer.consumer.clear(reason);
      this.renderer.consumer.state("listening", 0);
    } catch (error) {
      this.#recordRendererError(error);
    }
  }

  async endCall(sessionId: string): Promise<number> {
    if (this.#activeSessionId === sessionId) {
      try {
        this.renderer.consumer.end("hangup");
      } catch (error) {
        this.#recordRendererError(error);
      }
      this.#activeSessionId = null;
    }
    await this.obs?.stopVirtualCamera().catch((error) => {
      this.#obsError = error instanceof Error ? error.message : String(error);
      this.logger.warn?.(`[facetime-avatar] virtual camera stop failed: ${this.#obsError}`);
    });
    return Math.max(0, this.#droppedBytes() - this.#callDroppedStart);
  }

  snapshot() {
    return {
      renderer: this.renderer.snapshot(),
      rendererUrl: this.renderer.rendererUrl,
      activeSessionId: this.#activeSessionId,
      rendererError: this.#rendererError,
      obsError: this.#obsError,
    };
  }

  async stop(): Promise<void> {
    this.#activeSessionId = null;
    const results = await Promise.allSettled([this.obs?.stop(), this.renderer.stop()]);
    for (const result of results) {
      if (result.status === "rejected") this.#recordRendererError(result.reason);
    }
  }

  #droppedBytes(): number {
    return this.renderer.snapshot().session.droppedMediaBytes;
  }

  #recordRendererError(error: unknown): void {
    this.#rendererError = error instanceof Error ? error.message : String(error);
    this.logger.warn?.(`[facetime-avatar] renderer degraded: ${this.#rendererError}`);
  }

  #degradeVideo(reason: string): void {
    this.#recordRendererError(reason);
    void this.obs?.stopVirtualCamera().catch((error) => {
      this.#obsError = error instanceof Error ? error.message : String(error);
      this.logger.warn?.(`[facetime-avatar] audio-only fallback could not stop Virtual Camera: ${this.#obsError}`);
    });
  }
}
