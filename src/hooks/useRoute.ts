import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { Couple } from '../data/types'
import {
  pageFromHash,
  pathForRoute,
  routeFromPath,
  stripBase,
  withBase,
  type PageId,
  type Route,
} from '../routes'

/** Fired after `navigate` pushes an address; `pushState` itself fires nothing. */
const NAVIGATED = 'invitation:navigated'

const BASE = import.meta.env.BASE_URL

/**
 * Which page is showing, and in which order the names are shown.
 *
 * Reads the address as an external store rather than mirroring it into state:
 * the browser already holds this value, and a back button press has to be
 * reflected whether or not this component happened to re-render.
 *
 * `serverPath` is the address being prerendered. On the client the server
 * snapshot is the path alone, since that is all the prerendered file was made
 * from, and an old `#/home` hash is applied just after hydration, as it always
 * was.
 */
export function useRoute(
  couple: Couple,
  serverPath: string | undefined,
): [Route, (page: PageId) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('popstate', onChange)
    window.addEventListener('hashchange', onChange)
    window.addEventListener(NAVIGATED, onChange)
    return () => {
      window.removeEventListener('popstate', onChange)
      window.removeEventListener('hashchange', onChange)
      window.removeEventListener(NAVIGATED, onChange)
    }
  }, [])

  // A string, not a route object: a snapshot must compare equal between calls
  // when nothing has changed, and a fresh object never would.
  const getSnapshot = useCallback(() => window.location.pathname + window.location.hash, [])
  const getServerSnapshot = useCallback(
    () => serverPath ?? (typeof window === 'undefined' ? BASE : window.location.pathname),
    [serverPath],
  )

  const address = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const route = useMemo(() => {
    const hashAt = address.indexOf('#')
    const pathname = hashAt === -1 ? address : address.slice(0, hashAt)
    const fromPath = routeFromPath(stripBase(pathname, BASE), couple)
    const fromHash = hashAt === -1 ? undefined : pageFromHash(address.slice(hashAt))
    return fromHash === undefined ? fromPath : { ...fromPath, page: fromHash }
  }, [address, couple])

  const navigate = useCallback(
    (next: PageId) => {
      const path = pathForRoute({ page: next, lead: route.lead }, couple)
      window.history.pushState(null, '', withBase(path, BASE))
      window.dispatchEvent(new Event(NAVIGATED))
      window.scrollTo({ top: 0, behavior: 'auto' })
    },
    [route.lead, couple],
  )

  return [route, navigate]
}
