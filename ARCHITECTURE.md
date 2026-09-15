# Architecture

## Ownership

FaceTime owns the call and the one realtime conversation: caller policy, ScreenCaptureKit input,
the registered OpenClaw realtime provider, agent consults, sequencing/interruption, exact provider
PCM, the A/V pacer, BlackHole output, OBS/Virtual Camera control, and call cleanup.

OpenClaw owns generic live-visual provider discovery. FaceTime resolves a provider by ID and knows
only its timed input, browser-source output, health, and close contract. The separately installed
lobster plugin owns its Canvas2D renderer, authenticated loopback host, bounded queues, generation
fencing, PCM/viseme mouth motion, readiness, health, and metrics. It has no FaceTime, BlackHole,
OBS, call-control, or realtime-provider knowledge.

```text
FaceTime caller audio
  -> ScreenCaptureKit
  -> one FaceTime-owned OpenClaw realtime provider session

exact provider PCM
  -> FaceTimeOutputPacer (sample clock and synchronization owner)
       -> generic live-visual session with sample-derived PTS
       -> bounded delayed BlackHole playback

provider browser-source URL
  -> FaceTime-owned OBS Browser Source
  -> OBS Virtual Camera
  -> FaceTime video
```

There is no plugin-to-plugin import, global singleton, Talk observer, or second realtime provider
session. OpenClaw's normal capability registry is the only discovery path.

## IPC and media

The native helper uses a five-byte framed-stdio header: one kind byte followed by a four-byte
big-endian payload length. JSON and PCM payloads are independently capped at 256 KiB. Input and
output are signed PCM16LE, 24 kHz, mono.

`FaceTimeOutputPacer` sends presentation time directly as 24 kHz sample units. It hands the same
bytes to the live-visual session immediately, bounds and delays the BlackHole copy, and resets the
sample clock on clear. Barge-in, cancellation, replacement, hangup, and error synchronously cancel
delayed timers, clear native playback, and flush the visual session before later media is accepted.

## Failure behavior

Provider queue overflow, disconnect, startup failure, and OBS/Virtual Camera failure are recorded
in FaceTime status and degrade video to audio-only. They never close an otherwise healthy realtime
or native call. Native or realtime fatal failures still end the call.

## Lifecycle invariants

1. A call starts at most one realtime provider session and one live-visual session.
2. Realtime starts only after native FaceTime reports `connected`.
3. A concurrent call is rejected before provider or avatar work.
4. Call replacement and clear flush all older visual media.
5. Hangup closes realtime, clears delayed/native/visual audio, closes the visual session, and stops
   Virtual Camera.
6. Gateway shutdown additionally closes the visual session, OBS connection, native helper, sockets,
   and timers. Provider-owned hosts follow provider lifecycle.
7. No raw audio, credentials, transcripts, or renderer tokens are persisted.

## OpenClaw SDK status

The live-visual capability requires OpenClaw 2026.9.4 or newer. Ordinary imports use narrow public
subpaths. The realtime module is still present at runtime, but current source labels it a
production-private seam for bundled and separately published official plugins, and the npm package
omits its declarations. `realtime-sdk.ts` isolates the exact runtime shape needed here so tests can
exercise current behavior; external publication remains blocked until OpenClaw gives this plugin an
official supported-package contract or promotes an equivalent public seam.
