import { useEffect, useRef, useState } from 'react'
import { VisuallyHidden } from '../a11y/VisuallyHidden'
import { toSpokenDuration } from '../../lib/formatDuration'

/**
 * How often the spoken sentence is allowed to change.
 *
 * Deliberately coarse. A screen reader must never be made to track a value that
 * changes every second — it would make the rest of the page unusable.
 */
const REFRESH_INTERVAL_MS = 60_000

interface CountdownLiveTextProps {
  remainingMs: number
  subject: string
}

/**
 * The countdown as a sentence, for assistive technology only.
 *
 * Carries no live region: it is there to be found when a guest navigates to it,
 * not to interrupt them.
 */
export function CountdownLiveText({ remainingMs, subject }: CountdownLiveTextProps) {
  const [sentence, setSentence] = useState(() => toSpokenDuration(remainingMs, subject))

  // The ticking values are held in a ref rather than in the interval's
  // dependencies, so the timer is created once and genuinely fires a minute
  // apart. Listing them as dependencies would rebuild it every second and the
  // sentence would track the seconds after all.
  const latest = useRef({ remainingMs, subject })
  useEffect(() => {
    latest.current = { remainingMs, subject }
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setSentence(toSpokenDuration(latest.current.remainingMs, latest.current.subject))
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <VisuallyHidden as="p" suppressHydrationWarning>
      {sentence}
    </VisuallyHidden>
  )
}
