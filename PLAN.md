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

Automated avatar implementation baseline as of 2026-07-16: `9822b97`.

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
- Native and TypeScript failure-path tests, package inspection, clean archive/public-Git installs,
  source-linked OpenClaw load, and clean `openclaw plugins doctor`.
- A bundled loopback avatar renderer driven by HeadAudio, optional TalkingHead GLB support, a
  bounded A/V pacer, authenticated OBS control, and a real headless-Chrome renderer smoke test.

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
- [x] Add a redacted live-test report template under `docs/live-tests/` with pass/fail, timestamps,
  measured latency, cleanup evidence, and exact commit SHA.
- [x] Add structured runtime counters for frames, bytes, queue depth, drops, state transitions,
  and timestamps; never log raw audio, credentials, or full transcripts.

### 2. Clean installation and setup testing

- [x] Install from the public Git URL into a fresh OpenClaw state directory.
- [x] Verify the tracked Apple Silicon release helper and bundled runtime install without lifecycle
  scripts or reliance on this checkout.
- [ ] Verify a clear failure and recovery path when Xcode Command Line Tools are missing.
- [ ] Verify a clear failure and recovery path when BlackHole is missing or the Mac has not rebooted.
- [ ] Verify permission-denied states for Screen & System Audio Recording and Accessibility, then
  grant each permission and confirm status changes without editing config.
- [x] Verify FaceTime-signed-out behavior is detected or reported as an explicit unknown that the
  live smoke test must resolve.
- [x] Run the wizard for a fresh default account, rerun it without changes, change the identity and
  policy, cancel midway, and confirm no unrelated config is modified.
- [x] Exercise `allowlist`, `open`, and `disabled`; require an explicit confirmation before `open`.
- [x] Verify invalid identities, empty allowlists, invalid duration values, avatar/OBS values, and
  unknown config keys fail with actionable messages.
- [x] Verify status/preflight are bounded and read-only: no call, app launch, permission prompt,
  device mutation, or provider connection.
- [x] Verify package installation, source linking, `plugins list`, `plugins doctor`, and uninstall.

### 3. FaceTime call-control matrix

- [ ] Inbound allowlisted call with auto-answer.
- [ ] Inbound allowlisted call with manual `answer`.
- [ ] Inbound unknown caller under `allowlist` is declined before realtime/model work.
- [ ] Inbound caller under `disabled` is declined.
- [ ] Inbound caller under explicitly confirmed `open` is answered.
- [ ] Outbound call by Apple Account email.
- [ ] Outbound call by normalized phone number.
- [ ] Invalid or unavailable outbound target.
- [x] Outbound connection timeout and cancellation at the TypeScript/native boundary.
- [ ] Local hangup, remote hangup, decline, missed call, and provider-triggered failure.
- [x] A concurrent second inbound call is rejected as busy without disturbing the active call in
  state-machine tests.
- [x] A concurrent second outbound request fails fast without disturbing the active call in
  state-machine tests.
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
- [x] Verify deliberate sink slowdown, bounded output queues, dropped-audio
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
- [x] Provider connection timeout, duplicate start, late-session cleanup, malformed provider event,
  and maximum
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
- [x] Native helper never-ready, process exit, malformed frame, oversized frame, truncated frame,
  stdout close, stdin close, and nonzero exit.
- [ ] ScreenCaptureKit stream stop/error and permission revocation while active.
- [ ] BlackHole playback engine failure and output device disappearance.
- [ ] Realtime provider disconnect and network loss.
- [ ] FaceTime remote hangup while queued provider audio remains.
- [ ] Restart OpenClaw after each failure and prove the identity is not stuck busy.
- [x] Repeated stop/shutdown calls are idempotent and do not target a later call.
- [ ] No helper process, audio engine, capture stream, timer, or virtual device writer remains after
  cleanup.

### 7. Compatibility, security, and release gates

- [ ] Run on the minimum declared macOS version and the current macOS release.
- [x] Run on Apple Silicon and explicitly qualify Intel as unsupported/unpackaged.
- [ ] Test a normal desktop login and document that headless login is unsupported.
- [x] Exercise frame/native command decoders with 1,000 bounded deterministic generated inputs.
- [x] Remove the helper-path override entirely; the plugin executes only its packaged helper.
- [x] Verify no raw audio file is created and inspect logs/state/package for credentials or raw
  transcripts.
- [x] Audit phone/email logging and replace identities with short hashes in runtime logs/session keys.
- [x] Run `npm audit`, `npm run check`, `git diff --check`, `npm pack --dry-run`, source-linked load,
  archive install, and `plugins doctor` on the final SHA.
- [x] Add macOS CI for TypeScript tests, Swift debug/release compilation, native self-test, package
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

Use one concrete local runtime built from
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

