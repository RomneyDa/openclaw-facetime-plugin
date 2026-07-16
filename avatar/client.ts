import { HeadAudio } from "@met4citizen/headaudio/dist/headaudio.min.mjs";
import { TalkingHead } from "@met4citizen/talkinghead";

const avatarElement = document.querySelector<HTMLElement>("#avatar")!;
const presetElement = document.querySelector<HTMLElement>("#preset")!;
const mouthElement = document.querySelector<HTMLElement>("#mouth")!;
const statusElement = document.querySelector<HTMLElement>("#status")!;
const resumeButton = document.querySelector<HTMLButtonElement>("#resume")!;
const token = new URL(location.href).searchParams.get("token") ?? "";
const socketProtocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${socketProtocol}//${location.host}/stream?token=${encodeURIComponent(token)}`);
socket.binaryType = "arraybuffer";

const audioContext = new AudioContext({ sampleRate: 48_000, latencyHint: "interactive" });
const analysisGain = new GainNode(audioContext, { gain: 1 });
const activeSources = new Set<AudioBufferSourceNode>();
const visemes = new Map<string, number>();
let headAudio: HeadAudio | null = null;
let talkingHead: TalkingHead | null = null;
let nextAudioTime = 0;
let lastFrame = performance.now();

function report(ready: boolean, error?: string): void {
  socket.send(JSON.stringify({ type: "renderer-status", ready, error }));
  statusElement.textContent = error ? `error: ${error}` : ready ? "ready" : "starting";
}

function applyViseme(key: string, value: number): void {
  visemes.set(key, value);
  const target = talkingHead?.mtAvatar[key];
  if (target) {
    Object.assign(target, { newvalue: value, needsUpdate: true });
  }
  const open = Math.min(
    1,
    (visemes.get("viseme_aa") ?? 0) +
      (visemes.get("viseme_E") ?? 0) * 0.75 +
      (visemes.get("viseme_O") ?? 0) * 0.9 +
      (visemes.get("viseme_U") ?? 0) * 0.65,
  );
  const wide = Math.min(1, (visemes.get("viseme_E") ?? 0) + (visemes.get("viseme_SS") ?? 0));
  mouthElement.style.height = `${3 + open * 23}%`;
  mouthElement.style.width = `${25 + wide * 12 - open * 4}%`;
}

function clearAudio(): void {
  for (const source of activeSources) {
    try {
      source.stop();
    } catch {
      // Already ended.
    }
  }
  activeSources.clear();
  nextAudioTime = audioContext.currentTime;
  headAudio?.resetAll();
  for (const key of visemes.keys()) {
    applyViseme(key, 0);
  }
}

function schedulePcm(data: ArrayBuffer, sampleRateHz: number): void {
  const bytes = new Uint8Array(data);
  const sampleCount = Math.floor(bytes.byteLength / 2);
  if (sampleCount === 0) {
    return;
  }
  const view = new DataView(data);
  const buffer = audioContext.createBuffer(1, sampleCount, sampleRateHz);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < sampleCount; index += 1) {
    channel[index] = view.getInt16(index * 2, true) / 32_768;
  }
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(analysisGain);
  const startAt = Math.max(audioContext.currentTime + 0.035, nextAudioTime);
  nextAudioTime = startAt + buffer.duration;
  activeSources.add(source);
  source.onended = () => activeSources.delete(source);
  source.start(startAt);
  statusElement.textContent = "ready · streaming";
}

async function initialize(modelUrl?: string): Promise<void> {
  await audioContext.audioWorklet.addModule("/headworklet.mjs");
  headAudio = new HeadAudio(audioContext, {
    parameterData: { vadGateActiveDb: -40, vadGateInactiveDb: -55, silMode: 0 },
  });
  await headAudio.loadModel("/model-en-mixed.bin");
  analysisGain.connect(headAudio);
  headAudio.onvalue = applyViseme;
  if (modelUrl) {
    talkingHead = new TalkingHead(avatarElement, {
      audioCtx: audioContext,
      cameraView: "head",
      lipsyncModules: [],
      modelFPS: 30,
      modelPixelRatio: 1,
    });
    await talkingHead.showAvatar({
      url: modelUrl,
      body: "F",
      avatarMood: "neutral",
      avatarIdleEyeContact: 0.8,
    });
    presetElement.style.display = "none";
  }
  if (audioContext.state !== "running") {
    resumeButton.style.display = "block";
  }
  report(true);
}

resumeButton.addEventListener("click", () => {
  void audioContext.resume().then(() => {
    resumeButton.style.display = "none";
  });
});

socket.addEventListener("message", (event) => {
  if (event.data instanceof ArrayBuffer) {
    schedulePcm(event.data, 24_000);
    return;
  }
  try {
    const message = JSON.parse(String(event.data)) as {
      type?: string;
      sampleRateHz?: number;
      modelUrl?: string;
    };
    if (message.type === "hello") {
      void audioContext
        .resume()
        .then(() => initialize(message.modelUrl))
        .catch((error) => report(false, error instanceof Error ? error.message : String(error)));
    } else if (message.type === "clear" || message.type === "call-end") {
      clearAudio();
    }
  } catch {
    report(false, "invalid renderer control message");
  }
});
socket.addEventListener("close", () => {
  clearAudio();
  statusElement.textContent = "disconnected";
});
socket.addEventListener("error", () => {
  statusElement.textContent = "connection error";
});

function animate(now: number): void {
  const delta = Math.min(100, now - lastFrame);
  lastFrame = now;
  headAudio?.update(delta);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
