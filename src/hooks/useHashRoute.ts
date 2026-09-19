import { useCallback, useSyncExternalStore } from 'react'
import { DEFAULT_PAGE, hashForPage, pageFromHash, type PageId } from '../routes'

/**
 * Which page is showing.
 *
 * Reads the hash as an external store rather than mirroring it into state: the
 * browser already holds this value, and a back button press has to be reflected
 * whether or not this component happened to re-render.
 */
export function useHashRoute(): [PageId, (page: PageId) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const getSnapshot = useCallback(() => pageFromHash(window.location.hash), [])
  // The server has no hash to read; the client corrects on hydration.
  const getServerSnapshot = useCallback(() => DEFAULT_PAGE, [])

  const page = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const navigate = useCallback((next: PageId) => {
    window.location.hash = hashForPage(next)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  return [page, navigate]
}
