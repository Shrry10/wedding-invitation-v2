import { useCallback, useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Whether the guest has asked for reduced motion.
 *
 * The single script-side source of truth. The stylesheet handles the same
 * preference independently, because it has to cover the first paint before any
 * of this runs; this hook covers the decisions script has to make, such as
 * declining to register an observer at all.
 *
 * Subscribes to the media query as an external store rather than mirroring it
 * into state from an effect: the browser already holds this value, and copying
 * it would mean a render pass spent catching up to something already known.
 */
export function useReducedMotion(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    if (typeof window.matchMedia !== 'function') return () => {}
    const query = window.matchMedia(QUERY)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const getSnapshot = useCallback(() => {
    if (typeof window.matchMedia !== 'function') return false
    return window.matchMedia(QUERY).matches
  }, [])

  // The server has no preference to report; the client corrects on hydration.
  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
