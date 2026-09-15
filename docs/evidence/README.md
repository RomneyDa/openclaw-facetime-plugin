# Evidence status

The prior screenshots exercised the removed copied HeadAudio/TalkingHead renderer and were deleted
with that stack. They are not evidence for the reusable lobster renderer integration.

Automated proof now lives in the package tests: the avatar repository owns real-browser visual and
readiness smoke, while this repository proves one realtime session, one avatar consumer, exact PCM,
sample-clock timing, atomic clear, generation fencing, authenticated OBS URL delivery, cleanup, and
audio-only degradation.

No new live FaceTime evidence is checked in yet. Complete `docs/live-tests/TEMPLATE.md` on the target
Mac before making FaceTime video, Virtual Camera, or calibrated A/V alignment claims.
