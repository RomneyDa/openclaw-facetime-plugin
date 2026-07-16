import AppKit
import ApplicationServices
import CoreAudio
import CoreGraphics
import Foundation
import ScreenCaptureKit

struct DiagnosticCheck: Codable, Equatable {
    let id: String
    let ok: Bool
    let message: String
}

enum AudioDevices {
    static func allDeviceIDs() -> [AudioDeviceID] {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioHardwarePropertyDevices,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var size: UInt32 = 0
        guard AudioObjectGetPropertyDataSize(
            AudioObjectID(kAudioObjectSystemObject),
            &address,
            0,
            nil,
            &size
        ) == noErr else { return [] }
        let count = Int(size) / MemoryLayout<AudioDeviceID>.size
        var devices = Array(repeating: AudioDeviceID(0), count: count)
        guard AudioObjectGetPropertyData(
            AudioObjectID(kAudioObjectSystemObject),
            &address,
            0,
            nil,
            &size,
            &devices
        ) == noErr else { return [] }
        return devices
    }

    static func name(of device: AudioDeviceID) -> String? {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioObjectPropertyName,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var value: CFString = "" as CFString
        var size = UInt32(MemoryLayout<CFString>.size)
        let status = withUnsafeMutablePointer(to: &value) { pointer in
            AudioObjectGetPropertyData(device, &address, 0, nil, &size, pointer)
        }
        return status == noErr ? (value as String) : nil
    }

    static func find(named expectedName: String) -> AudioDeviceID? {
        allDeviceIDs().first { name(of: $0)?.localizedCaseInsensitiveCompare(expectedName) == .orderedSame }
    }
}

enum Diagnostics {
    static func run(blackHoleDevice: String) -> [DiagnosticCheck] {
        let faceTimeURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.apple.FaceTime")
        let blackHoleID = AudioDevices.find(named: blackHoleDevice)
        return [
            DiagnosticCheck(
                id: "facetime-app",
                ok: faceTimeURL != nil,
                message: faceTimeURL == nil
                    ? "FaceTime.app was not found"
                    : "FaceTime.app is installed; sign in before starting the Gateway"
            ),
            DiagnosticCheck(
                id: "blackhole",
                ok: blackHoleID != nil,
                message: blackHoleID == nil
                    ? "\(blackHoleDevice) audio device not found; install blackhole-2ch and reboot"
                    : "\(blackHoleDevice) audio device is available"
            ),
            DiagnosticCheck(
                id: "screen-recording",
                ok: CGPreflightScreenCaptureAccess(),
                message: CGPreflightScreenCaptureAccess()
                    ? "Screen & System Audio Recording permission is granted"
                    : "Grant Screen & System Audio Recording permission to the OpenClaw host terminal/service"
            ),
            DiagnosticCheck(
                id: "accessibility",
                ok: AXIsProcessTrusted(),
                message: AXIsProcessTrusted()
                    ? "Accessibility permission is granted"
                    : "Grant Accessibility permission to the OpenClaw host terminal/service"
            ),
        ]
    }
}
