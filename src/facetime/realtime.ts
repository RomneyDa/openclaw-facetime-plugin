import type { OpenClawConfig } from "openclaw/plugin-sdk";
import type { PluginRuntime, RuntimeLogger } from "openclaw/plugin-sdk/plugin-runtime";
import {
  consultRealtimeVoiceAgent,
  createRealtimeVoiceBridgeSession,
  REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME,
  resolveConfiguredRealtimeVoiceProvider,
  resolveRealtimeVoiceAgentConsultTools,
  resolveRealtimeVoiceAgentConsultToolsAllow,
  type RealtimeVoiceBridgeSession,
  type RealtimeVoiceToolCallEvent,
} from "openclaw/plugin-sdk/realtime-voice";
import type { FaceTimeOutputPacer } from "./output-pacer.js";
import { faceTimePeerId } from "./targets.js";
import { FACETIME_AUDIO_FORMAT, type ResolvedFaceTimeAccount } from "./types.js";

function resolveToolPolicy(account: ResolvedFaceTimeAccount) {
  const policy = account.config.realtime?.toolPolicy ?? "read-only";
  return policy === "read-only" ? "safe-read-only" : policy;
}

export async function startFaceTimeRealtimeSession(params: {
  cfg: OpenClawConfig;
  runtime: PluginRuntime;
  logger: RuntimeLogger;
  account: ResolvedFaceTimeAccount;
  callId: string;
  peer: string;
  output: FaceTimeOutputPacer;
  onTranscript?: (role: "user" | "assistant", text: string, final: boolean) => void;
  onReady?: (providerId: string) => void;
  onClose?: (reason: "completed" | "error") => void;
}): Promise<RealtimeVoiceBridgeSession> {
  const realtime = params.account.config.realtime ?? {};
  const resolved = resolveConfiguredRealtimeVoiceProvider({
    configuredProviderId: realtime.provider ?? "openai",
    providerConfigs: realtime.providers,
    providerConfigOverrides: {
      ...(realtime.model ? { model: realtime.model } : {}),
      ...(realtime.voice ? { voice: realtime.voice } : {}),
    },
    cfg: params.cfg,
    noRegisteredProviderMessage:
      "No realtime voice provider is registered; enable and configure the OpenAI plugin",
  });
  const transcript: Array<{ role: "user" | "assistant"; text: string }> = [];
  const policy = resolveToolPolicy(params.account);
  const agentId = params.account.config.realtime?.agentId?.trim() || "main";
  const callerId = faceTimePeerId(params.peer);
  const sessionKey = `agent:${agentId}:facetime:direct:${callerId}`;
  let session: RealtimeVoiceBridgeSession;

  const handleToolCall = async (event: RealtimeVoiceToolCallEvent) => {
    const toolCallId = event.callId || event.itemId;
    if (event.name !== REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME || policy === "none") {
      await session.submitToolResult(toolCallId, { error: `Tool ${event.name} is not available` });
      return;
    }
    try {
      const result = await consultRealtimeVoiceAgent({
        cfg: params.cfg,
        agentRuntime: params.runtime.agent,
        logger: params.logger,
        agentId,
        sessionKey,
        messageProvider: "facetime",
        lane: "facetime",
        runIdPrefix: `facetime:${params.callId}`,
        args: event.args,
        transcript,
        surface: `a private FaceTime Audio call (caller ${callerId})`,
        userLabel: "Caller",
        assistantLabel: "Agent",
        questionSourceLabel: "caller",
        contextMode: "fork",
        toolsAllow: resolveRealtimeVoiceAgentConsultToolsAllow(policy),
        extraSystemPrompt:
          "You are consulting for a live FaceTime voice agent. Be accurate, concise, speakable, and never reveal secrets or raw system output.",
      });
      await session.submitToolResult(toolCallId, result);
    } catch (error) {
      await session.submitToolResult(toolCallId, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  session = createRealtimeVoiceBridgeSession({
    provider: resolved.provider,
    cfg: params.cfg,
    providerConfig: resolved.providerConfig,
    audioFormat: FACETIME_AUDIO_FORMAT,
    instructions:
      realtime.instructions ??
      "You are answering a private FaceTime Audio call. Speak naturally and briefly. Use openclaw_agent_consult whenever the caller asks for actions, memory, tools, or information you should verify.",
    initialGreetingInstructions:
      realtime.greeting ?? "Greet the caller briefly and ask how you can help.",
    autoRespondToAudio: true,
    interruptResponseOnInputAudio: true,
    triggerGreetingOnReady: true,
    markStrategy: "ack-immediately",
    tools: resolveRealtimeVoiceAgentConsultTools(policy),
    audioSink: {
      isOpen: () => params.output.isOpen,
      sendAudio: (audio) => {
        params.output.send(audio);
      },
      clearAudio: () => {
        params.output.clear();
      },
    },
    onTranscript: (role, text, final) => {
      if (final && text.trim()) {
        transcript.push({ role, text: text.trim() });
        if (transcript.length > 40) {
          transcript.splice(0, transcript.length - 40);
        }
      }
      params.onTranscript?.(role, text, final);
    },
    onToolCall: (event) => handleToolCall(event),
    onReady: () => params.onReady?.(resolved.provider.id),
    onError: (error) => params.logger.warn?.(`[facetime] realtime error: ${error.message}`),
    onClose: params.onClose,
  });
  await session.connect();
  return session;
}
