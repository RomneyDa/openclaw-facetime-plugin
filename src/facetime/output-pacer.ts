import type { RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import type { AvatarClearReason, AvatarState } from "openclaw-avatar-plugin/renderer";
import type { FaceTimeAvatarRuntime } from "../avatar/runtime.js";
import type { FaceTimeNativeBridge } from "./native-bridge.js";

export class FaceTimeOutputPacer {
  readonly nativeBridge: FaceTimeNativeBridge;
  readonly avatar?: FaceTimeAvatarRuntime;
  readonly callId: string;
  readonly delayMs: number;
  readonly logger: RuntimeLogger;
  readonly maxPendingBytes: number;
  readonly onDelivered?: (bytes: number) => void;
  #pending = new Set<ReturnType<typeof setTimeout>>();
  #pendingBytes = 0;
  #droppedBytes = 0;
  #avatarSamples = 0;

  constructor(params: {
    nativeBridge: FaceTimeNativeBridge;
    avatar?: FaceTimeAvatarRuntime;
    callId: string;
    delayMs: number;
    logger: RuntimeLogger;
    maxPendingBytes?: number;
    onDelivered?: (bytes: number) => void;
  }) {
    this.nativeBridge = params.nativeBridge;
    this.avatar = params.avatar;
    this.callId = params.callId;
    this.delayMs = params.delayMs;
    this.logger = params.logger;
    this.maxPendingBytes = params.maxPendingBytes ?? 512 * 1024;
    this.onDelivered = params.onDelivered;
  }

  get isOpen(): boolean {
    return this.nativeBridge.running;
  }

  get droppedBytes(): number {
    return this.#droppedBytes;
  }

  send(audio: Buffer): void {
    const ptsMs = this.#avatarSamples / 24;
    this.avatar?.sendAudio(audio, ptsMs);
    this.#avatarSamples += Math.floor(audio.byteLength / 2);
    if (this.delayMs === 0) {
      this.#deliver(audio);
      return;
    }
    if (this.#pendingBytes + audio.byteLength > this.maxPendingBytes) {
      this.#droppedBytes += audio.byteLength;
      this.logger.warn?.("[facetime] dropped delayed output audio because the A/V pacer is full");
      return;
    }
    const copy = Buffer.from(audio);
    this.#pendingBytes += copy.byteLength;
    const timer = setTimeout(() => {
      this.#pending.delete(timer);
      this.#pendingBytes -= copy.byteLength;
      this.#deliver(copy);
    }, this.delayMs);
    timer.unref?.();
    this.#pending.add(timer);
  }

  state(state: AvatarState): void {
    this.avatar?.state(state, this.#avatarSamples / 24);
  }

  clear(reason: AvatarClearReason = "cancel"): void {
    for (const timer of this.#pending) {
      clearTimeout(timer);
    }
    this.#pending.clear();
    this.#pendingBytes = 0;
    this.#avatarSamples = 0;
    try {
      this.nativeBridge.sendCommand({ type: "clear-audio", callId: this.callId });
    } catch {
      // Native helper failure is handled by the call manager.
    }
    this.avatar?.clear(reason);
  }

  #deliver(audio: Buffer): void {
    if (this.nativeBridge.sendAudio(audio)) {
      this.onDelivered?.(audio.byteLength);
    }
  }
}
