# FaceTime Plugin Plan

Updated: 2026-07-16

## Goal

Turn the current compiled and unit-tested MVP into a proven FaceTime channel, then add an optional
live avatar video feed whose mouth motion is driven by the exact realtime-model audio sent to the
caller.

The release bar is observed behavior on a real FaceTime call. A green build or simulated lifecycle
test is necessary but is not proof that FaceTime UI automation, ScreenCaptureKit audio, BlackHole,
the realtime provider, and the remote caller all work together.

## Current Baseline

Published repository: <https://github.com/RomneyDa/openclaw-facetime-plugin>

Remote `main` at plan creation: `3ac8a0d1d7cc331dd15ea7747801f5ea2dc5500d`

Already implemented and tested:

- OpenClaw channel registration, recursive account config, setup wizard, status, outbound sends,
  and `facetime_call` actions.
- One-call state machine with allowlist/open/disabled policies, manual or automatic answer, and
  deterministic busy rejection in unit tests.
- Swift helper compilation in debug and release modes.
- Bounded framed Node-to-Swift control/audio protocol and native framing self-test.
- A process-level integration test that launches the release helper and exchanges configure,
  diagnostics, and shutdown frames.
- OpenClaw realtime voice provider wiring and `openclaw_agent_consult` wiring at typecheck/unit-test
  level.
- Local native preflight on one Mac: FaceTime installed, BlackHole present, Screen & System Audio
  Recording granted, and Accessibility granted.
- Six Vitest files / 15 tests, package inspection, source-linked OpenClaw load, and clean
  `openclaw plugins doctor`.

Not yet proven:

- A real inbound or outbound FaceTime call.
- FaceTime signed-in detection and actual Accessibility control labels on the target account.
- Real FaceTime audio arriving through ScreenCaptureKit in the requested PCM format.
- Realtime model audio reaching the remote caller through BlackHole.
- Live echo behavior, barge-in, agent consult, busy handling, hangup, crash recovery, or restart
  cleanup.
- Operation on the minimum supported macOS version, Intel Macs, other system languages, or a clean
  machine.

## Phase 1: Prove the Audio-Only First Pass

### 1. Test fixture and evidence capture

- [ ] Reserve a FaceTime identity used only by the agent and a user-approved caller/target.
- [ ] Record the target Mac model, architecture, macOS version, FaceTime version, OpenClaw version,
  BlackHole version, realtime provider/model, and helper SHA.
- [ ] Use non-sensitive test dialogue and obtain consent before capturing logs or screen recordings.
- [ ] Add a redacted live-test report template under `docs/live-tests/` with pass/fail, timestamps,
  measured latency, cleanup evidence, and exact commit SHA.
- [ ] Add opt-in structured debug counters for frames, bytes, queue depth, drops, state transitions,
  and timestamps; never log raw audio, credentials, or full transcripts.

### 2. Clean installation and setup testing

- [ ] Install from the public Git URL into a fresh OpenClaw state directory.
- [ ] Verify `postinstall` builds the native helper on Apple Silicon without relying on this checkout.
- [ ] Verify a clear failure and recovery path when Xcode Command Line Tools are missing.
- [ ] Verify a clear failure and recovery path when BlackHole is missing or the Mac has not rebooted.
- [ ] Verify permission-denied states for Screen & System Audio Recording and Accessibility, then
  grant each permission and confirm status changes without editing config.
- [ ] Verify FaceTime-signed-out behavior is detected or reported as an explicit unknown that the
  live smoke test must resolve.
- [ ] Run the wizard for a fresh default account, rerun it without changes, change the identity and
  policy, cancel midway, and confirm no unrelated config is modified.
- [ ] Exercise `allowlist`, `open`, and `disabled`; require an explicit warning before `open`.
- [ ] Verify invalid identities, empty allowlists, invalid helper paths, invalid duration values, and
  unknown config keys fail with actionable messages.
- [ ] Verify status/preflight are bounded and read-only: no call, app launch, permission prompt,
  device mutation, or provider connection.
