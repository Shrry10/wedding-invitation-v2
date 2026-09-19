import type { ISODate, ISOTime } from '../data/types'

const LOCALE = 'en-IN'

const fullDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC',
})

/**
 * A calendar date as `Friday, 11 December 2026`.
 *
 * Parsed and formatted in UTC so the rendered date never shifts by a day for a
 * guest west of the venue.
 */
export function formatFullDate(date: ISODate): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return date
  return fullDateFormatter.format(parsed)
}

const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/**
 * A calendar date as `Friday, 11 December`, for a narrow column under a page
 * that has already said the year. With the year the line broke as
 * `Saturday, 12 December` / `2026`, which reads as a typo.
 */
export function formatLongDate(date: ISODate): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return date
  return longDateFormatter.format(parsed)
}

const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

/** A calendar date as `Fri, 11 Dec`, for a line that already sits under the year. */
export function formatShortDate(date: ISODate): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return date
  return shortDateFormatter.format(parsed)
}

/** A wall-clock time as `6:30 PM`. */
export function formatTime(time: ISOTime): string {
  const parsed = new Date(`1970-01-01T${time}:00Z`)
  if (Number.isNaN(parsed.getTime())) return time
  // Some locales emit a narrow no-break space before the meridiem; normalise it
  // so the rendered string is predictable and testable.
  return timeFormatter.format(parsed).replace(/[\u202f\u00a0]/g, ' ').toUpperCase()
}

/**
 * A time span as `6:30 PM – 10:00 PM`, or an open-ended start as
 * `6:30 PM onwards` when no end time is known.
 */
export function formatTimeRange(start: ISOTime, end?: ISOTime): string {
  const formattedStart = formatTime(start)
  if (end === undefined) return `${formattedStart} onwards`
  return `${formattedStart} – ${formatTime(end)}`
}
