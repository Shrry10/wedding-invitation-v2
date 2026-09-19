import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
].join(',')

/**
 * Keeps keyboard focus inside a container while it is active, and puts it back
 * where it came from on release.
 *
 * Restoring focus is the half people forget. Without it a guest who opens a
 * photo from the twelfth thumbnail is returned to the top of the document when
 * they close it, and has to find their place again.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const containerRef = useRef<T | null>(null)
  const returnFocusTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (container === null) return

    returnFocusTo.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusable = () => [...container.querySelectorAll<HTMLElement>(FOCUSABLE)]

    // Move focus in, so the first Tab continues from inside rather than
    // stepping through the page behind.
    const first = focusable()[0]
    if (first !== undefined) first.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return

      const firstItem = items[0] as HTMLElement
      const lastItem = items[items.length - 1] as HTMLElement
      const current = document.activeElement

      if (event.shiftKey && current === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && current === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      returnFocusTo.current?.focus()
      returnFocusTo.current = null
    }
  }, [active])

  return containerRef
}
