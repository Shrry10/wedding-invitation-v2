import { renderToString } from 'react-dom/server'
import { App } from './App'
import { content } from './data/content'
import { coupleNames } from './lib/coupleNames'
import { allRoutes, pathForRoute, withBase } from './routes'

/**
 * Renders the invitation to static HTML at build time.
 *
 * This site is a client-rendered React app, which means that without this step
 * a browser with scripting disabled receives an empty `<div>` — not a degraded
 * page, no page at all. Every no-script fallback in the stylesheet depends on
 * markup existing for it to style.
 */
export function render(path: string): string {
  return renderToString(<App path={path} />)
}

/**
 * Every address the site answers, with the file it is written to and the
 * names in the order that address shows them. The prerender step writes one
 * file per entry, so each order and page is a plain file on any static host.
 */
export function prerenderTargets() {
  const base = import.meta.env.BASE_URL
  return allRoutes().map((route) => {
    const path = pathForRoute(route, content.couple)
    return {
      /** Relative to the base, beginning and ending in a slash. */
      path,
      /** The full pathname, as the browser will see it. */
      url: withBase(path, base),
      names: coupleNames(content.couple, route.lead),
    }
  })
}

/** The names in their default order, as `index.html`'s hand-written tags spell them. */
export const defaultNames = coupleNames(content.couple)
