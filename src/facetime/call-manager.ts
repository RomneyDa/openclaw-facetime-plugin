import { randomUUID } from "node:crypto";
import type { OpenClawConfig } from "openclaw/plugin-sdk";
import type { PluginRuntime, RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import type { RealtimeVoiceBridgeSession } from "openclaw/plugin-sdk/realtime-voice";
import { FaceTimeNativeBridge } from "./native-bridge.js";
import { startFaceTimeRealtimeSession } from "./realtime.js";
import { faceTimePeerId, normalizeFaceTimeAddress } from "./targets.js";
import type {
  FaceTimeCallSnapshot,
  FaceTimeCallState,
  FaceTimeNativeEvent,
  ResolvedFaceTimeAccount,
} from "./types.js";

function nowIso(): string {
  return new Date().toISOString();
}

function peerMatchesAllowlist(peer: string, allowFrom: string[]): boolean {
  const normalizedPeer = (() => {
    try {
      return normalizeFaceTimeAddress(peer);
    } catch {
      return peer.trim().toLowerCase();
    }
  })();
  return allowFrom.some((entry) => {
    if (entry.trim() === "*") {
      return true;
    }
    try {
      return normalizeFaceTimeAddress(entry) === normalizedPeer;
    } catch {
      return entry.trim().toLowerCase() === normalizedPeer;
    }
  });
}

export function isFaceTimeCallerAllowed(params: {
  peer: string;
  policy: "allowlist" | "open" | "disabled";
  allowFrom: string[];
}): boolean {
  return (
    params.policy === "open" ||
    (params.policy === "allowlist" && peerMatchesAllowlist(params.peer, params.allowFrom))
  );
}

export class FaceTimeCallManager {
  readonly account: ResolvedFaceTimeAccount;
  readonly bridge: FaceTimeNativeBridge;
  readonly cfg: OpenClawConfig;
  readonly runtime: PluginRuntime;
  readonly logger: RuntimeLogger;
  #active: FaceTimeCallSnapshot | null = null;
  #recent: FaceTimeCallSnapshot[] = [];
  #realtime: RealtimeVoiceBridgeSession | null = null;
  #realtimeStarting: Promise<void> | null = null;
  #maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  #dialTimer: ReturnType<typeof setTimeout> | null = null;
  #pendingSpeech: string | null = null;
  #started = false;
  #stopping = false;
  readonly #startRealtime: typeof startFaceTimeRealtimeSession;
  readonly #onBridgeEvent = (event: FaceTimeNativeEvent) => {
    void this.#handleNativeEvent(event).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn?.(`[facetime] native event handling failed: ${message}`);
      if (this.#active) {
        void this.#finishCall("failed", message);
      }
    });
  };
  readonly #onBridgeAudio = (audio: Buffer) => {
    if (this.#active?.state !== "connected" || !this.#realtime) {
      return;
    }
    this.#active.inputBytes += audio.byteLength;
    this.#realtime.sendAudio(audio);
  };
  readonly #onBridgeError = (error: Error) => {
    this.logger.warn?.(`[facetime] native bridge error: ${error.message}`);
    if (this.#active) {
      void this.#finishCall("failed", error.message);
    }
  };
  readonly #onBridgeExit = () => {
    if (!this.#stopping && this.#active) {
      void this.#finishCall("failed", "native helper exited");
    }
  };

  constructor(params: {
    account: ResolvedFaceTimeAccount;
    cfg: OpenClawConfig;
    runtime: PluginRuntime;
    logger: RuntimeLogger;
    bridge?: FaceTimeNativeBridge;
    startRealtime?: typeof startFaceTimeRealtimeSession;
  }) {
    this.account = params.account;
    this.cfg = params.cfg;
    this.runtime = params.runtime;
    this.logger = params.logger;
    this.bridge =
      params.bridge ??
      new FaceTimeNativeBridge({
        helperPath: params.account.helperPath,
        logger: params.logger,
      });
    this.#startRealtime = params.startRealtime ?? startFaceTimeRealtimeSession;
  }

  async start(signal?: AbortSignal): Promise<void> {
    if (this.#started) {
      return;
    }
    if (!this.account.identity) {
      throw new Error(`FaceTime identity is not configured for account ${this.account.accountId}`);
    }
    this.#stopping = false;
    this.#started = true;
    this.bridge.on("event", this.#onBridgeEvent);
    this.bridge.on("audio", this.#onBridgeAudio);
    this.bridge.on("error", this.#onBridgeError);
    this.bridge.on("exit", this.#onBridgeExit);
    try {
      await this.bridge.start({
        type: "configure",
        identity: this.account.identity,
        blackHoleDevice: this.account.blackHoleDevice,
        sampleRateHz: 24_000,
        channels: 1,
      });
    } catch (error) {
      this.#started = false;
      this.#detachBridgeListeners();
      throw error;
    }
    signal?.addEventListener("abort", () => void this.stop(), { once: true });
  }

  snapshot(): { active: FaceTimeCallSnapshot | null; recent: FaceTimeCallSnapshot[] } {
    return {
      active: this.#active ? { ...this.#active } : null,
      recent: this.#recent.map((call) => ({ ...call })),
    };
  }

  async dial(target: string, initialSpeech?: string): Promise<FaceTimeCallSnapshot> {
    this.#assertAvailable();
    const peer = normalizeFaceTimeAddress(target);
    const call = this.#createCall("outbound", peer, "dialing");
    this.#pendingSpeech = initialSpeech?.trim() || null;
    this.bridge.sendCommand({ type: "dial", callId: call.id, target: peer });
    this.#dialTimer = setTimeout(() => {
      if (this.#active?.id !== call.id || this.#active.state === "connected") {
        return;
      }
      this.logger.info(`[facetime] ending ${call.id}: dial timed out`);
      try {
        this.bridge.sendCommand({ type: "hangup", callId: call.id });
      } catch {
        // Helper failure is reflected in the terminal call state below.
      }
      void this.#finishCall("failed", "dial timed out");
    }, this.account.config.dialTimeoutMs ?? 45_000);
    this.#dialTimer.unref?.();
    return { ...call };
  }

  async answer(callId?: string): Promise<FaceTimeCallSnapshot> {
    const call = this.#requireActive(callId);
    if (call.direction !== "inbound" || call.state !== "ringing") {
      throw new Error("Only a ringing inbound FaceTime call can be answered");
    }
    call.state = "connecting";
    this.bridge.sendCommand({ type: "accept", callId: call.id });
    return { ...call };
  }

  async decline(callId?: string, reason = "declined"): Promise<FaceTimeCallSnapshot> {
    const call = this.#requireActive(callId);
    this.bridge.sendCommand({ type: "decline", callId: call.id, reason });
    await this.#finishCall("ended", reason);
    return { ...call };
  }

  async hangup(callId?: string): Promise<FaceTimeCallSnapshot> {
    const call = this.#requireActive(callId);
    call.state = "ending";
    this.bridge.sendCommand({ type: "hangup", callId: call.id });
    await this.#finishCall("ended", "local hangup");
    return { ...call };
  }

  speak(text: string): void {
    const call = this.#requireActive();
    if (call.state !== "connected" || !this.#realtime) {
      throw new Error("FaceTime call is not connected to the realtime voice provider");
    }
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("Speech text is required");
    }
    this.#realtime.sendUserMessage(
      `Speak this exact message to the FaceTime caller without adding or removing words: ${JSON.stringify(trimmed)}`,
    );
  }

  async sendText(target: string, text: string): Promise<FaceTimeCallSnapshot> {
    const peer = normalizeFaceTimeAddress(target);
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("FaceTime outbound text must contain speech");
    }
    if (this.#active) {
      if (normalizeFaceTimeAddress(this.#active.peer) !== peer) {
        throw new Error(`FaceTime is busy with ${this.#active.peer}`);
      }
      this.speak(trimmed);
      return { ...this.#active };
    }
    return await this.dial(peer, trimmed);
  }

  async stop(): Promise<void> {
    if (this.#stopping) {
      return;
    }
    this.#stopping = true;
    if (this.#active) {
      try {
        this.bridge.sendCommand({ type: "hangup", callId: this.#active.id });
      } catch {
        // Helper may already be unavailable.
      }
      await this.#finishCall("ended", "gateway shutdown");
    }
    try {
      await this.bridge.stop();
    } finally {
      this.#detachBridgeListeners();
      this.#started = false;
    }
  }

  #assertAvailable(): void {
    if (this.#active) {
      throw new Error(
        `FaceTime account ${this.account.accountId} already has active call ${this.#active.id}`,
      );
    }
  }

  #requireActive(callId?: string): FaceTimeCallSnapshot {
    const call = this.#active;
    if (!call || (callId && call.id !== callId)) {
      throw new Error(callId ? `FaceTime call ${callId} is not active` : "No active FaceTime call");
    }
    return call;
  }

  #createCall(
    direction: "inbound" | "outbound",
    peer: string,
    state: FaceTimeCallState,
    callId: string = randomUUID(),
  ): FaceTimeCallSnapshot {
    this.#assertAvailable();
    const call: FaceTimeCallSnapshot = {
      id: callId,
      accountId: this.account.accountId,
      direction,
      peer,
      state,
      startedAt: nowIso(),
      inputBytes: 0,
      outputBytes: 0,
    };
    this.#active = call;
    return call;
  }

  async #handleNativeEvent(event: FaceTimeNativeEvent): Promise<void> {
    if (event.type === "ready") {
      this.logger.info(`[facetime] native helper ready (pid=${event.pid})`);
      return;
    }
    if (event.type === "diagnostics" || event.type === "audio-cleared") {
      return;
    }
    if (event.type === "error") {
      this.logger.warn?.(`[facetime] ${event.code}: ${event.message}`);
      if (event.fatal && this.#active) {
        await this.#finishCall("failed", event.message);
      }
      return;
    }
    if (event.type === "incoming") {
      await this.#handleIncoming(event.callId, event.peer);
      return;
    }
    if (event.type === "call-state") {
      const call = this.#active;
      if (!call || call.id !== event.callId) {
        return;
      }
      if (event.peer) {
        call.peer = event.peer;
      }
      call.state = event.state;
      if (event.state === "connected") {
        if (this.#dialTimer) {
          clearTimeout(this.#dialTimer);
          this.#dialTimer = null;
        }
        call.connectedAt ??= nowIso();
        await this.#connectRealtime(call);
      } else if (event.state === "ended" || event.state === "failed") {
        await this.#finishCall(event.state, event.reason);
      }
    }
  }

  async #handleIncoming(callId: string, peer: string): Promise<void> {
    const callerId = faceTimePeerId(peer);
    if (this.#active) {
      this.bridge.sendCommand({ type: "decline", callId, reason: "busy" });
      this.logger.info(`[facetime] declined concurrent caller=${callerId}: busy`);
      return;
    }
    const policy = this.account.config.inboundPolicy ?? "allowlist";
    const allowed = isFaceTimeCallerAllowed({
      peer,
      policy,
      allowFrom: this.account.config.allowFrom ?? [],
    });
    if (!allowed) {
      this.bridge.sendCommand({
        type: "decline",
        callId,
        reason: policy === "disabled" ? "inbound disabled" : "caller not allowed",
      });
      this.logger.info(`[facetime] declined inbound caller=${callerId}: policy=${policy}`);
      return;
    }
    const call = this.#createCall("inbound", peer, "ringing", callId);
    this.logger.info(`[facetime] inbound caller=${callerId} call=${call.id}`);
    if (this.account.config.autoAnswer !== false) {
      await this.answer(call.id);
    }
  }

  async #connectRealtime(call: FaceTimeCallSnapshot): Promise<void> {
    if (this.#realtime) {
      return;
    }
    if (this.#realtimeStarting) {
      await this.#realtimeStarting;
      if (this.#realtime || this.#active?.id !== call.id) {
        return;
      }
    }
    this.#realtimeStarting = this.#startRealtimeForCall(call);
    try {
      await this.#realtimeStarting;
    } finally {
      this.#realtimeStarting = null;
    }
  }

  async #startRealtimeForCall(call: FaceTimeCallSnapshot): Promise<void> {
    this.#maxDurationTimer = setTimeout(() => {
      this.logger.info(`[facetime] ending ${call.id}: maximum call duration reached`);
      void this.hangup(call.id).catch((error) => {
        this.logger.warn?.(
          `[facetime] maximum-duration hangup failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    }, this.account.config.maxCallDurationMs ?? 3_600_000);
    this.#maxDurationTimer.unref?.();
    try {
      const realtime = await this.#startRealtime({
        cfg: this.cfg,
        runtime: this.runtime,
        logger: this.logger,
        account: this.account,
        callId: call.id,
        peer: call.peer,
        nativeBridge: this.bridge,
        onReady: (providerId) => {
          call.realtimeProvider = providerId;
          this.logger.info(`[facetime] realtime provider ready: ${providerId}`);
        },
        onOutputAudio: (bytes) => {
          if (this.#active?.id === call.id) {
            call.outputBytes += bytes;
          }
        },
        onTranscript: (role, text, final) => {
          if (final) {
            this.logger.info(`[facetime] ${role} transcript: chars=${text.length}`);
          }
        },
        onClose: (reason) => {
          if (reason === "error" && this.#active?.id === call.id) {
            void this.#finishCall("failed", "realtime provider closed with error");
          }
        },
      });
      if (this.#active?.id !== call.id || this.#active.state !== "connected") {
        realtime.close();
        return;
      }
      this.#realtime = realtime;
      const pendingSpeech = this.#pendingSpeech;
      this.#pendingSpeech = null;
      if (pendingSpeech && this.#active?.id === call.id) {
        this.speak(pendingSpeech);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (this.#active?.id === call.id) {
        try {
          this.bridge.sendCommand({ type: "hangup", callId: call.id });
        } catch {
          // The native failure is already represented by the terminal call state.
        }
        await this.#finishCall("failed", `realtime startup failed: ${message}`);
      }
    }
  }

  async #finishCall(state: "ended" | "failed", reason?: string): Promise<void> {
    const call = this.#active;
    if (!call) {
      return;
    }
    if (this.#maxDurationTimer) {
      clearTimeout(this.#maxDurationTimer);
      this.#maxDurationTimer = null;
    }
    if (this.#dialTimer) {
      clearTimeout(this.#dialTimer);
      this.#dialTimer = null;
    }
    const realtime = this.#realtime;
    this.#realtime = null;
    this.#pendingSpeech = null;
    try {
      realtime?.close();
    } catch {
      // Provider may already be closed.
    }
    call.state = state;
    if (reason) {
      call.reason = reason;
    } else {
      delete call.reason;
    }
    call.endedAt = nowIso();
    this.#recent.unshift({ ...call });
    this.#recent = this.#recent.slice(0, 10);
    this.#active = null;
    this.logger.info(`[facetime] call ${call.id} ${state}${reason ? `: ${reason}` : ""}`);
  }

  #detachBridgeListeners(): void {
    this.bridge.off("event", this.#onBridgeEvent);
    this.bridge.off("audio", this.#onBridgeAudio);
    this.bridge.off("error", this.#onBridgeError);
    this.bridge.off("exit", this.#onBridgeExit);
  }
}

const managers = new Map<string, FaceTimeCallManager>();

export function registerFaceTimeCallManager(manager: FaceTimeCallManager): void {
  managers.set(manager.account.accountId, manager);
}

export function unregisterFaceTimeCallManager(accountId: string, manager: FaceTimeCallManager): void {
  if (managers.get(accountId) === manager) {
    managers.delete(accountId);
  }
}

export function getFaceTimeCallManager(accountId = "default"): FaceTimeCallManager {
  const manager = managers.get(accountId);
  if (!manager) {
    throw new Error(`FaceTime account ${accountId} is not running`);
  }
  return manager;
}

export function listFaceTimeCallManagers(): FaceTimeCallManager[] {
  return [...managers.values()];
}
