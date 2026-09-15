import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);

// src/avatar/preview.ts
import { createAvatarRenderer } from "openclaw-avatar-plugin/renderer";
var renderer = createAvatarRenderer({ port: 18794 });
await renderer.start();
renderer.consumer.start({
  sessionId: "facetime-preview",
  video: { width: 1280, height: 720, frameRate: 30 },
  initialState: "speaking"
});
console.log(renderer.rendererUrl);
var sampleOffset = 0;
var demoTimer = process.argv.includes("--demo") ? setInterval(() => {
  const samples = 480;
  const audio = Buffer.alloc(samples * 2);
  for (let index = 0; index < samples; index += 1) {
    const time = (sampleOffset + index) / 24e3;
    const envelope = 0.2 + 0.8 * Math.abs(Math.sin(2 * Math.PI * 2.5 * time));
    const value = Math.sin(2 * Math.PI * 120 * time) * 0.45 + Math.sin(2 * Math.PI * 240 * time) * 0.2 + Math.sin(2 * Math.PI * 720 * time) * 0.08;
    const sample = Math.round(Math.max(-1, Math.min(1, value * envelope)) * 24e3);
    audio.writeInt16LE(sample, index * 2);
  }
  renderer.consumer.audio(audio, sampleOffset / 24);
  sampleOffset += samples;
}, 20) : void 0;
demoTimer?.unref?.();
var shutdown = async () => {
  if (demoTimer) clearInterval(demoTimer);
  await renderer.stop();
  process.exit(0);
};
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
