import { useEffect, type RefObject } from 'react'

/**
 * Brings every object on a page in, once, while the page loads.
 *
 * Everything is revealed together rather than as the reader reaches it. This
 * was driven by an IntersectionObserver before, one reveal per object as it
 * neared the fold, and that is the wrong shape for this page: whatever the
 * trigger distance, an object is being faded in and its shadow filter applied
 * at the moment the reader is scrolling past it, and all of that work lands on
 * the frames that can least afford it. Measured at one point, ten objects at a
 * time were on screen and not yet drawn. Moving the trigger earlier only moved
 * the work; doing it at load removes it from the scroll entirely.
 *
 * The cost is that the arrival is only *watched* for what is on screen at
 * load — the rest has landed by the time it is reached. That is the trade the
 * page wants: the animation is a flourish, and a flourish must never be the
 * reason the page stutters underneath it.
 *
 * The finished state is the default in the stylesheet and this only takes it
 * away, so an object is never invisible because script failed to arrive.
 */
export function useStagedReveal(rootRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const root = rootRef.current
    if (root === null) return

    const pieces = [...root.querySelectorAll<HTMLElement>('[data-piece]')]

    /**
     * Marks a piece settled once its animation ends.
     *
     * The compositor hint is expensive to leave in place — several of these
     * objects carry SVG blur filters, and a promoted layer for each would cost
     * far more than the arrival is worth — so it is dropped the moment the
     * piece stops moving, and with it the withheld shadow is restored.
     */
    const settle = (event: AnimationEvent) => {
      const el = event.currentTarget as HTMLElement
      el.setAttribute('data-settled', '')
      el.removeEventListener('animationend', settle)
    }

    if (!enabled) {
      pieces.forEach((piece) => {
        piece.setAttribute('data-shown', '')
        piece.setAttribute('data-settled', '')
      })
      return
    }

    // Four steps rather than one wave: two dozen objects appearing on the same
    // frame is both a visible flash and the heaviest single frame on the page.
    pieces.forEach((piece, index) => {
      piece.style.setProperty('--settle-delay', `${(index % 4) * 60}ms`)
      piece.addEventListener('animationend', settle)
      piece.setAttribute('data-shown', '')
    })

    return () => {
      pieces.forEach((piece) => piece.removeEventListener('animationend', settle))
    }
  }, [rootRef, enabled])
}
