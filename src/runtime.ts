import type { PluginRuntime } from "openclaw/plugin-sdk";

let runtime: PluginRuntime | null = null;

export function setFaceTimeRuntime(next: PluginRuntime): void {
  runtime = next;
}

export function getFaceTimeRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error("FaceTime runtime not initialized");
  }
  return runtime;
}
