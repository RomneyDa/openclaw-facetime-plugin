import AppKit
import ApplicationServices
import Foundation

enum FaceTimeAutomationError: LocalizedError {
    case accessibilityDenied
    case appMissing
    case appNotRunning
    case invalidTarget
    case controlNotFound(String)

    var errorDescription: String? {
        switch self {
        case .accessibilityDenied:
            return "Accessibility permission is required for FaceTime call control"
        case .appMissing:
            return "FaceTime.app is not installed"
        case .appNotRunning:
            return "FaceTime.app is not running"
        case .invalidTarget:
            return "Invalid FaceTime target"
        case .controlNotFound(let control):
            return "Could not find FaceTime \(control) control"
        }
    }
}

private struct ActiveNativeCall {
    let id: String
    var peer: String
    let direction: String
    var state: String
    let startedAt: Date
    var connectedAt: Date?
    var missingControlsSince: Date?
}

final class FaceTimeAutomation {
    private let writer: FrameWriter
    private let queue = DispatchQueue(label: "ai.openclaw.facetime.automation")
    private var timer: DispatchSourceTimer?
    private var active: ActiveNativeCall?
    private var blackHoleDevice = "BlackHole 2ch"
    private var stopped = false
    var onConnected: ((String) -> Void)?
    var onEnded: ((String) -> Void)?

    init(writer: FrameWriter) {
        self.writer = writer
    }

    func configure(blackHoleDevice: String) {
        queue.async {
            self.blackHoleDevice = blackHoleDevice
            self.startMonitoringIfNeeded()
        }
    }