- [ ] Verify package installation, source linking, `plugins list`, `plugins doctor`, and uninstall.

### 3. FaceTime call-control matrix

- [ ] Inbound allowlisted call with auto-answer.
- [ ] Inbound allowlisted call with manual `answer`.
- [ ] Inbound unknown caller under `allowlist` is declined before realtime/model work.
- [ ] Inbound caller under `disabled` is declined.
- [ ] Inbound caller under explicitly confirmed `open` is answered.
- [ ] Outbound call by Apple Account email.
- [ ] Outbound call by normalized phone number.
- [ ] Invalid or unavailable outbound target.
- [ ] Outbound connection timeout and cancellation.
- [ ] Local hangup, remote hangup, decline, missed call, and provider-triggered failure.
- [ ] A concurrent second inbound call is rejected as busy without disturbing the active call.
- [ ] A concurrent second outbound request fails fast without disturbing the active call.
- [ ] FaceTime not running, FaceTime launched on demand, FaceTime crash, and FaceTime relaunch.
- [ ] Verify the actual Accessibility roles, identifiers, and labels; prefer stable identifiers over
  English text. Test at least one non-English macOS account before claiming localization support.
- [ ] Confirm caller identity extracted from Accessibility is stable for saved contacts, raw phone
  numbers, and Apple Account emails. Unknown identity must fail closed under `allowlist`.

### 4. End-to-end audio matrix

- [ ] Assert the first ScreenCaptureKit audio sample description at runtime: PCM source conversion,
  24,000 Hz output, mono, signed 16-bit little-endian, monotonically increasing timestamps.
- [ ] Caller speech reaches the configured realtime provider.
- [ ] Realtime provider speech reaches BlackHole and is audible to the remote caller.
- [ ] Complete at least three alternating turns without reconnecting.
- [ ] Verify the caller does not hear their own audio looped back and the model does not transcribe
  its own output as new caller speech.
- [ ] Verify silence, short utterances, long utterances, rapid turn-taking, low input level, and loud
  input without clipping.
- [ ] Verify assistant output cancellation on barge-in; queued BlackHole audio must clear promptly
  and stale audio must not resume.
- [ ] Verify output underrun, deliberate sink slowdown, the 2 MiB queue boundary, dropped-audio
  counters, and recovery after backpressure.
- [ ] Change the default system output during a call and confirm FaceTime capture continues.
- [ ] Remove or rename the BlackHole device during startup and while active; fail safely and release
  call state.
- [ ] Run a 60-minute soak call and record CPU, memory, queue depth, audio drops, and provider errors.
- [ ] Measure caller-finished-speaking to first-audible-response latency and publish median/p95 for
  the tested provider/model rather than asserting an unmeasured target.

### 5. Realtime provider and agent-consult matrix

- [ ] Missing, malformed, and rejected OpenAI Platform API key.
- [ ] Default registered provider resolution and explicit provider/model/voice overrides.
- [ ] Provider connection timeout, WebSocket close, malformed provider event, rate limit, and maximum
  session duration.
- [ ] Greeting plays once and only after both the FaceTime call and realtime bridge are ready.
- [ ] `openclaw_agent_consult` succeeds with a short read-only lookup and speaks the result.
- [ ] Consult timeout, tool error, agent error, and caller hangup during consult.
- [ ] `toolPolicy=none`, `read-only`, and `owner`; verify the resulting OpenClaw tool allowlist.
- [ ] Verify per-caller consult session continuity without crossing accounts or callers.
- [ ] Verify model-selection locks and approval policy fail closed rather than silently switching
  model or authority.
- [ ] Confirm provider errors, tool arguments/results, auth headers, and secrets are redacted.

### 6. Shutdown, crash, and stale-state recovery

- [ ] Gateway shutdown during ringing, connecting, active audio, assistant output, and consult.
- [ ] Native helper `SIGTERM`, forced `SIGKILL`, malformed frame, oversized frame, truncated frame,
  stdout close, stdin close, and nonzero exit.
