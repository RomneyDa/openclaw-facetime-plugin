# openclaw-facetime-plugin

A macOS-only FaceTime Audio channel for [OpenClaw](https://github.com/openclaw/openclaw).
The signed-in Mac is the call endpoint and audio bridge:

```text
caller
  -> FaceTime.app
  -> ScreenCaptureKit (PCM16, 24 kHz, mono)
  -> OpenClaw realtime voice provider (OpenAI by default)
  -> BlackHole 2ch virtual microphone
  -> FaceTime.app
  -> caller
```

The plugin uses OpenClaw's registered realtime voice provider rather than maintaining a private
OpenAI client. That keeps model/auth selection, VAD, interruption, tool calls, and provider updates
inside OpenClaw's public realtime contract. The `openclaw_agent_consult` tool gives the live voice
model access to the configured OpenClaw agent when a caller asks for tool-backed work.

## Status

This is an early local-Mac implementation. The TypeScript state machine, native framed transport,
Swift build, and read-only host preflight are automated. A release claim still requires a live
FaceTime call on the target account because Apple does not expose a supported public FaceTime call
control API; answer/dial/hangup use macOS Accessibility against FaceTime's UI.

## Requirements

- macOS 13 or newer
- FaceTime.app signed in to the identity dedicated to the agent
- OpenClaw `>=2026.7.2-beta.1`
- Apple Silicon Mac (`arm64`); Intel is not claimed or packaged in the first release
- Xcode Command Line Tools (`xcode-select --install`) only when building the Swift helper from source
- [BlackHole 2ch](https://github.com/ExistentialAudio/BlackHole) as a required **system peer dependency**
- Screen & System Audio Recording permission for the process that hosts OpenClaw
- Accessibility permission for that same host process
- A configured OpenClaw realtime voice provider; the default is OpenAI and accepts
  `OPENAI_API_KEY`

Install BlackHole and reboot before continuing:

```bash
brew install blackhole-2ch
```

## Install

Install the public GitHub repository after completing the system requirements above:

```bash
openclaw plugins install git:github.com/RomneyDa/openclaw-facetime-plugin@main
```

For local development, clone and link the checkout:

```bash
git clone https://github.com/RomneyDa/openclaw-facetime-plugin.git
cd openclaw-facetime-plugin
npm install
npm run build
openclaw plugins install --link "$PWD"
```

Then run the channel wizard:

```bash
openclaw configure --section channels
```

Select **FaceTime Audio (macOS)**. The wizard records the signed-in identity, caller policy,
allowlist, auto-answer behavior, realtime provider, and consult agent.

## macOS permissions and FaceTime audio

Grant the permissions to the executable that actually launches the Gateway. During development
that is commonly Terminal, iTerm, Ghostty, or cmux; for a service install it may be the OpenClaw
host binary. macOS may require restarting that process after permission changes.

In FaceTime, select **BlackHole 2ch** as the microphone. The helper also attempts this through the
FaceTime **Video** menu when a call connects, but the explicit setting is the reliable fallback.
Keep the normal Mac speakers as FaceTime's output: ScreenCaptureKit captures FaceTime's app audio
without changing the system output device.

Run a read-only preflight through the native helper:

```bash
native/bin/openclaw-facetime-bridge \
  --diagnose --device "BlackHole 2ch"
```

The same checks are available to the agent through `facetime_call` with `action: "preflight"`.
Preflight verifies the app, audio device, and permissions. It cannot prove that FaceTime is signed
in; the live smoke test below proves that boundary.

## Configuration

```json
{
  "channels": {
    "facetime": {
      "enabled": true,
      "identity": "agent@example.com",
      "inboundPolicy": "allowlist",
      "allowFrom": ["owner@example.com", "+14155550123"],
      "autoAnswer": true,
      "blackHoleDevice": "BlackHole 2ch",
      "maxCallDurationMs": 3600000,
      "realtime": {
        "provider": "openai",
        "agentId": "main",
        "toolPolicy": "read-only",
        "greeting": "Hello! How can I help?"
      }
    }
  }
}
```

`realtime.model` and `realtime.voice` are optional last-mile overrides. When omitted, the selected
OpenClaw realtime provider owns its current defaults. Provider-specific configuration can be placed
under `realtime.providers.<provider>`; for OpenAI, prefer the host's configured auth profile or
`OPENAI_API_KEY` over plaintext configuration.

### Inbound policy

- `allowlist` (default): unknown callers are declined before agent/model work starts.
- `open`: any detected caller may be answered. Use only on a dedicated identity.
- `disabled`: all inbound calls are declined; outbound calls remain available.

Only one call may use an account identity at a time. A second inbound call is declined as busy, and
a second outbound call fails without disturbing the active call.

### Multiple FaceTime identities

Named accounts follow the same recursive channel shape as other OpenClaw channels:

```json
{
  "channels": {
    "facetime": {
      "enabled": true,
      "accounts": {
        "personal": {
          "identity": "agent-one@example.com",
          "allowFrom": ["owner@example.com"]
        },
        "support": {
          "identity": "+14155550123",
          "allowFrom": ["+14155550199"],
          "realtime": { "agentId": "support" }
        }
      },
      "defaultAccount": "personal"
    }
  }
}
```

Each configured account requires a distinct signed-in Mac/FaceTime process in practice. A single
FaceTime.app instance cannot simultaneously host multiple identities, so do not start multiple
accounts on one Mac unless the OS processes are genuinely isolated.

## Agent actions

The plugin registers `facetime_call`:

- `call`: place a FaceTime Audio call; requires `target`, with optional first `message`
- `answer`: answer the ringing call when `autoAnswer` is false
- `decline`: decline the ringing call
- `hangup`: end the active call
- `speak`: speak an exact message into the connected call
- `status`: return active and recent call state
- `preflight`: run bounded, read-only native checks

Normal OpenClaw channel sends also accept `facetime:<phone-or-email>` targets. Sending to an idle
identity starts a call and speaks the text after the realtime bridge connects; sending to the active
peer speaks into the existing call.

## Live smoke test

1. Build the native helper and ensure preflight is green.
2. Sign in to FaceTime with the configured agent identity.
3. Select `BlackHole 2ch` as the FaceTime microphone.
4. Start the Gateway with `OPENAI_API_KEY` or another configured realtime provider.
5. Call the agent identity from an allowlisted phone/email.
6. Confirm the helper answers, the caller hears the greeting, and the agent hears the caller.
7. Complete three alternating turns, including one `openclaw_agent_consult` request.
8. Speak over the agent and verify provider output is cleared (barge-in).
9. Place a second call and verify deterministic busy rejection.
10. Hang up from both the caller and agent sides, restart the Gateway, and verify another call can
    connect without stale busy state.

Do not claim the installation production-ready until all ten checks pass on the target macOS and
FaceTime account.

## Privacy and security

- Raw audio is framed in memory and sent to the configured realtime provider; this plugin does not
  write raw audio to disk.
- Final transcript fragments remain in bounded memory for the call. Agent-consult requests may be
  persisted by OpenClaw's normal agent/session store.
- Caller identity is derived from FaceTime's Accessibility labels. With the default allowlist,
  missing or unrecognized identity fails closed.
- Native control frames and audio frames are size-bounded. Provider output is dropped under sustained
  BlackHole backpressure instead of growing memory without bound.
- Setup/status/preflight do not place calls, change provider state, or request permissions.

## Known limitations

- FaceTime has no supported public call-control API. UI labels or hierarchy can change with macOS and
  may require helper updates; non-English FaceTime UI is not yet validated.
- The helper controls FaceTime on the same logged-in desktop session. It cannot operate from a
  headless macOS login where FaceTime and Accessibility UI are unavailable.
- Caller identity quality depends on what FaceTime exposes to Accessibility. Test contacts, raw phone
  numbers, and Apple Account emails used by the intended allowlist.
- Video and group calls are intentionally out of scope.

## Development

```bash
npm run typecheck
npm test
npm run test:native
npm run build:native
npm pack --dry-run
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the channel/runtime boundary and design provenance.
