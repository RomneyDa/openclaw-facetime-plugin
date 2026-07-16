import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import type { OBSWebSocket } from "obs-websocket-js";
import { describe, expect, it, vi } from "vitest";
import { FaceTimeObsController } from "./obs.js";

function logger(): RuntimeLogger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as RuntimeLogger;
}

describe("FaceTime OBS controller", () => {
  it("creates a browser scene and starts only an inactive virtual camera", async () => {
    let virtualCameraChecks = 0;
    const call = vi.fn(async (request: string) => {
      if (request === "GetSceneList") return { scenes: [] };
      if (request === "GetInputList") return { inputs: [] };
      if (request === "GetVirtualCamStatus") {
        virtualCameraChecks += 1;
        return { outputActive: virtualCameraChecks > 1 };
      }
      return {};
    });
    const client = {
      connect: vi.fn(async () => ({})),
      call,
      disconnect: vi.fn(async () => {}),
    } as unknown as OBSWebSocket;
    const controller = new FaceTimeObsController({
      config: { enabled: true, autoStartVirtualCamera: true },
      logger: logger(),
      client,
    });
    await controller.configure("http://127.0.0.1:18794/?token=secret");
    await controller.startVirtualCamera();
    expect(call).toHaveBeenCalledWith("CreateScene", { sceneName: "OpenClaw FaceTime Avatar" });
    expect(call).toHaveBeenCalledWith(
      "CreateInput",
      expect.objectContaining({
        inputName: "OpenClaw Avatar Renderer",
        inputKind: "browser_source",
        inputSettings: expect.objectContaining({ reroute_audio: false }),
      }),
    );
    expect(call).toHaveBeenCalledWith("StartVirtualCam");
    await controller.stop();
    expect(call).toHaveBeenCalledWith("StopVirtualCam");
    expect(client.disconnect).toHaveBeenCalledOnce();
  });

  it("fails when macOS has not approved the OBS camera extension", async () => {
    const call = vi.fn(async (request: string) => {
      if (request === "GetSceneList") return { scenes: [] };
      if (request === "GetInputList") return { inputs: [] };
      if (request === "GetVirtualCamStatus") return { outputActive: false };
      return {};
    });
    const client = {
      connect: vi.fn(async () => ({})),
      call,
      disconnect: vi.fn(async () => {}),
    } as unknown as OBSWebSocket;
    const controller = new FaceTimeObsController({
      config: { enabled: true, autoStartVirtualCamera: true },
      logger: logger(),
      client,
    });
    await controller.configure("http://127.0.0.1:18794/");
    await expect(controller.startVirtualCamera()).rejects.toThrow(
      /approve the OBS Camera Extension/,
    );
  });

  it("reports an unavailable OBS server without silently authenticating elsewhere", async () => {
    const client = {
      connect: vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    } as unknown as OBSWebSocket;
    const controller = new FaceTimeObsController({
      config: { enabled: true, url: "ws://127.0.0.1:4455" },
      logger: logger(),
      client,
    });
    await expect(controller.configure("http://127.0.0.1:18794/")).rejects.toThrow("ECONNREFUSED");
    expect(client.connect).toHaveBeenCalledWith("ws://127.0.0.1:4455", undefined, { rpcVersion: 1 });
  });
});
