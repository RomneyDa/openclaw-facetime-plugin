import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FaceTimeAvatarServer } from "./server.js";

const distPath = path.dirname(fileURLToPath(import.meta.url));
const server = new FaceTimeAvatarServer({
  assetsPath: path.join(distPath, "avatar"),
  token: randomBytes(18).toString("base64url"),
  port: 18_794,
  maxBufferedBytes: 1_048_576,
});

await server.start();
console.log(server.rendererUrl);

let demoTimer: ReturnType<typeof setInterval> | undefined;
if (process.argv.includes("--demo")) {
  let sampleOffset = 0;
  demoTimer = setInterval(() => {
    const samples = 480;
    const audio = Buffer.alloc(samples * 2);
    for (let index = 0; index < samples; index += 1) {
      const time = (sampleOffset + index) / 24_000;
      const envelope = 0.2 + 0.8 * Math.abs(Math.sin(2 * Math.PI * 2.5 * time));
      const value =
        Math.sin(2 * Math.PI * 120 * time) * 0.45 +
        Math.sin(2 * Math.PI * 240 * time) * 0.2 +
        Math.sin(2 * Math.PI * 720 * time) * 0.08;
      const sample = Math.round(Math.max(-1, Math.min(1, value * envelope)) * 24_000);
      audio.writeInt16LE(sample, index * 2);
    }
    sampleOffset += samples;
    server.sendAudio(audio);
  }, 20);
  demoTimer.unref?.();
}

const shutdown = async () => {
  if (demoTimer) {
    clearInterval(demoTimer);
  }
  await server.stop();
  process.exit(0);
};
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
