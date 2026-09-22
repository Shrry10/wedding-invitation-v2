import { useCallback, useRef, type MouseEvent, type PointerEvent } from 'react'

/**
 * How long after a `pointerdown` a `click` is still that pointer's own.
 *
 * Browsers deliver the pair within a frame or two of the finger lifting; a
 * slow tap on a busy page can stretch that, so the window is generous. What it
 * has to exclude is a keyboard press, and nobody reaches for Enter within half
 * a second of having tapped the same button.
 */
const POINTER_CLICK_MS = 700

export interface PressProps {
  onPointerDown: (event: PointerEvent) => void
  onClick: (event: MouseEvent) => void
}

/**
 * Props that make a button act on the way down.
 *
 * A `click` is not delivered until the finger comes off the glass, and on a
 * phone the browser holds it a little longer still while it decides whether
 * the touch was the start of a scroll. On a page as heavy as this one that
 * wait is long enough to feel like the button is thinking, which is the wrong
 * impression for a switch whose whole job is to stop the music in a room that
 * has just gone quiet.
 *
 * So the action runs on `pointerdown`, the instant the finger lands, and the
 * `click` that follows it is dropped. A click with no recent `pointerdown`
 * behind it came from the keyboard — Enter and Space on a button produce one —
 * and that still runs, which is the whole reason the click handler stays.
 *
 * Only for controls that are cheap and safe to fire early: acting on the way
 * down means a guest cannot slide off the button to change their mind.
 */
export function usePress(run: () => void): PressProps {
  const lastPointerAt = useRef(0)

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      /* Primary button only: a right-click opens a menu, not the music. */
      if (event.button !== 0) return
      lastPointerAt.current = event.timeStamp
      run()
    },
    [run],
  )

  const onClick = useCallback(
    (event: MouseEvent) => {
      /* Two guards, because running twice is much worse than running late: a
         second run would put the music straight back on. `detail` is the click
         count, and a pointer's click always carries at least 1; the window
         catches any browser that disagrees. The cost is that a keyboard press
         inside POINTER_CLICK_MS of a tap on the same button is dropped, which
         is not a thing hands do. */
      if (event.detail !== 0) return
      if (event.timeStamp - lastPointerAt.current < POINTER_CLICK_MS) return
      run()
    },
    [run],
  )

  return { onPointerDown, onClick }
}