- [ ] ScreenCaptureKit stream stop/error and permission revocation while active.
- [ ] BlackHole playback engine failure and output device disappearance.
- [ ] Realtime provider disconnect and network loss.
- [ ] FaceTime remote hangup while queued provider audio remains.
- [ ] Restart OpenClaw after each failure and prove the identity is not stuck busy.
- [ ] Repeated stop/shutdown calls are idempotent and do not target a later call.
- [ ] No helper process, audio engine, capture stream, timer, or virtual device writer remains after
  cleanup.

### 7. Compatibility, security, and release gates

- [ ] Run on the minimum declared macOS version and the current macOS release.
- [ ] Run on Apple Silicon. Either run on Intel or explicitly remove/qualify Intel support.
- [ ] Test a normal desktop login and document that headless login is unsupported.
- [ ] Fuzz the frame decoder and native JSON command decoder with bounded generated inputs.
- [ ] Verify symlink/helper-path handling cannot execute an unexpected writable binary without an
  explicit advanced override and warning.
- [ ] Verify no raw audio file is created and inspect logs/state/package for credentials or raw
  transcripts.
- [ ] Audit phone/email logging and add a privacy-preserving identifier or redaction mode.
- [ ] Run `npm audit`, `npm run check`, `git diff --check`, `npm pack --dry-run`, source-linked load,
  archive install, and `plugins doctor` on the final SHA.
- [ ] Add macOS CI for TypeScript tests, Swift debug/release compilation, native self-test, package
  inspection, and helper IPC. Keep real FaceTime/TCC tests on a labeled physical-Mac runner.

### Audio-only exit criteria

- [ ] Inbound and outbound calls complete three alternating turns on a documented final SHA.
- [ ] Agent consult, live barge-in, local/remote hangup, busy rejection, restart, and cleanup pass.
- [ ] Missing dependencies/permissions/auth fail with one actionable correction and no stale call.
- [ ] Account isolation and caller policy are proven on real calls.
- [ ] No credential or raw-audio leakage is found.
- [ ] The final live-test report and all automated gates are linked from the release notes.

## Phase 2: Add an Audio-Driven Video Avatar

### Research decision

