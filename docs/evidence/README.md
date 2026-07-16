# Automated Avatar Evidence

## 2026-07-16 renderer smoke

- Host: Apple Silicon macOS reference development machine.
- Input: `npm run avatar:preview`, which streams generated PCM16 24 kHz mono samples.
- Browser: a clean headless Chrome process against the loopback-only renderer URL.
- Observed state: HeadAudio worklet and model initialized; the page reported
  `ready · streaming` at 1280×720.
- Capture: [`avatar-preset.png`](./avatar-preset.png).

## 2026-07-16 OBS browser-source smoke

- OBS Studio 32.1.2 connected through authenticated obs-websocket on loopback.
- The controller selected its dedicated `OpenClaw FaceTime Avatar` scene and attached the
  `OpenClaw Avatar Renderer` browser source at 1280×720.
- After a clean OBS restart, the renderer health endpoint reported one connected, ready client and
  increasing sent-byte counters.
- OBS `GetSourceScreenshot` captured [`obs-browser-source.png`](./obs-browser-source.png) while the
  page reported `ready · streaming`.

This proves the bundled procedural renderer and local audio-analysis path load without CUDA. It does
prove the OBS browser-source path. It does not prove OBS Virtual Camera or FaceTime video routing;
macOS still reports the OBS Camera Extension as `activated waiting for user`. Those remain live-Mac
gates in `PLAN.md`.
