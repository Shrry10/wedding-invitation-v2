const MS_PER_SECOND = 1_000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

export interface DurationParts {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export interface DurationUnit {
  /** Ready to render: days unpadded, the rest zero-padded to two digits. */
  value: string
  /** Pluralised against this unit's own value. */
  label: string
}

/**
 * Splits a millisecond count into whole days, hours, minutes and seconds.
 *
 * Takes the remaining milliseconds as an argument and never reads the clock.
 * That is what makes a 692-day countdown, the final second, and the moment
 * after zero all testable without touching global time.
 *
 * A negative input clamps to zero: the target has passed, and the caller
 * decides what to show instead.
 */
export function breakDownDuration(remainingMs: number): DurationParts {
  const clamped = Number.isFinite(remainingMs) && remainingMs > 0 ? remainingMs : 0

  return {
    days: Math.floor(clamped / MS_PER_DAY),
    hours: Math.floor((clamped % MS_PER_DAY) / MS_PER_HOUR),
    minutes: Math.floor((clamped % MS_PER_HOUR) / MS_PER_MINUTE),
    seconds: Math.floor((clamped % MS_PER_MINUTE) / MS_PER_SECOND),
  }
}

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

function pluralise(value: number, singular: string): string {
  return value === 1 ? singular : `${singular}s`
}

/**
 * The four display units, in the order they are rendered.
 *
 * Days is never padded and never capped — a 692-day countdown renders `692`.
 * Days is also never omitted: when under a day remains it renders `0`, so the
 * row keeps its shape and the layout does not jump.
 */
export function toDurationUnits(remainingMs: number): DurationUnit[] {
  const { days, hours, minutes, seconds } = breakDownDuration(remainingMs)

  return [
    { value: days.toString(), label: pluralise(days, 'Day') },
    { value: pad(hours), label: pluralise(hours, 'Hour') },
    { value: pad(minutes), label: pluralise(minutes, 'Minute') },
    { value: pad(seconds), label: pluralise(seconds, 'Second') },
  ]
}

/**
 * A plain sentence for assistive technology, deliberately coarse.
 *
 * Only days and hours: a screen reader should never be made to track seconds.
 */
export function toSpokenDuration(remainingMs: number, subject: string): string {
  const { days, hours } = breakDownDuration(remainingMs)
  if (days === 0 && hours === 0) return `Less than an hour until ${subject}`
  if (days === 0) return `${hours} ${pluralise(hours, 'hour')} until ${subject}`
  return `${days} ${pluralise(days, 'day')} and ${hours} ${pluralise(hours, 'hour')} until ${subject}`
}
