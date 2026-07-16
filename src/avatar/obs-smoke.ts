import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import { FaceTimeObsController } from "./obs.js";

const rendererUrl = process.argv[2];
if (!rendererUrl?.startsWith("http://127.0.0.1:")) {
  throw new Error("usage: npm run avatar:obs-smoke -- <loopback-renderer-url>");
}
const logger = {
  info: (message: string) => console.log(message),
  warn: (message: string) => console.warn(message),
  error: (message: string) => console.error(message),
} as RuntimeLogger;
const controller = new FaceTimeObsController({
  config: {
    enabled: true,
    url: "ws://127.0.0.1:4455",
    passwordEnv: "OBS_WEBSOCKET_PASSWORD",
    autoStartVirtualCamera: !process.argv.includes("--no-virtual-camera"),
  },
  logger,
});

await controller.configure(rendererUrl);
const testVirtualCamera = !process.argv.includes("--no-virtual-camera");
if (testVirtualCamera) {
  await controller.startVirtualCamera();
}
await new Promise((resolve) => setTimeout(resolve, 1_000));
await controller.stop();
console.log(
  testVirtualCamera
    ? "OBS avatar scene and virtual-camera start/stop smoke passed"
    : "OBS avatar scene smoke passed (virtual camera intentionally skipped)",
);
