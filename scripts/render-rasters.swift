import Foundation
import WebKit
import AppKit

// -----------------------------------------------------------------------------
// Renders the committed PNG assets — the social preview and the two icons —
// from the site's own components.
//
// Open Graph previews and favicons must be PNG; it is the one place SVG will
// not serve. Everything here uses frameworks already present in macOS: no npm
// package, no image tooling, no external service.
//
// The output is COMMITTED to the repository and `npm run build` never invokes
// this script, so a clean checkout builds on any machine with no Swift
// toolchain. Re-run it by hand only when the hero composition or the lotus
// motif changes, and commit the refreshed PNGs in the same change.
//
//   npm run dev          # in one terminal
//   npm run rasters      # in another
//   RASTER_ONLY=og npm run rasters   # the social preview alone
// -----------------------------------------------------------------------------

struct RasterTarget {
    let path: String
    let width: Int
    let height: Int
    let output: String
}

let origin = ProcessInfo.processInfo.environment["RASTER_ORIGIN"] ?? "http://127.0.0.1:5173"

let allTargets = [
    RasterTarget(path: "/raster-og.html", width: 1200, height: 630, output: "public/og-image.png"),
    RasterTarget(path: "/raster-icon.html", width: 180, height: 180, output: "public/apple-touch-icon.png"),
    RasterTarget(path: "/raster-icon.html", width: 32, height: 32, output: "public/favicon.png"),
]

// RASTER_ONLY=og (or icon) renders just the files whose name contains it, so
// the preview can be refreshed without touching the icons.
let only = ProcessInfo.processInfo.environment["RASTER_ONLY"]
let targets = allTargets.filter { only == nil || $0.output.contains(only!) }

final class Renderer: NSObject, WKNavigationDelegate {
    private let webView: WKWebView
    private let target: RasterTarget
    private(set) var finished = false
    private(set) var failed = false

    init(target: RasterTarget) {
        self.target = target
        let configuration = WKWebViewConfiguration()
        webView = WKWebView(
            frame: NSRect(x: 0, y: 0, width: target.width, height: target.height),
            configuration: configuration
        )
        super.init()
        webView.navigationDelegate = self
    }

    func run() {
        guard let url = URL(string: origin + target.path) else { fail("bad url"); return }
        webView.load(URLRequest(url: url))
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Fonts and the first paint need a moment; animations are forced to
        // their end state so the capture is deterministic.
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            webView.evaluateJavaScript("document.getAnimations().forEach(a => a.finish()); 1") { _, _ in
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { self.capture() }
            }
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        fail(error.localizedDescription)
    }

    func webView(
        _ webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        fail(error.localizedDescription)
    }

    private func capture() {
        let configuration = WKSnapshotConfiguration()
        configuration.rect = webView.bounds
        // Render at the requested pixel size, not the display's scale factor.
        configuration.snapshotWidth = NSNumber(value: target.width)

        webView.takeSnapshot(with: configuration) { image, error in
            guard let image = image else {
                self.fail(error?.localizedDescription ?? "snapshot produced no image")
                return
            }

            // The snapshot arrives at the display's scale factor. Resample to
            // the exact pixel dimensions asked for, so the committed files are
            // the size the meta tags and icon links declare.
            guard
                let exact = NSBitmapImageRep(
                    bitmapDataPlanes: nil,
                    pixelsWide: self.target.width,
                    pixelsHigh: self.target.height,
                    bitsPerSample: 8,
                    samplesPerPixel: 4,
                    hasAlpha: true,
                    isPlanar: false,
                    colorSpaceName: .deviceRGB,
                    bytesPerRow: 0,
                    bitsPerPixel: 0
                )
            else {
                self.fail("could not allocate output bitmap")
                return
            }
            exact.size = NSSize(width: self.target.width, height: self.target.height)

            NSGraphicsContext.saveGraphicsState()
            NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: exact)
            NSGraphicsContext.current?.imageInterpolation = .high
            image.draw(
                in: NSRect(x: 0, y: 0, width: self.target.width, height: self.target.height),
                from: .zero,
                operation: .copy,
                fraction: 1.0
            )
            NSGraphicsContext.restoreGraphicsState()

            guard let png = exact.representation(using: .png, properties: [:]) else {
                self.fail("could not encode png")
                return
            }
            let rep = exact
            do {
                try png.write(to: URL(fileURLWithPath: self.target.output))
                print("  \(self.target.output)  \(rep.pixelsWide)x\(rep.pixelsHigh)")
                self.finished = true
            } catch {
                self.fail(error.localizedDescription)
            }
        }
    }

    private func fail(_ message: String) {
        FileHandle.standardError.write("  failed \(target.output): \(message)\n".data(using: .utf8)!)
        failed = true
        finished = true
    }
}

print("Rendering rasters from \(origin)")
var anyFailed = false

for target in targets {
    let renderer = Renderer(target: target)
    renderer.run()
    let deadline = Date().addingTimeInterval(30)
    while !renderer.finished && Date() < deadline {
        RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
    }
    if !renderer.finished {
        FileHandle.standardError.write("  timed out: \(target.output)\n".data(using: .utf8)!)
        anyFailed = true
    }
    if renderer.failed { anyFailed = true }
}

if anyFailed {
    FileHandle.standardError.write(
        "\nRasters were not all written. Is the dev server running? (npm run dev)\n"
            .data(using: .utf8)!
    )
    exit(1)
}
print("Done. Commit the PNGs in public/ alongside the change that altered them.")
