import AVFoundation
import AudioToolbox
import CoreMedia
import Foundation
import ScreenCaptureKit

enum AudioBridgeError: LocalizedError {
    case blackHoleNotFound(String)
    case blackHoleRoutingFailed(OSStatus)
    case faceTimeWindowNotFound
    case unsupportedCaptureFormat(String)

    var errorDescription: String? {
        switch self {
        case .blackHoleNotFound(let name):
            return "Audio device \(name) was not found"
        case .blackHoleRoutingFailed(let status):
            return "Could not route audio to BlackHole (CoreAudio status \(status))"
        case .faceTimeWindowNotFound:
            return "No on-screen FaceTime call window was found"
        case .unsupportedCaptureFormat(let detail):
            return "Unsupported FaceTime capture format: \(detail)"
        }
    }
}

final class BlackHolePlayer {
    private let queue = DispatchQueue(label: "ai.openclaw.facetime.blackhole-output")
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let format: AVAudioFormat
    private var started = false

    init(deviceName: String, sampleRate: Double = 24_000) throws {
        guard let deviceID = AudioDevices.find(named: deviceName) else {
            throw AudioBridgeError.blackHoleNotFound(deviceName)
        }
        guard let format = AVAudioFormat(
            commonFormat: .pcmFormatInt16,
            sampleRate: sampleRate,
            channels: 1,
            interleaved: false
        ) else {
            throw AudioBridgeError.unsupportedCaptureFormat("could not create PCM16 24 kHz format")
        }
        self.format = format
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: format)
        var mutableDeviceID = deviceID
        guard let audioUnit = engine.outputNode.audioUnit else {
            throw AudioBridgeError.blackHoleRoutingFailed(kAudio_ParamError)
        }
        let status = AudioUnitSetProperty(
            audioUnit,
            kAudioOutputUnitProperty_CurrentDevice,
            kAudioUnitScope_Global,
            0,
            &mutableDeviceID,
            UInt32(MemoryLayout<AudioDeviceID>.size)
        )
        guard status == noErr else {
            throw AudioBridgeError.blackHoleRoutingFailed(status)
        }
        engine.prepare()
        try engine.start()
        player.play()
        started = true
    }

    func enqueue(_ data: Data) {
        guard !data.isEmpty else { return }
        queue.async { [weak self] in
            guard let self, self.started else { return }
            let frames = AVAudioFrameCount(data.count / MemoryLayout<Int16>.size)
            guard frames > 0,
                  let buffer = AVAudioPCMBuffer(pcmFormat: self.format, frameCapacity: frames),
                  let destination = buffer.int16ChannelData?.pointee else { return }
            buffer.frameLength = frames
            data.copyBytes(
                to: UnsafeMutableRawBufferPointer(
                    start: destination,
                    count: Int(frames) * MemoryLayout<Int16>.size
                )
            )
            self.player.scheduleBuffer(buffer)
        }
    }

    func clear() {
        queue.sync {
            guard started else { return }
            player.stop()
            player.reset()
            player.play()
        }
    }

    func stop() {
        queue.sync {
            guard started else { return }
            started = false
            player.stop()
            engine.stop()
        }
    }
}

final class FaceTimeAudioCapture: NSObject, SCStreamOutput, SCStreamDelegate {
    private let writer: FrameWriter
    private let sampleQueue = DispatchQueue(label: "ai.openclaw.facetime.capture")
    private var stream: SCStream?
    private var reportedFormatError = false

    init(writer: FrameWriter) {
        self.writer = writer
    }

    func start() async throws {
        let content = try await SCShareableContent.excludingDesktopWindows(
            false,
            onScreenWindowsOnly: true
        )
        let windows = content.windows.filter {
            $0.owningApplication?.bundleIdentifier == "com.apple.FaceTime" && $0.isOnScreen
        }
        guard let window = windows.max(by: {
            ($0.frame.width * $0.frame.height) < ($1.frame.width * $1.frame.height)
        }) else {
            throw AudioBridgeError.faceTimeWindowNotFound
        }
        let filter = SCContentFilter(desktopIndependentWindow: window)
        let configuration = SCStreamConfiguration()
        configuration.width = 2
        configuration.height = 2
        configuration.minimumFrameInterval = CMTime(seconds: 1, preferredTimescale: 600)
        configuration.queueDepth = 3
        configuration.showsCursor = false
        configuration.capturesAudio = true
        configuration.excludesCurrentProcessAudio = true
        configuration.sampleRate = 24_000
        configuration.channelCount = 1
        let stream = SCStream(filter: filter, configuration: configuration, delegate: self)
        try stream.addStreamOutput(self, type: .audio, sampleHandlerQueue: sampleQueue)
        self.stream = stream
        try await stream.startCapture()
    }

