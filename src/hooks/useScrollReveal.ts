import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

/** How far an element must cross into view before it reveals. */
const REVEAL_THRESHOLD = 0.15

/** Offset between items revealing as a group. */
const STAGGER_STEP_MS = 80

/**
 * Total stagger never exceeds this, however many items there are.
 *
 * Without a cap, a twenty-item gallery would take 1.6 seconds to finish
 * arriving, and the last thumbnail would still be fading in well after the
 * guest had started reading.
 */
const STAGGER_CAP_MS = 480

/**
 * Longest an element may stay hidden waiting to be revealed.
 *
 * A backstop, not a timer. If the observer has not reported by now something
 * has gone wrong — a browser quirk, a detached document, a throttled frame —
 * and the right answer is always to show the content. Nothing on this page is
 * ever worth hiding permanently for want of a callback.
 */
const REVEAL_BACKSTOP_MS = 2500

export interface ScrollRevealResult<T extends HTMLElement> {
  ref: React.RefObject<T | null>
  revealed: boolean
  /** Spread onto the element: drives the reveal transition from CSS. */
  revealProps: {
    'data-reveal': 'pending' | 'shown'
    style: React.CSSProperties
  }
}

/**
 * Reveals an element once, the first time it comes into view.
 *
 * Fires once and then disconnects: scrolling back up and down again does not
 * replay it. This is deliberately the opposite of a signature transition, which
 * plays again on every return — a section arriving is page furniture, and
 * furniture that keeps re-arriving is a distraction.
 */
export function useScrollReveal<T extends HTMLElement>(index = 0): ScrollRevealResult<T> {
  const ref = useRef<T | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const [seen, setSeen] = useState(false)
  const [observerUnavailable, setObserverUnavailable] = useState(false)

  /**
   * Derived, not stored. Where motion is unwanted or unobservable the element
   * is simply always revealed — there is no state to get stuck in.
   */
  const revealed = prefersReducedMotion || observerUnavailable || seen

  useEffect(() => {
    // Nothing to observe: the derived value above already reports revealed.
    if (prefersReducedMotion) return

    const element = ref.current
    if (element === null) return

    if (typeof IntersectionObserver !== 'function') {
      // Deferred, so this lands as its own update rather than cascading out of
      // the effect that discovered it.
      const timer = setTimeout(() => setObserverUnavailable(true), 0)
      return () => clearTimeout(timer)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSeen(true)
            observer.disconnect()
          }
        }
      },
      { threshold: REVEAL_THRESHOLD },
    )

    observer.observe(element)

    const backstop = setTimeout(() => setSeen(true), REVEAL_BACKSTOP_MS)

    return () => {
      clearTimeout(backstop)
      observer.disconnect()
    }
  }, [prefersReducedMotion])

  const delay = prefersReducedMotion ? 0 : Math.min(index * STAGGER_STEP_MS, STAGGER_CAP_MS)

  return {
    ref,
    revealed,
    revealProps: {
      'data-reveal': revealed ? 'shown' : 'pending',
      style: { '--reveal-delay': `${delay}ms` } as React.CSSProperties,
    },
  }
}
