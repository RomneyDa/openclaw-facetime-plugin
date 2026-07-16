import Foundation

enum FrameKind: UInt8 {
    case json = 1
    case audio = 2
}

enum FrameError: Error, Equatable {
    case invalidKind(UInt8)
    case oversized(kind: UInt8, length: Int)
    case malformedJSON
}

struct Frame: Equatable {
    let kind: FrameKind
    let payload: Data
}

final class FrameDecoder {
    static let headerBytes = 5
    static let maxJSONBytes = 256 * 1024
    static let maxAudioBytes = 256 * 1024

    private var buffer = Data()

    func append(_ data: Data) throws -> [Frame] {
        buffer.append(data)
        var frames: [Frame] = []
        while buffer.count >= Self.headerBytes {
            let kindByte = buffer[buffer.startIndex]
            guard let kind = FrameKind(rawValue: kindByte) else {
                buffer.removeAll(keepingCapacity: false)
                throw FrameError.invalidKind(kindByte)
            }
            let length = buffer.withUnsafeBytes { raw -> Int in
                let bytes = raw.bindMemory(to: UInt8.self)
                return (Int(bytes[1]) << 24) |
                    (Int(bytes[2]) << 16) |
                    (Int(bytes[3]) << 8) |
                    Int(bytes[4])
            }
            let maximum = kind == .json ? Self.maxJSONBytes : Self.maxAudioBytes
            guard length <= maximum else {
                buffer.removeAll(keepingCapacity: false)
                throw FrameError.oversized(kind: kindByte, length: length)
            }
            let total = Self.headerBytes + length
            guard buffer.count >= total else { break }
            let payload = Data(buffer[Self.headerBytes..<total])
            frames.append(Frame(kind: kind, payload: payload))
            buffer.removeSubrange(0..<total)
        }
        return frames
    }
}

final class FrameWriter {
    private let handle: FileHandle
    private let lock = NSLock()

    init(handle: FileHandle = .standardOutput) {
        self.handle = handle
    }

    func write(kind: FrameKind, payload: Data) throws {
        let maximum = kind == .json ? FrameDecoder.maxJSONBytes : FrameDecoder.maxAudioBytes
        guard payload.count <= maximum else {
            throw FrameError.oversized(kind: kind.rawValue, length: payload.count)
        }
        var data = Data(capacity: FrameDecoder.headerBytes + payload.count)
        data.append(kind.rawValue)
        let length = UInt32(payload.count).bigEndian
        withUnsafeBytes(of: length) { data.append(contentsOf: $0) }
        data.append(payload)
        lock.lock()
        defer { lock.unlock() }
        try handle.write(contentsOf: data)
    }

    func writeJSON(_ object: [String: Any]) {
        do {
            let payload = try JSONSerialization.data(withJSONObject: object)
            try write(kind: .json, payload: payload)
        } catch {
            logError("could not write JSON event: \(error)")
        }
    }

    func writeAudio(_ audio: Data) {
        do {
            try write(kind: .audio, payload: audio)
        } catch {
            logError("could not write audio frame: \(error)")
        }
    }
}

func logError(_ message: String) {
    FileHandle.standardError.write(Data("\(message)\n".utf8))
}

func decodeJSONObject(_ data: Data) throws -> [String: Any] {
    guard let value = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        throw FrameError.malformedJSON
    }
    return value
}
