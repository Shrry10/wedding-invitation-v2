import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Injects the server-rendered markup into the built page.
 *
 * Runs after both builds: the client bundle produces `dist/index.html` with an
 * empty root, and the server bundle produces a render function. This puts one
 * inside the other, so the shipped HTML already contains the invitation.
 */
const root = process.cwd()
const htmlPath = resolve(root, 'dist/index.html')
const serverEntry = resolve(root, 'dist-ssr/entry-server.js')

const { render } = await import(pathToFileURL(serverEntry).href)
const markup = render()

const html = readFileSync(htmlPath, 'utf8')
const marker = '<div id="root"></div>'

if (!html.includes(marker)) {
  throw new Error(`Could not find ${marker} in dist/index.html — nothing was prerendered.`)
}

writeFileSync(htmlPath, html.replace(marker, `<div id="root">${markup}</div>`), 'utf8')

// The server bundle is a build artefact, not something to deploy.
rmSync(resolve(root, 'dist-ssr'), { recursive: true, force: true })

const bytes = Buffer.byteLength(markup, 'utf8')
console.log(`Prerendered ${(bytes / 1024).toFixed(1)} KB of markup into dist/index.html`)
