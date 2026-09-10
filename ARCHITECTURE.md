# Architecture

## Ownership

FaceTime owns the call and the one realtime conversation: caller policy, ScreenCaptureKit input,
the registered OpenClaw realtime provider, agent consults, sequencing/interruption, exact provider
PCM, the A/V pacer, BlackHole output, OBS/Virtual Camera control, and call cleanup.

`openclaw-avatar-plugin/renderer` owns only the Canvas2D lobster, canonical media/control events,
authenticated loopback host, bounded renderer queues, generation fencing, PCM/viseme mouth motion,
readiness, health, and metrics. It has no provider, microphone, OpenClaw runtime, FaceTime,
BlackHole, or OBS knowledge.

```text
FaceTime caller audio
  -> ScreenCaptureKit
  -> one FaceTime-owned OpenClaw realtime provider session

exact provider PCM
  -> FaceTimeOutputPacer (sample clock and synchronization owner)
       -> avatar consumer with sample-derived PTS
       -> bounded delayed BlackHole playback

authenticated renderer URL
  -> FaceTime-owned OBS Browser Source
  -> OBS Virtual Camera
  -> FaceTime video
```

There is no plugin registry, global singleton, Talk observer, or second provider/session path.

## IPC and media

The native helper uses a five-byte framed-stdio header: one kind byte followed by a four-byte
big-endian payload length. JSON and PCM payloads are independently capped at 256 KiB. Input and
output are signed PCM16LE, 24 kHz, mono.

`FaceTimeOutputPacer` derives renderer presentation time solely from emitted samples (`samples /
24` milliseconds). It hands the same bytes to the avatar immediately, bounds and delays the
BlackHole copy, and resets the sample clock on clear. Barge-in, cancellation, replacement, hangup,
and error synchronously cancel delayed timers, clear native playback, and advance the avatar
generation before later media can be accepted.

## Failure behavior

Renderer queue overflow, disconnect, startup failure, and OBS/Virtual Camera failure are recorded
in FaceTime status and degrade video to audio-only. They never close an otherwise healthy realtime
or native call. Native or realtime fatal failures still end the call.

## Lifecycle invariants

1. A call starts at most one realtime provider session and one avatar consumer session.
2. Realtime starts only after native FaceTime reports `connected`.
3. A concurrent call is rejected before provider or avatar work.
4. Call replacement and clear generation-fence all older avatar media.
5. Hangup closes realtime, clears delayed/native/avatar audio, ends the avatar session, and stops
   Virtual Camera.
6. Gateway shutdown additionally stops the renderer host, OBS connection, native helper, sockets,
   and timers.
7. No raw audio, credentials, transcripts, or renderer tokens are persisted.

## OpenClaw SDK status

Validated against `openclaw@2026.9.3` / current main. Ordinary imports use current narrow public
subpaths. The realtime module is still present at runtime, but current source labels it a
production-private seam for bundled and separately published official plugins, and the npm package
omits its declarations. `realtime-sdk.ts` isolates the exact runtime shape needed here so tests can
exercise current behavior; external publication remains blocked until OpenClaw gives this plugin an
official supported-package contract or promotes an equivalent public seam.
