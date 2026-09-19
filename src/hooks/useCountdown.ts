import { useCallback, useEffect, useMemo, useState } from 'react'
import { isPending } from '../lib/isPending'
import type { ISOInstant, MaybePending } from '../data/types'

export type CountdownStatus = 'pending' | 'counting' | 'completed'

export interface CountdownState {
  status: CountdownStatus
  /** Milliseconds remaining. Zero unless counting. */
  remainingMs: number
}

export interface CountdownOptions {
  /**
   * Reads the current time. Injectable so the whole of this hook can be tested
   * at arbitrary instants — a 692-day countdown, the final second, the moment
   * after zero — without touching global time.
   *
   * Must be a stable reference: it is a dependency of the tick loop, so a new
   * function each render would tear the loop down and rebuild it every time.
   */
  now?: () => number
}

/** Milliseconds until the next whole second on the wall clock. */
function msUntilNextSecond(now: number): number {
  const remainder = now % 1000
  return remainder === 0 ? 1000 : 1000 - remainder
}

/**
 * A live countdown to an instant.
 *
 * Every tick recomputes the remaining time from the clock. It never decrements
 * a stored value and never derives one tick from the last, so drift is not
 * merely unlikely — it has nowhere to accumulate. A counter that subtracts a
 * second each interval loses the event loop's latency every time, which is
 * invisible over five minutes and obviously wrong after a week.
 */
export function useCountdown(
  targetInstant: MaybePending<ISOInstant>,
  options: CountdownOptions = {},
): CountdownState {
  const now = options.now ?? Date.now

  const targetEpochMs = useMemo(() => {
    if (isPending(targetInstant)) return undefined
    const parsed = new Date(targetInstant).getTime()
    return Number.isNaN(parsed) ? undefined : parsed
  }, [targetInstant])

  const read = useCallback((): CountdownState => {
    if (targetEpochMs === undefined) return { status: 'pending', remainingMs: 0 }
    const remainingMs = targetEpochMs - now()
    if (remainingMs <= 0) return { status: 'completed', remainingMs: 0 }
    return { status: 'counting', remainingMs }
  }, [targetEpochMs, now])

  // Seeded from the clock at first render, so the first painted value is
  // already correct and nothing waits a second to become true.
  const [state, setState] = useState<CountdownState>(read)

  useEffect(() => {
    if (targetEpochMs === undefined) return

    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const next = read()
      setState(next)
      if (next.status === 'completed') return
      // Land on the next whole second rather than a flat interval, so the
      // display flips in step with the device clock instead of drifting by
      // however long this callback took to run.
      timer = setTimeout(tick, msUntilNextSecond(now()))
    }

    // The first tick is scheduled, never called inline: the initial state above
    // is already correct, and an inline call would be a wasted render.
    timer = setTimeout(tick, msUntilNextSecond(now()))

    // Every browser throttles timers in a background tab. Without this, a guest
    // returning after five minutes would see a five-minute-old number until the
    // next tick caught up.
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      if (timer !== undefined) clearTimeout(timer)
      tick()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      if (timer !== undefined) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [targetEpochMs, read, now])

  return state
}
