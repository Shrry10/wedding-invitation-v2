import { useEffect } from 'react'

/**
 * Stops the page scrolling behind an overlay.
 *
 * `overflow: hidden` alone is not enough on iOS: the page keeps rubber-banding
 * and the guest's place is lost when the overlay closes. Fixing the body and
 * offsetting it by the current scroll position is the only reliable way, and
 * the offset has to be restored exactly or closing the overlay jumps the page
 * to the top.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return

    const { body } = document
    const scrollY = window.scrollY

    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
      scrollBehavior: document.documentElement.style.scrollBehavior,
    }

    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.overflow = 'hidden'
    // Restoring the position must not be animated, or the page visibly slides
    // back to where it already was.
    document.documentElement.style.scrollBehavior = 'auto'

    return () => {
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.left = previous.left
      body.style.right = previous.right
      body.style.overflow = previous.overflow
      window.scrollTo(0, scrollY)
      document.documentElement.style.scrollBehavior = previous.scrollBehavior
    }
  }, [active])
}
