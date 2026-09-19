import type { Couple, LeadName } from './data/types'
import { coupleNames } from './lib/coupleNames'

/**
 * The site is four pages, as the reference is: an envelope, the invitation it
 * contains, and two pages reached from that invitation.
 *
 * Pages are addressed by path, `/home/`, `/details/`, `/story/`, with the
 * envelope at the root. Every address is prerendered to its own
 * `index.html`, so a static host serves each one as a plain file and a link
 * opened from WhatsApp shows the right page before any script runs.
 */
export const PAGES = ['envelope', 'home', 'details', 'story'] as const

export type PageId = (typeof PAGES)[number]

export const DEFAULT_PAGE: PageId = 'envelope'

/**
 * Where the reader is: which page, and whose name leads.
 *
 * Each side of the family sends its own link, and the name of their own child
 * comes first on it: `/bhavnaandsreetam/home/` shows "Bhavna & Sreetam"
 * everywhere, `/sreetamandbhavna/home/` the reverse. `lead` is `undefined`
 * when the address names no order, and the content's `leadName` applies. It is
 * kept apart from an explicit choice so that moving between pages keeps the
 * address the guest was sent.
 */
export interface Route {
  page: PageId
  lead: LeadName | undefined
}

export const DEFAULT_ROUTE: Route = { page: DEFAULT_PAGE, lead: undefined }

/**
 * The path segment that sets the order: both names, leading name first, joined
 * by "and", lower case, letters and digits only. Taken from the content, so a
 * change of spelling there changes the addresses with it.
 */
export function orderSegment(couple: Couple, lead: LeadName): string {
  const [first, second] = coupleNames(couple, lead)
  return `${first}and${second}`.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Reads a path, relative to the site's base, into a route.
 *
 * Case and a trailing slash are ignored. Anything not understood falls back to
 * the default rather than failing: a guest who mistypes an address should
 * still reach the invitation.
 */
export function routeFromPath(path: string, couple: Couple): Route {
  const segments = path
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => segment.toLowerCase())

  let lead: LeadName | undefined
  const leads: LeadName[] = ['groom', 'bride']
  const named = leads.find((candidate) => orderSegment(couple, candidate) === segments[0])
  if (named !== undefined) {
    lead = named
    segments.shift()
  }

  const page = PAGES.find((candidate) => candidate === segments[0]) ?? DEFAULT_PAGE
  return { page, lead }
}

/**
 * The path for a route, relative to the site's base. Always ends in a slash,
 * because every address is a directory holding its own `index.html` and not
 * every host redirects the slashless form to it.
 */
export function pathForRoute(route: Route, couple: Couple): string {
  const prefix = route.lead === undefined ? '' : `/${orderSegment(couple, route.lead)}`
  const page = route.page === DEFAULT_PAGE ? '' : `/${route.page}`
  return `${prefix}${page}/`
}

/**
 * The page named by an old-style `#/home` address, if there is one.
 *
 * Pages were addressed by hash before they had paths, and a link shared then
 * should still open the page it named.
 */
export function pageFromHash(hash: string): PageId | undefined {
  const id = hash.replace(/^#\/?/, '').toLowerCase()
  return PAGES.find((candidate) => candidate === id)
}

/** A full pathname with the site's base (`/`, or `/sub/` when served below one) taken off. */
export function stripBase(pathname: string, base: string): string {
  const root = base.endsWith('/') ? base.slice(0, -1) : base
  return pathname.startsWith(root) ? pathname.slice(root.length) || '/' : pathname
}

/** A path relative to the base, made into a full pathname. */
export function withBase(path: string, base: string): string {
  const root = base.endsWith('/') ? base.slice(0, -1) : base
  return `${root}${path}`
}

/** Every route the site has, one per prerendered file: each order, then no order, for each page. */
export function allRoutes(): Route[] {
  const leads: (LeadName | undefined)[] = [undefined, 'groom', 'bride']
  return leads.flatMap((lead) => PAGES.map((page) => ({ page, lead })))
}
