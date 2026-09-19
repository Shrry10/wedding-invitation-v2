/**
 * The site is four pages, as the reference is: an envelope, the invitation it
 * contains, and two pages reached from that invitation.
 *
 * Pages are addressed by hash rather than by path so the whole thing stays a
 * single static file that can be opened from anywhere — including from a
 * WhatsApp preview, which is how most guests will arrive.
 */
export const PAGES = ['envelope', 'home', 'details', 'story'] as const

export type PageId = (typeof PAGES)[number]

export const DEFAULT_PAGE: PageId = 'envelope'

export function pageFromHash(hash: string): PageId {
  const id = hash.replace(/^#\/?/, '') as PageId
  return PAGES.includes(id) ? id : DEFAULT_PAGE
}

export function hashForPage(page: PageId): string {
  return `#/${page}`
}
