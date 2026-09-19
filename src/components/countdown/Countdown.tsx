import { CountdownUnit } from './CountdownUnit'
import { CountdownLiveText } from './CountdownLiveText'
import { useCountdown } from '../../hooks/useCountdown'
import { toDurationUnits } from '../../lib/formatDuration'
import type { CountdownConfig } from '../../data/types'

interface CountdownProps {
  countdown: CountdownConfig
  /** Shown in place of the counter while the target is unknown. */
  fallbackLabel: string
  /** Named in the sentence read to assistive technology. */
  subject: string
}

/**
 * The live countdown.
 *
 * The numerals are marked decorative and a coarse sentence is provided
 * alongside them: a screen reader tracking four values a second would be
 * unusable, and the count is not information a guest needs to the second.
 */
export function Countdown({ countdown, fallbackLabel, subject }: CountdownProps) {
  const { status, remainingMs } = useCountdown(countdown.targetInstant)

  // The date is not yet fixed. Show what is known rather than a row of zeroes
  // or a counter to nowhere.
  if (status === 'pending') {
    return (
      <div className="countdown countdown--pending">
        <p className="type-meta countdown__fallback">{fallbackLabel}</p>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className="countdown countdown--completed">
        <p className="type-countdown countdown__completed">{countdown.completedMessage}</p>
      </div>
    )
  }

  const units = toDurationUnits(remainingMs)

  return (
    <div className="countdown">
      <p className="type-eyebrow countdown__heading">{countdown.headingLabel}</p>

      <div className="countdown__units" aria-hidden="true">
        {units.map((unit) => (
          <CountdownUnit key={unit.label} value={unit.value} label={unit.label} />
        ))}
      </div>

      <CountdownLiveText remainingMs={remainingMs} subject={subject} />
    </div>
  )
}