Photorealistic single-photo rendering remains a possible later GPU sidecar, not a compatibility
surface in the first implementation:

| Candidate | Strength | Constraint / disposition |
| --- | --- | --- |
| [MuseTalk 1.5](https://github.com/TMElyralab/MuseTalk) | MIT code; repository permits commercial model use; unseen-face audio lip-sync; documented 30+ fps on Tesla V100 | CUDA 11.x/Linux-or-Windows oriented; use only as a remote NVIDIA sidecar after latency and transitive-license audit |
| [Ditto](https://github.com/antgroup/ditto-talkinghead) | Apache-2.0 code; single source image; online config; whole-head motion rather than mouth-only patch | Reference environment is CentOS/A100/TensorRT; benchmark against MuseTalk and audit checkpoint/face-detector licenses before enabling |
| [AVTR-1](https://github.com/avaturn-live/avtr-1) | Portrait plus speaking/listening audio at 25 fps; strong conversational behavior | Renderer/streamer are noncommercial and InsightFace models add restrictions; do not use as the default |
| [LivePortrait](https://github.com/KlingAIResearch/LivePortrait) | MIT portrait animation and Apple Silicon MPS path | Driven by video/motion rather than audio, and its README warns Apple Silicon may be about 20× slower than RTX 4090; not the lip-sync backend |
| [Wav2Lip](https://github.com/Rudrabha/Wav2Lip) | Established lip-sync baseline | Open-source release is explicitly noncommercial and batch-oriented; reject for this plugin |

### 1. Define the video contract

- [x] Add one concrete `FaceTimeAvatarRuntime` with start, PCM audio, interrupt/clear, health, and
  stop lifecycle behavior; do not add compatibility aliases or unused backend abstractions.
- [x] Define renderer output as a live 1280×720 canvas and make OBS dimensions configurable.
- [x] Add config under `channels.facetime.avatar`: enablement, optional GLB URL, audio delay, bounded
  buffering, renderer port, and authenticated OBS URL/password environment variable/scene/source.
- [x] Validate model/OBS URLs and dimensions, keep schemas recursively identical, and expose capability
  readiness in status without starting OBS or a model.
- [x] Preserve audio-only operation whenever video is disabled or unhealthy.

### 2. Build the local TalkingHead renderer

- [x] Pin reviewed TalkingHead 1.7.0 and HeadAudio 0.1.0 packages; both declare MIT licenses and are
  captured by `package-lock.json` integrity hashes.
- [x] Ship a procedural face preset with no third-party likeness, and document optional operator-owned
  TalkingHead-compatible GLB models instead of redistributing an avatar.
- [x] Serve a loopback-only renderer page with strict CSP and bundled runtime/model assets.
- [x] Feed the same provider PCM16 24 kHz chunks sent to BlackHole into a bounded renderer WebSocket
  or local IPC stream; never re-encode through a microphone loop.
- [x] Let the HeadAudio AudioWorklet perform its required model-rate conversion from the canonical
  24 kHz stream.
- [ ] Drive idle, listening, thinking, speaking, interruption, and error expressions from call/talk
  events; mouth movement must stop immediately on barge-in or provider clear.
- [x] Ensure renderer audio is muted or disconnected from the physical output so only BlackHole feeds
  FaceTime and no echo path is introduced.

### 3. Keep audio and video synchronized

- [x] Introduce one bounded A/V pacer shared by BlackHole output and the avatar renderer.
- [x] Account for HeadAudio's documented processing window and browser/OBS capture latency; delay
  BlackHole output by a configurable bounded amount rather than letting video visibly trail audio.
- [x] Clear both BlackHole and avatar queues atomically on barge-in, hangup, provider cancellation,
  and call replacement.
- [x] Expose client readiness plus sent/dropped byte counters without retaining media. Render FPS,
  underruns, and measured skew remain part of the live-video measurement work.
- [ ] Establish a measured acceptance target after the spike; initial goal: median absolute mouth/audio
  skew no greater than 100 ms and p95 no greater than 150 ms on the reference Mac.

### 4. Bridge the renderer into FaceTime

- [x] Keep OBS and Virtual Camera startup out of status/preflight.
- [x] Create or select a dedicated OBS scene and browser source through authenticated localhost
  obs-websocket; never reuse or overwrite an unrelated operator scene silently.
- [ ] Start/stop Virtual Camera with the call lifecycle and reconcile OBS state after crashes/restarts.
  Lifecycle code and mocked protocol tests pass; real start is blocked until macOS approves the OBS
  Camera Extension.
- [ ] Extend FaceTime Accessibility automation to select OBS Virtual Camera, enable/disable camera,
  and distinguish audio from video calls using stable identifiers where available.
- [ ] Add an explicit `callMode: "audio" | "video"`; no compatibility aliases or duplicate target
  grammars.
- [ ] Define inbound video acceptance and audio-to-video upgrade behavior explicitly; never enable a
  camera unexpectedly on an audio-only call.
- [x] If OBS or video routing fails, continue audio only and report the exact degraded state to the
  operator.

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

- [x] Renderer unit tests: config, authenticated loopback access, bounded PCM queue, missing clients,
  occupied port, A/V delay, drops, and atomic clear.
- [x] Browser smoke: the bundled preset, HeadAudio worklet/model, and synthetic PCM stream reached
  `ready · streaming` in headless Chrome and an OBS browser source at 1280×720 with no physical
  audio connection. Both captures are tracked under `docs/evidence/`.
- [ ] Browser recovery tests: WebGL loss/recovery, known-phoneme viseme assertions, and GPU-neutral
  silence fixtures.
- [ ] Golden visual fixtures for neutral/listening/speaking expressions with perceptual thresholds
  tolerant of GPU raster differences.
- [ ] Automated A/V test: feed a pulse/phoneme fixture, capture rendered frames plus BlackHole timing,
  and calculate mouth/audio skew.
- [ ] OBS tests: missing app, unavailable virtual camera, bad password, occupied port, scene collision,
  start/stop, OBS crash, and stale virtual-camera state.
  Automated coverage currently includes unavailable server, camera-extension rejection, dedicated
  scene/source creation, and verified start/stop protocol behavior.
- [ ] FaceTime live test: remote caller sees the avatar at the configured resolution/frame rate and
  hears matching audio through three turns.
- [ ] Barge-in live test: mouth and audio stop together; stale frames/audio do not resume.
- [x] Audio-only fallback during renderer, browser, OBS, and virtual-camera failures at the plugin
  lifecycle boundary.
- [ ] 60-minute video soak with CPU/GPU/memory, fps, dropped frames, queue depth, and skew.
- [ ] Verify no portrait, rendered frame, face embedding, raw audio, or video recording is retained
  unless the operator explicitly enabled diagnostics and consented.

### Video exit criteria

- [x] A preset avatar works locally on the reference Apple Silicon Mac without CUDA.
- [ ] FaceTime receives a stable live virtual-camera feed while caller audio and model audio remain
  duplex and echo-free.
- [ ] Three turns, consult, barge-in, busy handling, remote/local hangup, renderer crash, OBS crash,
  restart, and audio-only fallback all pass on a documented final SHA.
- [ ] Measured A/V skew meets the published target, with no unbounded queues or stale playback.
- [ ] Every shipped code, model, and avatar asset has a recorded license and redistribution decision.

## Automated Evidence — 2026-07-16

Implementation SHA: `9822b97`

- `npm run check:release`: passed.
- TypeScript: `tsc --noEmit` passed.
- Swift: debug and release builds plus the native framing/command self-test passed.
- Vitest: 12 files / 48 tests passed, including process-level helper IPC, lifecycle/failure paths,
  25-call synthetic state soak, deterministic generated frame input, bounded renderer/pacer queues,
  and mocked OBS protocol behavior.
- Package: secret scan, executable helper check, 14 production dependency licenses, clean archive
  install/load/doctor/uninstall with OpenClaw 2026.7.2-beta.1, and `npm pack --dry-run` passed.
- Dependency audit: zero production vulnerabilities after upgrading `ws` to 8.21.1.
- Public Git install from `git:github.com/RomneyDa/openclaw-facetime-plugin@main` passed on the
  pre-avatar release and is repeated after these commits are pushed.
- Renderer: headless Chrome and OBS Studio 32.1.2 both loaded the bundled 1280×720 renderer,
  initialized HeadAudio, connected to the authenticated loopback stream, and reported
  `ready · streaming`; captures are in `docs/evidence/`.
- OBS Virtual Camera: correctly rejected as inactive. `systemextensionsctl` reports
  `activated waiting for user`; macOS approval and the subsequent FaceTime camera-selection test
  remain open.

## Proposed Delivery Sequence

1. `live-audio-proof`: add observability and complete the real audio-only test matrix.
2. `audio-hardening`: fix findings from live calls, add crash/restart/soak coverage, and publish the
   first audio-only release.
3. `avatar-contract`: config, concrete runtime, event/audio fanout, and deterministic tests.
4. `talkinghead-renderer`: local TalkingHead + HeadAudio preset avatar and A/V pacer.
5. `obs-virtual-camera`: authenticated OBS scene control and FaceTime video selection.
6. `video-live-proof`: real video call matrix, sync tuning, fallback, privacy, and soak.
7. `photo-renderer-spike`: MuseTalk-vs-Ditto remote GPU benchmark and license decision; experimental
   until it independently meets the video exit criteria.
