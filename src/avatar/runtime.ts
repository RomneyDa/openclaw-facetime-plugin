import { randomBytes } from "node:crypto";
import path from "node:path";
import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import type { ResolvedFaceTimeAccount } from "../facetime/types.js";
import { FaceTimeObsController } from "./obs.js";
import { FaceTimeAvatarServer } from "./server.js";

export class FaceTimeAvatarRuntime {
  readonly server: FaceTimeAvatarServer;
  readonly logger: RuntimeLogger;
  readonly obs: FaceTimeObsController | null;
  #obsError?: string;
  #callDroppedStart = 0;

  constructor(params: { account: ResolvedFaceTimeAccount; logger: RuntimeLogger }) {
    const config = params.account.config.avatar ?? {};
    const pluginRoot = path.resolve(params.account.helperPath, "../../..");
    this.logger = params.logger;
    this.server = new FaceTimeAvatarServer({
      assetsPath: path.join(pluginRoot, "dist", "avatar"),
      token: randomBytes(24).toString("base64url"),
      port: config.port ?? 18_794,
      maxBufferedBytes: config.maxBufferedBytes ?? 1_048_576,
      modelUrl: config.modelUrl,
    });
    this.obs = config.obs?.enabled
      ? new FaceTimeObsController({ config: config.obs, logger: params.logger })
      : null;
  }

  async start(): Promise<void> {
    await this.server.start();
    this.logger.info(`[facetime-avatar] renderer listening on loopback port ${this.server.snapshot().port}`);
    if (this.obs) {
      try {
        await this.obs.configure(this.server.rendererUrl);
      } catch (error) {
        this.#obsError = error instanceof Error ? error.message : String(error);
        this.logger.warn?.(`[facetime-avatar] OBS setup failed: ${this.#obsError}`);
      }
    }
  }

  async beginCall(callId: string): Promise<void> {
    this.#callDroppedStart = this.server.snapshot().droppedBytes;
    this.server.broadcast({ type: "call-start", callId });
    try {
      await this.obs?.startVirtualCamera();
    } catch (error) {
      this.#obsError = error instanceof Error ? error.message : String(error);
      this.logger.warn?.(`[facetime-avatar] virtual camera start failed: ${this.#obsError}`);
    }
  }

  sendAudio(audio: Buffer): boolean {
    return this.server.sendAudio(audio);
  }

  clear(callId?: string): void {
    this.server.broadcast({ type: "clear", callId });
  }

  async endCall(callId: string): Promise<number> {
    this.server.broadcast({ type: "clear", callId });
    this.server.broadcast({ type: "call-end", callId });
    await this.obs?.stopVirtualCamera().catch((error) => {
      this.logger.warn?.(
        `[facetime-avatar] virtual camera stop failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
    return this.server.snapshot().droppedBytes - this.#callDroppedStart;
  }

  snapshot() {
    return { ...this.server.snapshot(), rendererUrl: this.server.rendererUrl, obsError: this.#obsError };
  }

  async stop(): Promise<void> {
    await this.obs?.stop();
    await this.server.stop();
  }
}
