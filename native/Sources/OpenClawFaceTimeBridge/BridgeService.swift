import Darwin
import Foundation

final class BridgeService {
    private let writer = FrameWriter()
    private let decoder = FrameDecoder()
    private lazy var automation: FaceTimeAutomation = {
        let value = FaceTimeAutomation(writer: writer)
        value.onConnected = { [weak self] callId in
            Task { await self?.startAudio(callId: callId) }
        }
        value.onEnded = { [weak self] callId in
            Task { await self?.stopAudio(callId: callId) }
        }
        return value
    }()
    private lazy var audio = DuplexAudioBridge(writer: writer)
    private let stateLock = NSLock()
    private var identity = ""
    private var blackHoleDevice = "BlackHole 2ch"
    private var audioCallId: String?
    private var shuttingDown = false

    func runStdio() {
        writer.writeJSON(["type": "ready", "pid": ProcessInfo.processInfo.processIdentifier])
        let input = FileHandle.standardInput
        do {
            while !isShuttingDown() {
                let data = input.availableData
                if data.isEmpty { break }
                for frame in try decoder.append(data) {
                    handle(frame)
                }
            }
        } catch {
            emitError(code: "stdio", message: error.localizedDescription, fatal: true)
        }
        if !isShuttingDown() {
            Task {
                await shutdown(exitProcess: true)
            }
        }
    }

    private func handle(_ frame: Frame) {
        switch frame.kind {
        case .audio:
            audio.enqueueOutput(frame.payload)
        case .json:
            do {
                try handleCommand(decodeJSONObject(frame.payload))
            } catch {
                emitError(code: "invalid-command", message: error.localizedDescription)
            }
        }
    }

    private func handleCommand(_ command: [String: Any]) throws {
        guard let type = command["type"] as? String else {
            throw FrameError.malformedJSON
        }
        switch type {
        case "configure":
            guard let identity = command["identity"] as? String,
                  !identity.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw FaceTimeAutomationError.invalidTarget
            }
            self.identity = identity
            blackHoleDevice = (command["blackHoleDevice"] as? String) ?? "BlackHole 2ch"
            automation.configure(blackHoleDevice: blackHoleDevice)
        case "dial":
            guard let callId = command["callId"] as? String,
                  let target = command["target"] as? String else {
                throw FrameError.malformedJSON
            }
            automation.dial(callId: callId, target: target)
        case "accept":
            guard let callId = command["callId"] as? String else { throw FrameError.malformedJSON }
            automation.accept(callId: callId)
        case "decline":
            guard let callId = command["callId"] as? String else { throw FrameError.malformedJSON }
            automation.decline(callId: callId, reason: command["reason"] as? String)
        case "hangup":
            guard let callId = command["callId"] as? String else { throw FrameError.malformedJSON }
            automation.hangup(callId: callId)
        case "clear-audio":
            audio.clearOutput()
            writer.writeJSON([
                "type": "audio-cleared",
                "callId": command["callId"] as? String ?? NSNull(),
            ])
        case "diagnose":
            let checks = Diagnostics.run(blackHoleDevice: blackHoleDevice)
            writer.writeJSON([
                "type": "diagnostics",
                "checks": checks.map { ["id": $0.id, "ok": $0.ok, "message": $0.message] },
            ])
        case "shutdown":
            Task { await shutdown(exitProcess: true) }
        default:
            emitError(code: "unsupported-command", message: "Unsupported command: \(type)")
        }
    }

    private func startAudio(callId: String) async {
        do {
            await audio.stop()
            try await audio.start(blackHoleDevice: blackHoleDevice)
            withStateLock { audioCallId = callId }
        } catch {
            emitError(code: "audio-bridge-start", message: error.localizedDescription, fatal: true)
            automation.hangup(callId: callId)
        }
    }

    private func stopAudio(callId: String) async {
        let shouldStop = withStateLock {
            let matches = audioCallId == nil || audioCallId == callId
            if matches { audioCallId = nil }
            return matches
        }
        if shouldStop {
            await audio.stop()
        }
    }

    private func shutdown(exitProcess: Bool) async {
        let shouldShutdown = withStateLock {
            if shuttingDown { return false }
            shuttingDown = true
            return true
        }
        guard shouldShutdown else { return }
        automation.stop()
        await audio.stop()
        if exitProcess {
            Darwin.exit(EXIT_SUCCESS)
        }
    }

    private func isShuttingDown() -> Bool {
        withStateLock { shuttingDown }
    }

    private func withStateLock<T>(_ body: () -> T) -> T {
        stateLock.lock()
        defer { stateLock.unlock() }
        return body()
    }

    private func emitError(code: String, message: String, fatal: Bool = false) {
        writer.writeJSON([
            "type": "error",
            "code": code,
            "message": message,
            "fatal": fatal,
        ])
    }
}
