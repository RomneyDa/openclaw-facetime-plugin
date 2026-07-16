import { OBSWebSocket } from "obs-websocket-js";
import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import type { FaceTimeAvatarConfig } from "../facetime/types.js";

export class FaceTimeObsController {
  readonly config: NonNullable<FaceTimeAvatarConfig["obs"]>;
  readonly logger: RuntimeLogger;
  readonly client: OBSWebSocket;
  #connected = false;
  #startedVirtualCamera = false;

  constructor(params: {
    config: NonNullable<FaceTimeAvatarConfig["obs"]>;
    logger: RuntimeLogger;
    client?: OBSWebSocket;
  }) {
    this.config = params.config;
    this.logger = params.logger;
    this.client = params.client ?? new OBSWebSocket();
  }

  async configure(rendererUrl: string): Promise<void> {
    const url = this.config.url ?? "ws://127.0.0.1:4455";
    const passwordEnv = this.config.passwordEnv ?? "OBS_WEBSOCKET_PASSWORD";
    const password = process.env[passwordEnv];
    await this.client.connect(url, password, { rpcVersion: 1 });
    this.#connected = true;
    const sceneName = this.config.sceneName ?? "OpenClaw FaceTime Avatar";
    const sourceName = this.config.sourceName ?? "OpenClaw Avatar Renderer";
    const scenes = await this.client.call("GetSceneList");
    if (!scenes.scenes.some((scene) => scene.sceneName === sceneName)) {
      await this.client.call("CreateScene", { sceneName });
    }
    const inputs = await this.client.call("GetInputList", { inputKind: "browser_source" });
    const inputSettings = {
      url: rendererUrl,
      width: this.config.width ?? 1_280,
      height: this.config.height ?? 720,
      reroute_audio: false,
      shutdown: false,
      restart_when_active: true,
    };
    if (inputs.inputs.some((input) => input.inputName === sourceName)) {
      await this.client.call("SetInputSettings", {
        inputName: sourceName,
        inputSettings,
        overlay: true,
      });
      try {
        const item = await this.client.call("GetSceneItemId", { sceneName, sourceName });
        await this.client.call("SetSceneItemEnabled", {
          sceneName,
          sceneItemId: item.sceneItemId,
          sceneItemEnabled: false,
        });
        await this.client.call("SetSceneItemEnabled", {
          sceneName,
          sceneItemId: item.sceneItemId,
          sceneItemEnabled: true,
        });
      } catch {
        await this.client.call("CreateSceneItem", { sceneName, sourceName, sceneItemEnabled: true });
      }
    } else {
      await this.client.call("CreateInput", {
        sceneName,
        inputName: sourceName,
        inputKind: "browser_source",
        inputSettings,
        sceneItemEnabled: true,
      });
    }
    await this.client.call("SetCurrentProgramScene", { sceneName });
    this.logger.info("[facetime-avatar] OBS scene configured and renderer attached");
  }

  async startVirtualCamera(): Promise<void> {
    if (!this.#connected || this.config.autoStartVirtualCamera === false) {
      return;
    }
    const status = await this.client.call("GetVirtualCamStatus");
    if (status.outputActive) {
      return;
    }
    await this.client.call("StartVirtualCam");
    const started = await this.client.call("GetVirtualCamStatus");
    if (!started.outputActive) {
      throw new Error(
        "OBS virtual camera did not start; approve the OBS Camera Extension in macOS System Settings",
      );
    }
    this.#startedVirtualCamera = true;
  }

  async stopVirtualCamera(): Promise<void> {
    if (!this.#connected || !this.#startedVirtualCamera) {
      return;
    }
    await this.client.call("StopVirtualCam");
    this.#startedVirtualCamera = false;
  }

  async stop(): Promise<void> {
    if (!this.#connected) {
      return;
    }
    await this.stopVirtualCamera().catch(() => {});
    await this.client.disconnect();
    this.#connected = false;
    this.#startedVirtualCamera = false;
  }
}
