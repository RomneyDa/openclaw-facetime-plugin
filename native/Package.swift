// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "OpenClawFaceTimeBridge",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "openclaw-facetime-bridge", targets: ["OpenClawFaceTimeBridge"]),
    ],
    targets: [
        .executableTarget(
            name: "OpenClawFaceTimeBridge",
            path: "Sources/OpenClawFaceTimeBridge"
        ),
    ],
    swiftLanguageModes: [.v5]
)
