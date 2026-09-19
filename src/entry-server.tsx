import { renderToString } from 'react-dom/server'
import { App } from './App'

/**
 * Renders the invitation to static HTML at build time.
 *
 * This site is a client-rendered React app, which means that without this step
 * a browser with scripting disabled receives an empty `<div>` — not a degraded
 * page, no page at all. Every no-script fallback in the stylesheet depends on
 * markup existing for it to style.
 */
export function render(): string {
  return renderToString(<App />)
}
