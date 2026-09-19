import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Injects the server-rendered markup into the built page, once per address.
 *
 * Runs after both builds: the client bundle produces `dist/index.html` with an
 * empty root, and the server bundle produces a render function. This puts one
 * inside the other for every page in every name order, and writes each to its
 * own `index.html` (`dist/home/index.html`, `dist/bhavnaandsreetam/story/…`),
 * so the shipped HTML already contains the invitation, in the right order,
 * whichever address a guest opens.
 */
const root = process.cwd()
const htmlPath = resolve(root, 'dist/index.html')
const serverEntry = resolve(root, 'dist-ssr/entry-server.js')

const { render, prerenderTargets, defaultNames } = await import(pathToFileURL(serverEntry).href)

const template = readFileSync(htmlPath, 'utf8')
const marker = '<div id="root"></div>'

if (!template.includes(marker)) {
  throw new Error(`Could not find ${marker} in dist/index.html — nothing was prerendered.`)
}

/**
 * The head's title and descriptions are hand-written in `index.html` in the
 * default order. A link shared from a reordered address has to preview in
 * that order too, so the pair is swapped wherever it appears there. If the
 * hand-written tags stop matching the content, the build says so rather than
 * shipping a preview in the wrong order.
 */
function orderHead(html, [first, second], path) {
  const [defaultFirst, defaultSecond] = defaultNames
  let out = html
  if (first !== defaultFirst) {
    const spellings = [
      [`${defaultFirst} &amp; ${defaultSecond}`, `${first} &amp; ${second}`],
      [`${defaultFirst} and ${defaultSecond}`, `${first} and ${second}`],
    ]
    for (const [from, to] of spellings) {
      if (!out.includes(from)) {
        throw new Error(
          `index.html no longer contains "${from}"; cannot reorder the names in its head.`,
        )
      }
      out = out.replaceAll(from, to)
    }
  }
  // og:url names the address being shared, not the site's root.
  return out.replace(
    /(property="og:url" content=")([^"]*?)\/?"/,
    (_, open, url) => `${open}${url}${path}"`,
  )
}

let bytes = 0
for (const target of prerenderTargets()) {
  const markup = render(target.url)
  bytes = Math.max(bytes, Buffer.byteLength(markup, 'utf8'))
  const html = orderHead(template, target.names, target.path).replace(
    marker,
    `<div id="root">${markup}</div>`,
  )
  const out = resolve(root, `dist${target.path}index.html`)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, html, 'utf8')
}

// The server bundle is a build artefact, not something to deploy.
rmSync(resolve(root, 'dist-ssr'), { recursive: true, force: true })

console.log(
  `Prerendered ${prerenderTargets().length} addresses into dist/ (largest ${(bytes / 1024).toFixed(1)} KB of markup)`,
)
