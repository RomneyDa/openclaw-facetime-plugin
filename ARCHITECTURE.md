# Architecture

## Reference shape

This plugin follows the shape established by Dallin's recent Linq channel work:

- Linq PR #5: explicit provider contracts, target grammar, focused modules and tests.
- Linq PR #7: setup owns intentional mutations while runtime/status remain bounded.
- Linq PR #10: channel runtime SDK alignment, setup/runtime split, canonical sessions, and lifecycle
  cleanup.
- Linq PR #12: truthful onboarding, schema parity, package/load verification, and concrete readiness
  output.
- Linq issue #11 Phase 7: realtime provider integration, one-call concurrency, deterministic busy
  behavior, barge-in, restart cleanup, diagnostics, privacy, and live proof.

Issue #11 correctly distinguishes Linq's unreleased provider-hosted FaceTime API from the local
FaceTime/ScreenCaptureKit/BlackHole bridge. This repository implements only the local Mac bridge.
It does not call undocumented Linq endpoints and is not a production transport for the Linq plugin.

## Module boundary

```text
index.ts / setup-entry.ts
  -> channel-base.ts       static channel/config/setup contract
  -> channel.ts            OpenClaw lifecycle, status, outbound adapter
  -> facetime/accounts.ts  recursive account resolution
  -> facetime/call-manager.ts
       one-call state machine and caller policy
       -> facetime/native-bridge.ts
            bounded framed stdio
            -> Swift helper
                 Accessibility call control
                 ScreenCaptureKit FaceTime audio capture
                 AVAudioEngine/CoreAudio BlackHole output
       -> facetime/realtime.ts
            registered OpenClaw realtime provider
            createRealtimeVoiceBridgeSession
            openclaw_agent_consult
            -> facetime/output-pacer.ts
                 bounded configurable BlackHole delay
                 atomic native/avatar clear
                 -> avatar/runtime.ts
                      loopback authenticated PCM server
                      HeadAudio + TalkingHead browser bundle
                      optional authenticated OBS scene/virtual camera
```

The Swift process never receives OpenAI credentials. The TypeScript plugin never imports private
FaceTime frameworks. That separation keeps macOS entitlements/UI automation local and lets OpenClaw
own provider auth, models, tool execution, and agent sessions.

## IPC

Both directions use a five-byte header followed by payload:

```text
byte 0      kind: 1 JSON control/event, 2 PCM16 audio
bytes 1..4  unsigned big-endian payload length
bytes 5..N  payload
```

JSON and audio payloads are independently capped at 256 KiB. TypeScript caps queued provider output
at 2 MiB and drops audio when the virtual-device sink remains backpressured. Control frames are never
silently dropped.

## Audio contract

- Input and output: signed PCM16 little-endian, 24,000 Hz, mono.
- ScreenCaptureKit is configured for FaceTime app-window audio and excludes the helper's own audio.
- OpenClaw's realtime provider must advertise PCM16 24 kHz support.
- Output is scheduled through AVAudioEngine whose HAL output device is `BlackHole 2ch`.
- Provider barge-in invokes `clear-audio`, which resets the AVAudioPlayerNode queue.
- When the avatar is enabled, a bounded A/V pacer sends PCM to the renderer immediately and delays
  BlackHole by `audioDelayMs` (80 ms by default). Clearing the pacer cancels delayed chunks and clears
  both sinks atomically.

## Avatar contract

- The renderer binds only `127.0.0.1` and authenticates WebSocket upgrades with a random token.
- Per-client buffered output defaults to 1 MiB; disconnected or slow renderers increment drop
  counters rather than applying backpressure to the call.
- HeadAudio performs local audio-driven viseme inference. The built-in procedural preset requires no
  likeness asset; an optional CORS-enabled TalkingHead GLB may drive Oculus viseme blend shapes.
- Browser audio terminates at HeadAudio's zero-output AudioWorklet and is never connected to the
  physical output device.
- OBS credentials are read from an environment variable. Control is restricted to loopback, creates
  a dedicated scene/browser source, and verifies that Virtual Camera actually became active.
- Renderer/OBS failures are reported as degraded status and do not terminate the audio call.

## Lifecycle invariants

1. One `FaceTimeCallManager` owns one configured account identity.
2. At most one active call exists per manager.
3. Unknown inbound callers fail closed unless `inboundPolicy=open`.
4. A concurrent inbound call receives `decline(reason=busy)` and never starts provider/agent work.
5. Realtime starts only after native FaceTime state is `connected`.
6. Any native/realtime fatal error hangs up and releases local call state.
7. Gateway abort hangs up, closes realtime, stops ScreenCaptureKit/BlackHole, and terminates the helper.
8. No raw audio is persisted by this plugin.
9. Virtual Camera starts only for a connected call and stops with that call.
