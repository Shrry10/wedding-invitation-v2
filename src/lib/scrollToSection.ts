/**
 * Scrolls a section into view below the sticky header.
 *
 * Returns whether it handled the request, so a caller can leave the browser's
 * own anchor behaviour in place when it did not.
 */
export function scrollToSection(id: string, options: { smooth: boolean }): boolean {
  const target = document.getElementById(id)
  if (target === null) return false

  const header = document.querySelector('.site-header')
  const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0

  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8

  window.scrollTo({ top, behavior: options.smooth ? 'smooth' : 'auto' })
  return true
}