    func stop() async {
        guard let stream else { return }
        self.stream = nil
        try? await stream.stopCapture()
    }

    func stream(_ stream: SCStream, didStopWithError error: Error) {
        writer.writeJSON([
            "type": "error",
            "code": "screen-capture-stopped",
            "message": error.localizedDescription,
            "fatal": true,
        ])
    }

    func stream(
        _ stream: SCStream,
        didOutputSampleBuffer sampleBuffer: CMSampleBuffer,
        of outputType: SCStreamOutputType
    ) {
        guard outputType == .audio,
              sampleBuffer.isValid,
              CMSampleBufferDataIsReady(sampleBuffer) else { return }
        do {
            if let pcm = try Self.convertToPCM16(sampleBuffer) {
                writer.writeAudio(pcm)
            }
        } catch {
            if !reportedFormatError {
                reportedFormatError = true
                writer.writeJSON([
                    "type": "error",
                    "code": "capture-audio-format",
                    "message": error.localizedDescription,
                    "fatal": true,
                ])
            }
        }
    }

    static func convertToPCM16(_ sampleBuffer: CMSampleBuffer) throws -> Data? {
        guard let description = CMSampleBufferGetFormatDescription(sampleBuffer),
              let asbdPointer = CMAudioFormatDescriptionGetStreamBasicDescription(description) else {
            throw AudioBridgeError.unsupportedCaptureFormat("missing audio stream description")
        }
        let asbd = asbdPointer.pointee
        guard abs(asbd.mSampleRate - 24_000) < 1 else {
            throw AudioBridgeError.unsupportedCaptureFormat("expected 24000 Hz, got \(asbd.mSampleRate)")
        }
        guard asbd.mChannelsPerFrame == 1 else {
            throw AudioBridgeError.unsupportedCaptureFormat(
                "expected mono, got \(asbd.mChannelsPerFrame) channels"
            )
        }
        var list = AudioBufferList(
            mNumberBuffers: 1,
            mBuffers: AudioBuffer(mNumberChannels: 1, mDataByteSize: 0, mData: nil)
        )
        var blockBuffer: CMBlockBuffer?
        let status = CMSampleBufferGetAudioBufferListWithRetainedBlockBuffer(
            sampleBuffer,
            bufferListSizeNeededOut: nil,
            bufferListOut: &list,
            bufferListSize: MemoryLayout<AudioBufferList>.size,
            blockBufferAllocator: kCFAllocatorDefault,
            blockBufferMemoryAllocator: kCFAllocatorDefault,
            flags: 0,
            blockBufferOut: &blockBuffer
        )
        guard status == noErr,
              let source = list.mBuffers.mData else {
            throw AudioBridgeError.unsupportedCaptureFormat("could not read audio buffer (\(status))")
        }
        let frames = CMSampleBufferGetNumSamples(sampleBuffer)
        guard frames > 0 else { return nil }
        let flags = asbd.mFormatFlags
        if asbd.mBitsPerChannel == 32 && (flags & kAudioFormatFlagIsFloat) != 0 {
            let input = source.assumingMemoryBound(to: Float.self)
            var samples = [Int16](repeating: 0, count: frames)
            for index in 0..<frames {
                let clamped = max(-1.0, min(1.0, input[index]))
                samples[index] = Int16(clamped * Float(Int16.max))
            }
            return samples.withUnsafeBytes { Data($0) }
        }
        if asbd.mBitsPerChannel == 16 && (flags & kAudioFormatFlagIsSignedInteger) != 0 {
            return Data(bytes: source, count: min(frames * 2, Int(list.mBuffers.mDataByteSize)))
        }
        throw AudioBridgeError.unsupportedCaptureFormat(
            "format=\(asbd.mFormatID) flags=\(flags) bits=\(asbd.mBitsPerChannel)"
        )
    }
}

final class DuplexAudioBridge {
    private let writer: FrameWriter
    private var player: BlackHolePlayer?
    private var capture: FaceTimeAudioCapture?

    init(writer: FrameWriter) {
        self.writer = writer
    }

    func start(blackHoleDevice: String) async throws {
        stopPlayback()
        let player = try BlackHolePlayer(deviceName: blackHoleDevice)
        let capture = FaceTimeAudioCapture(writer: writer)
        do {
            try await capture.start()
        } catch {
            player.stop()
            throw error
        }
        self.player = player
        self.capture = capture
    }

    func enqueueOutput(_ data: Data) {
        player?.enqueue(data)
    }

    func clearOutput() {
        player?.clear()
    }

    func stop() async {
        let capture = self.capture
        self.capture = nil
        await capture?.stop()
        stopPlayback()
    }

    private func stopPlayback() {
        player?.stop()
        player = nil
    }
}
