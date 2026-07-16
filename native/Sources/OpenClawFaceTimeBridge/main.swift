import Foundation

private func argumentValue(after flag: String, in arguments: [String]) -> String? {
    guard let index = arguments.firstIndex(of: flag), arguments.indices.contains(index + 1) else {
        return nil
    }
    return arguments[index + 1]
}

let arguments = Array(CommandLine.arguments.dropFirst())

if arguments.contains("--self-test") {
    do {
        let payload = Data("{\"type\":\"ready\"}".utf8)
        var frame = Data([FrameKind.json.rawValue, 0, 0, 0, UInt8(payload.count)])
        frame.append(payload)
        let decoder = FrameDecoder()
        guard try decoder.append(frame.prefix(3)).isEmpty else {
            throw NSError(domain: "self-test", code: 1, userInfo: [NSLocalizedDescriptionKey: "fragment prefix decoded too early"])
        }
        guard try decoder.append(frame.dropFirst(3)) == [Frame(kind: .json, payload: payload)] else {
            throw NSError(domain: "self-test", code: 2, userInfo: [NSLocalizedDescriptionKey: "fragmented frame did not round trip"])
        }
        let oversizedLength = UInt32(FrameDecoder.maxAudioBytes + 1).bigEndian
        var oversized = Data([FrameKind.audio.rawValue])
        withUnsafeBytes(of: oversizedLength) { oversized.append(contentsOf: $0) }
        do {
            _ = try FrameDecoder().append(oversized)
            throw NSError(domain: "self-test", code: 3, userInfo: [NSLocalizedDescriptionKey: "oversized frame was accepted"])
        } catch FrameError.oversized {
            // Expected.
        }
        print("native self-test passed")
        Foundation.exit(EXIT_SUCCESS)
    } catch {
        logError("native self-test failed: \(error)")
        Foundation.exit(EXIT_FAILURE)
    }
}

if arguments.contains("--diagnose") {
    let device = argumentValue(after: "--device", in: arguments) ?? "BlackHole 2ch"
    let checks = Diagnostics.run(blackHoleDevice: device)
    let response: [String: Any] = [
        "ok": checks.allSatisfy(\.ok),
        "checks": checks.map { ["id": $0.id, "ok": $0.ok, "message": $0.message] },
    ]
    let data = try JSONSerialization.data(withJSONObject: response, options: [.sortedKeys])
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write(Data("\n".utf8))
    Foundation.exit(EXIT_SUCCESS)
}

guard arguments.contains("--stdio") else {
    logError("usage: openclaw-facetime-bridge --stdio | --diagnose [--device <name>]")
    Foundation.exit(EXIT_FAILURE)
}

let service = BridgeService()
DispatchQueue.global(qos: .userInitiated).async {
    service.runStdio()
}
dispatchMain()
