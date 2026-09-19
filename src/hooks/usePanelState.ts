import { useCallback, useEffect, useRef, useState } from 'react'
import { panelSlots } from './usePanelSlot'
import { useReducedMotion } from './useReducedMotion'

/**
 * A panel's lifecycle: `idle → entering → entered → exiting → idle`.
 *
 * Four distinct phases in a cycle of five steps. No transition may skip one.
 */
export type PanelPhase = 'idle' | 'entering' | 'entered' | 'exiting'

/** Where a panel is heading. Only the two settled phases are valid targets. */
type SettledPhase = 'idle' | 'entered'

/**
 * Enter and exit use different thresholds, and the gap between them is the
 * point. With a single threshold a panel parked on the boundary would flip
 * state on every pixel of scroll.
 */
const ENTER_THRESHOLD = 0.4
const EXIT_THRESHOLD = 0.1

/**
 * Development-only phase override, e.g. `?panelPhase=entered`.
 *
 * An entrance is only reviewable in the state it animates to, and scrolling a
 * headless browser to catch a 900 ms transition mid-flight is not a review
 * technique. Stripped from production builds.
 */
function devPhaseOverride(): PanelPhase | undefined {
  if (!import.meta.env.DEV) return undefined
  if (typeof window === 'undefined') return undefined
  const value = new URLSearchParams(window.location.search).get('panelPhase')
  return value === 'idle' || value === 'entering' || value === 'entered' || value === 'exiting'
    ? value
    : undefined
}

export interface PanelStateOptions {
  enterDurationMs: number
  exitDurationMs: number
}

export interface PanelStateResult<T extends HTMLElement> {
  /**
   * A callback ref, not an object ref.
   *
   * The observer can only be attached once the element exists, and a callback
   * ref is the only kind that tells us when that happened.
   */
  ref: (element: T | null) => void
  phase: PanelPhase
  /** True once settled visible — what a static render should show. */
  settledVisible: boolean
}

/**
 * Drives one panel's entrance and exit.
 *
 * Replays on every re-entry rather than firing once: a guest scrolling back up
 * should see the journey run backwards. That is the opposite of the section
 * reveal, which arrives once and stays, and the difference is deliberate.
 */
export function usePanelState<T extends HTMLElement>(
  options: PanelStateOptions,
): PanelStateResult<T> {
  const { enterDurationMs, exitDurationMs } = options
  const [element, setElement] = useState<T | null>(null)
  const ref = useCallback((next: T | null) => setElement(next), [])
  const prefersReducedMotion = useReducedMotion()

  const [phase, setPhase] = useState<PanelPhase>('idle')

  /** At most one. A fast scroll overwrites it rather than queueing behind it. */
  const pendingTarget = useRef<SettledPhase | undefined>(undefined)
  const phaseRef = useRef<PanelPhase>('idle')
  const holdsSlot = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const stopWaiting = useRef<(() => void) | undefined>(undefined)

  /**
   * Lets the completion handler start the queued transition without the
   * callback having to reference itself before it exists.
   */
  const latestRequest = useRef<(target: SettledPhase) => void>(() => {})

  const applyPhase = useCallback((next: PanelPhase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const releaseSlot = useCallback(() => {
    if (holdsSlot.current) {
      holdsSlot.current = false
      panelSlots.release()
    }
  }, [])

  /**
   * Moves toward a settled phase.
   *
   * While an animation is running the request is stored rather than applied:
   * reversing mid-flight looks like a fault, and truncating one looks like a
   * dropped frame.
   */
  const requestTarget = useCallback(
    (target: SettledPhase) => {
      const current = phaseRef.current

      if (current === 'entering' || current === 'exiting') {
        pendingTarget.current = target
        return
      }
      if (current === target) return

      const begin = () => {
        if (!panelSlots.acquire()) {
          // Every slot is busy. Wait rather than dropping the transition, so
          // the journey stays in step with the guest.
          stopWaiting.current?.()
          stopWaiting.current = panelSlots.waitForSlot(() => {
            stopWaiting.current = undefined
            begin()
          })
          return
        }

        holdsSlot.current = true
        const animating: PanelPhase = target === 'entered' ? 'entering' : 'exiting'
        applyPhase(animating)

        if (timer.current !== undefined) clearTimeout(timer.current)
        timer.current = setTimeout(
          () => {
            applyPhase(target)
            releaseSlot()

            const queued = pendingTarget.current
            pendingTarget.current = undefined
            if (queued !== undefined && queued !== target) latestRequest.current(queued)
          },
          target === 'entered' ? enterDurationMs : exitDurationMs,
        )
      }

      begin()
    },
    [applyPhase, releaseSlot, enterDurationMs, exitDurationMs],
  )

  useEffect(() => {
    latestRequest.current = requestTarget
  }, [requestTarget])

  useEffect(() => {
    // Nothing to animate: the panel renders settled and no observer is made.
    if (prefersReducedMotion) return

    if (element === null) return
    if (typeof IntersectionObserver !== 'function') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= ENTER_THRESHOLD) {
            requestTarget('entered')
          } else if (entry.intersectionRatio <= EXIT_THRESHOLD) {
            requestTarget('idle')
          }
          // Between the two thresholds nothing happens. That gap is what stops
          // a panel resting on the boundary from flickering.
        }
      },
      { threshold: [EXIT_THRESHOLD, ENTER_THRESHOLD] },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      if (timer.current !== undefined) clearTimeout(timer.current)
      stopWaiting.current?.()
      stopWaiting.current = undefined
      releaseSlot()
      pendingTarget.current = undefined
    }
  }, [element, prefersReducedMotion, requestTarget, releaseSlot])

  const settledVisible = prefersReducedMotion || phase === 'entered' || phase === 'entering'
  const override = devPhaseOverride()

  return {
    ref,
    phase: override ?? (prefersReducedMotion ? 'entered' : phase),
    settledVisible,
  }
}