    func dial(callId: String, target: String) {
        queue.async {
            guard self.active == nil else {
                self.emitError(code: "busy", message: "A FaceTime call is already active")
                return
            }
            guard AXIsProcessTrusted() else {
                self.emitError(code: "accessibility-denied", message: FaceTimeAutomationError.accessibilityDenied.localizedDescription, fatal: true)
                return
            }
            guard let encoded = target.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed),
                  let url = URL(string: "facetime-audio://\(encoded)") else {
                self.emitError(code: "invalid-target", message: FaceTimeAutomationError.invalidTarget.localizedDescription)
                return
            }
            self.active = ActiveNativeCall(
                id: callId,
                peer: target,
                direction: "outbound",
                state: "dialing",
                startedAt: Date()
            )
            self.emitState(callId: callId, state: "dialing", peer: target)
            DispatchQueue.main.async {
                NSWorkspace.shared.open(url)
            }
            self.queue.asyncAfter(deadline: .now() + 1.0) {
                _ = self.pressButton(matching: ["call", "facetime audio"])
            }
        }
    }

    func accept(callId: String) {
        queue.async {
            guard var call = self.active, call.id == callId else {
                self.emitError(code: "call-not-found", message: "Inbound FaceTime call \(callId) is not active")
                return
            }
            guard self.pressButton(matching: ["accept", "answer"]) else {
                self.emitError(code: "accept-control-missing", message: FaceTimeAutomationError.controlNotFound("accept").localizedDescription)
                return
            }
            call.state = "connecting"
            self.active = call
            self.emitState(callId: call.id, state: "connecting", peer: call.peer)
        }
    }

    func decline(callId: String, reason: String?) {
        queue.async {
            _ = self.pressButton(matching: ["decline", "reject"])
            self.finish(callId: callId, state: "ended", reason: reason ?? "declined")
        }
    }

    func hangup(callId: String) {
        queue.async {
            _ = self.pressButton(matching: ["end call", "hang up", "leave call", "cancel call"])
            self.finish(callId: callId, state: "ended", reason: "local hangup")
        }
    }

    func stop() {
        queue.sync {
            stopped = true
            timer?.cancel()
            timer = nil
            if let call = active {
                _ = pressButton(matching: ["end call", "hang up", "leave call", "cancel call"])
                finish(callId: call.id, state: "ended", reason: "helper shutdown")
            }
        }
    }

    private func startMonitoringIfNeeded() {
        guard timer == nil else { return }
        let timer = DispatchSource.makeTimerSource(queue: queue)
        timer.schedule(deadline: .now(), repeating: .milliseconds(500), leeway: .milliseconds(100))
        timer.setEventHandler { [weak self] in self?.poll() }
        self.timer = timer
        timer.resume()
    }

    private func poll() {
        guard !stopped, AXIsProcessTrusted() else { return }
        let accept = findButton(matching: ["accept", "answer"])
        let hangup = findButton(matching: ["end call", "hang up", "leave call"])
        let cancel = findButton(matching: ["cancel call"])

        if active == nil, accept != nil {
            let id = UUID().uuidString
            let peer = currentPeer() ?? "unknown-caller"
            active = ActiveNativeCall(
                id: id,
                peer: peer,
                direction: "inbound",
                state: "ringing",
                startedAt: Date()
            )
            writer.writeJSON(["type": "incoming", "callId": id, "peer": peer])
            emitState(callId: id, state: "ringing", peer: peer)
            return
        }

        guard var call = active else { return }
        if hangup != nil {
            call.missingControlsSince = nil
            if call.state != "connected" {
                call.state = "connected"
                call.connectedAt = Date()
                active = call
                emitState(callId: call.id, state: "connected", peer: call.peer)
                if !selectMicrophone(named: blackHoleDevice) {
                    emitError(
                        code: "facetime-microphone-route",
                        message: "Could not select \(blackHoleDevice) in FaceTime; select it manually from the FaceTime Video menu"
                    )
                }
                onConnected?(call.id)
            } else {
                active = call
            }
            return
        }

        if accept != nil {
            call.state = "ringing"
            call.missingControlsSince = nil
            active = call
            return
        }

        if call.state == "dialing" || call.state == "connecting" {
            if cancel != nil {
                active = call
                return
            }
            if Date().timeIntervalSince(call.startedAt) > 45 {
                finish(callId: call.id, state: "failed", reason: "FaceTime connection timed out")
            }
            return
        }

        if call.state == "connected" {
            if call.missingControlsSince == nil {
                call.missingControlsSince = Date()
                active = call
            } else if Date().timeIntervalSince(call.missingControlsSince!) > 1.5 {
                finish(callId: call.id, state: "ended", reason: "remote hangup")
            }
        }
    }

    private func finish(callId: String, state: String, reason: String) {
        guard let call = active, call.id == callId else { return }
        active = nil
        emitState(callId: callId, state: state, peer: call.peer, reason: reason)
        onEnded?(callId)
    }

    private func emitState(callId: String, state: String, peer: String, reason: String? = nil) {
        var event: [String: Any] = [
            "type": "call-state",
            "callId": callId,
            "state": state,
            "peer": peer,
        ]
        if let reason { event["reason"] = reason }
        writer.writeJSON(event)
    }

    private func emitError(code: String, message: String, fatal: Bool = false) {
        writer.writeJSON([
            "type": "error",
            "code": code,
            "message": message,
            "fatal": fatal,
        ])
    }

    private func faceTimeApplicationElement() -> AXUIElement? {
        guard let app = NSRunningApplication.runningApplications(
            withBundleIdentifier: "com.apple.FaceTime"
        ).first else { return nil }
        return AXUIElementCreateApplication(app.processIdentifier)
    }

    private func elements(limit: Int = 1_500) -> [AXUIElement] {
        guard let root = faceTimeApplicationElement() else { return [] }
        var result: [AXUIElement] = []
        var pending: [AXUIElement] = [root]
        while !pending.isEmpty, result.count < limit {
            let element = pending.removeFirst()
            result.append(element)
            if let children: [AXUIElement] = attribute(element, kAXChildrenAttribute as CFString) {
                pending.append(contentsOf: children.prefix(100))
            }
        }
        return result
    }

    private func attribute<T>(_ element: AXUIElement, _ name: CFString) -> T? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, name, &value) == .success else { return nil }
        return value as? T
    }

    private func labels(for element: AXUIElement) -> [String] {
        let attributes = [
            kAXTitleAttribute as CFString,
            kAXDescriptionAttribute as CFString,
            kAXHelpAttribute as CFString,
            kAXValueAttribute as CFString,
            kAXIdentifierAttribute as CFString,
        ]
        return attributes.compactMap { (attribute(element, $0) as String?)?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    private func supportsPress(_ element: AXUIElement) -> Bool {
        var actions: CFArray?
        guard AXUIElementCopyActionNames(element, &actions) == .success,
              let names = actions as? [String] else { return false }
        return names.contains(kAXPressAction as String)
    }

    private func findButton(matching candidates: [String]) -> AXUIElement? {
        let lowered = candidates.map { $0.lowercased() }
        return elements().first { element in
            guard supportsPress(element) else { return false }
            let labels = labels(for: element).map { $0.lowercased() }
            return labels.contains { label in lowered.contains { label.contains($0) } }
        }
    }

    @discardableResult
    private func pressButton(matching candidates: [String]) -> Bool {
        guard let element = findButton(matching: candidates) else { return false }
        return AXUIElementPerformAction(element, kAXPressAction as CFString) == .success
    }

    private func currentPeer() -> String? {
        let ignored = ["facetime", "accept", "answer", "decline", "reject", "end call", "hang up"]
        for element in elements(limit: 500) {
            let role: String? = attribute(element, kAXRoleAttribute as CFString)
            guard role == (kAXWindowRole as String) || role == (kAXStaticTextRole as String) else { continue }
            for label in labels(for: element) {
                let normalized = label.trimmingCharacters(in: .whitespacesAndNewlines)
                let lower = normalized.lowercased()
                if normalized.count >= 2,
                   normalized.count <= 160,
                   !ignored.contains(where: { lower == $0 || lower.contains("\($0) button") }) {
                    return normalized
                }
            }
        }
        return nil
    }

    private func selectMicrophone(named name: String) -> Bool {
        guard let app = faceTimeApplicationElement(),
              let menuBar: AXUIElement = attribute(app, kAXMenuBarAttribute as CFString) else {
            return false
        }
        let menuElements = descendants(of: menuBar, limit: 200)
        if let videoMenu = menuElements.first(where: {
            supportsPress($0) && labels(for: $0).contains(where: { $0.localizedCaseInsensitiveCompare("Video") == .orderedSame })
        }) {
            _ = AXUIElementPerformAction(videoMenu, kAXPressAction as CFString)
            Thread.sleep(forTimeInterval: 0.15)
        }
        guard let device = elements(limit: 1_000).first(where: {
            supportsPress($0) && labels(for: $0).contains(where: { $0.localizedCaseInsensitiveCompare(name) == .orderedSame })
        }) else { return false }
        return AXUIElementPerformAction(device, kAXPressAction as CFString) == .success
    }

    private func descendants(of root: AXUIElement, limit: Int) -> [AXUIElement] {
        var result: [AXUIElement] = []
        var pending = [root]
        while !pending.isEmpty, result.count < limit {
            let element = pending.removeFirst()
            result.append(element)
            if let children: [AXUIElement] = attribute(element, kAXChildrenAttribute as CFString) {
                pending.append(contentsOf: children.prefix(100))
            }
        }
        return result
    }
}
