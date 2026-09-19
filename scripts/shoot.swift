import Foundation
import WebKit
import AppKit

// Screenshot helper: loads a URL at a fixed viewport, optionally scrolls, snaps.
// Viewport stays the real size so viewport-relative units behave correctly.
let args = CommandLine.arguments
let urlString = args[1]
let width = Int(args[2])!
let height = Int(args[3])!
let outPath = args[4]
let scrollY = args.count > 5 ? Int(args[5])! : 0

final class Shooter: NSObject, WKNavigationDelegate {
    let webView: WKWebView
    var done = false
    init(width: Int, height: Int) {
        let config = WKWebViewConfiguration()
        webView = WKWebView(frame: NSRect(x: 0, y: 0, width: width, height: height), configuration: config)
        super.init()
        webView.navigationDelegate = self
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 4.0) {
            webView.evaluateJavaScript("try{document.getAnimations().forEach(a => { try { a.finish() } catch (e) {} })}catch(e){}; window.scrollTo(0,\(scrollY)); document.documentElement.scrollWidth") { result, _ in
                if let sw = result as? Int, sw > width {
                    print("WARNING horizontal overflow: scrollWidth=\(sw) viewport=\(width)")
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { self.snap() }
            }
        }
    }
    func snap() {
        let config = WKSnapshotConfiguration()
        config.rect = webView.bounds
        webView.takeSnapshot(with: config) { image, error in
            guard let image = image else { print("snapshot failed: \(error?.localizedDescription ?? "?")"); exit(1) }
            let rep = NSBitmapImageRep(data: image.tiffRepresentation!)!
            try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: outPath))
            print("wrote \(outPath)")
            self.done = true
        }
    }
}

let shooter = Shooter(width: width, height: height)
shooter.webView.load(URLRequest(url: URL(string: urlString)!))
let deadline = Date().addingTimeInterval(45)
while !shooter.done && Date() < deadline {
    RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.1))
}