Use a renderer interface, but make the first backend
[TalkingHead](https://github.com/met4citizen/TalkingHead) plus
[HeadAudio](https://github.com/met4citizen/HeadAudio):

- Both projects are MIT licensed.
- TalkingHead renders rigged GLB avatars with Three.js/WebGL and supports real-time chunked PCM
  streaming.
- HeadAudio consumes arbitrary audio in a browser AudioWorklet and produces Oculus viseme blend
  shapes in real time without transcripts or a server. Its documented processing latency is roughly
  50–100 ms and its maintainers explicitly call out the speed/accuracy tradeoff.
- This path runs locally in a desktop browser on macOS and permits preset avatars, which satisfies
  the initial requirement without pretending a CUDA model is a Mac-native dependency.

Deliver the renderer to FaceTime through [OBS Studio](https://github.com/obsproject/obs-studio)'s
virtual camera. OBS is GPL-2.0-or-later and open source. Its WebSocket control API is included in OBS
[28+](https://github.com/obsproject/obs-websocket#downloads), and its
[protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
supports starting/stopping the virtual camera. Treat OBS as an optional system peer dependency,
bind its WebSocket to localhost, and require authentication.

Photorealistic single-photo rendering remains an optional GPU backend behind the same interface:

| Candidate | Strength | Constraint / disposition |
| --- | --- | --- |
| [MuseTalk 1.5](https://github.com/TMElyralab/MuseTalk) | MIT code; repository permits commercial model use; unseen-face audio lip-sync; documented 30+ fps on Tesla V100 | CUDA 11.x/Linux-or-Windows oriented; use only as a remote NVIDIA sidecar after latency and transitive-license audit |
| [Ditto](https://github.com/antgroup/ditto-talkinghead) | Apache-2.0 code; single source image; online config; whole-head motion rather than mouth-only patch | Reference environment is CentOS/A100/TensorRT; benchmark against MuseTalk and audit checkpoint/face-detector licenses before enabling |
| [AVTR-1](https://github.com/avaturn-live/avtr-1) | Portrait plus speaking/listening audio at 25 fps; strong conversational behavior | Renderer/streamer are noncommercial and InsightFace models add restrictions; do not use as the default |
| [LivePortrait](https://github.com/KlingAIResearch/LivePortrait) | MIT portrait animation and Apple Silicon MPS path | Driven by video/motion rather than audio, and its README warns Apple Silicon may be about 20× slower than RTX 4090; not the lip-sync backend |
| [Wav2Lip](https://github.com/Rudrabha/Wav2Lip) | Established lip-sync baseline | Open-source release is explicitly noncommercial and batch-oriented; reject for this plugin |

### 1. Define the video contract

- [ ] Add an `AvatarRenderer` interface with lifecycle methods for prepare, start, PCM audio,
  interrupt/clear, listening/speaking state, health, and stop.
- [ ] Define renderer output as a live 30 fps canvas/stream at a configurable default such as
  960×540 or 1280×720; do not couple call state to a particular model.
- [ ] Add config under `channels.facetime.video`: `enabled`, `renderer`, `avatarPath`, dimensions,
  frame rate, background, audioDelayMs, OBS URL/password SecretRef, scene/source names, and optional
  remote-renderer endpoint.
- [ ] Validate avatar paths and remote URLs, keep schemas recursively identical, and expose capability
  readiness in status without starting OBS or a model.
- [ ] Preserve audio-only operation whenever video is disabled or unhealthy.

### 2. Build the local TalkingHead renderer

- [ ] Pin reviewed TalkingHead and HeadAudio versions; record licenses and hashes.
- [ ] Ship or document at least one redistributable GLB preset with Mixamo-compatible rig plus ARKit
  and Oculus viseme blend shapes. Do not redistribute an avatar without explicit asset rights.
- [ ] Serve a loopback-only renderer page with strict CSP and no cloud dependencies.
- [ ] Feed the same provider PCM16 24 kHz chunks sent to BlackHole into a bounded renderer WebSocket
  or local IPC stream; never re-encode through a microphone loop.
- [ ] Resample only if the selected HeadAudio model requires it and keep source timestamps.
- [ ] Drive idle, listening, thinking, speaking, interruption, and error expressions from call/talk
  events; mouth movement must stop immediately on barge-in or provider clear.
- [ ] Ensure renderer audio is muted or disconnected from the physical output so only BlackHole feeds
  FaceTime and no echo path is introduced.

### 3. Keep audio and video synchronized

- [ ] Introduce one timestamped A/V pacer shared by BlackHole output and the avatar renderer.
- [ ] Account for HeadAudio's documented processing window and browser/OBS capture latency; delay
  BlackHole output by a configurable bounded amount rather than letting video visibly trail audio.
- [ ] Clear both BlackHole and avatar queues atomically on barge-in, hangup, provider cancellation,
  and call replacement.
- [ ] Expose queue depth, underruns, dropped frames, render fps, and measured skew without retaining
  media.
- [ ] Establish a measured acceptance target after the spike; initial goal: median absolute mouth/audio
  skew no greater than 100 ms and p95 no greater than 150 ms on the reference Mac.

### 4. Bridge the renderer into FaceTime

- [ ] Detect OBS Studio and OBS Virtual Camera without mutating state during status/preflight.
- [ ] Create or select a dedicated OBS scene and browser source through authenticated localhost
  obs-websocket; never reuse or overwrite an unrelated operator scene silently.
- [ ] Start/stop Virtual Camera with the call lifecycle and reconcile OBS state after crashes/restarts.
- [ ] Extend FaceTime Accessibility automation to select OBS Virtual Camera, enable/disable camera,
  and distinguish audio from video calls using stable identifiers where available.
- [ ] Add `callMode: "audio" | "video"` and preserve the current `facetime-audio://` path for audio.
- [ ] Define inbound video acceptance and audio-to-video upgrade behavior explicitly; never enable a
  camera unexpectedly on an audio-only call.
- [ ] If OBS or video routing fails, continue audio only when policy permits and report the exact
  degraded state to the operator and caller.

### 5. Optional photorealistic renderer spike

- [ ] Build a protocol-compatible remote Linux/NVIDIA sidecar proof for MuseTalk 1.5 and Ditto.
- [ ] Use the same consented mid-resolution portrait and identical audio clips for comparison.
- [ ] Measure warm-up, first-frame latency, steady fps, A/V skew, VRAM, bandwidth, identity stability,
  artifacts during silence/barge-in, and recovery after network loss.
- [ ] Audit code, weights, face detector, training/test assets, and transitive model licenses. A
  permissive repository license alone is insufficient.
- [ ] Select a backend only if it sustains the call's frame rate and latency budget. Otherwise retain
  TalkingHead as the supported backend and label photo rendering experimental.
- [ ] Never upload a portrait or derived face embedding without explicit config and consent; document
  retention/deletion behavior for local and remote renderers.

### 6. Video test matrix

- [ ] Renderer unit tests: config, bounded PCM queue, resampling, timestamps, state transitions, and
  atomic clear.
- [ ] Browser tests: preset loads, WebGL loss/recovery, audio worklet loads, visemes move during known
  phonemes, mouth returns to neutral during silence, and no audible local playback.
- [ ] Golden visual fixtures for neutral/listening/speaking expressions with perceptual thresholds
  tolerant of GPU raster differences.
- [ ] Automated A/V test: feed a pulse/phoneme fixture, capture rendered frames plus BlackHole timing,
  and calculate mouth/audio skew.
- [ ] OBS tests: missing app, unavailable virtual camera, bad password, occupied port, scene collision,
  start/stop, OBS crash, and stale virtual-camera state.
- [ ] FaceTime live test: remote caller sees the avatar at the configured resolution/frame rate and
  hears matching audio through three turns.
- [ ] Barge-in live test: mouth and audio stop together; stale frames/audio do not resume.
- [ ] Audio-only fallback during renderer, browser, OBS, and virtual-camera failures.
- [ ] 60-minute video soak with CPU/GPU/memory, fps, dropped frames, queue depth, and skew.
- [ ] Verify no portrait, rendered frame, face embedding, raw audio, or video recording is retained
  unless the operator explicitly enabled diagnostics and consented.

### Video exit criteria

- [ ] A preset avatar works locally on the reference Mac without CUDA.
- [ ] FaceTime receives a stable live virtual-camera feed while caller audio and model audio remain
  duplex and echo-free.
- [ ] Three turns, consult, barge-in, busy handling, remote/local hangup, renderer crash, OBS crash,
  restart, and audio-only fallback all pass on a documented final SHA.
- [ ] Measured A/V skew meets the published target, with no unbounded queues or stale playback.
- [ ] Every shipped code, model, and avatar asset has a recorded license and redistribution decision.

## Proposed Delivery Sequence

1. `live-audio-proof`: add observability and complete the real audio-only test matrix.
2. `audio-hardening`: fix findings from live calls, add crash/restart/soak coverage, and publish the
   first audio-only release.
3. `avatar-contract`: config, renderer interface, event/audio fanout, and deterministic tests.
4. `talkinghead-renderer`: local TalkingHead + HeadAudio preset avatar and A/V pacer.
5. `obs-virtual-camera`: authenticated OBS scene control and FaceTime video selection.
6. `video-live-proof`: real video call matrix, sync tuning, fallback, privacy, and soak.
7. `photo-renderer-spike`: MuseTalk-vs-Ditto remote GPU benchmark and license decision; experimental
   until it independently meets the video exit criteria.
