import { isPending } from './isPending'
import type { ISODate, WeddingEvent } from '../data/types'

export interface EventDateGroup {
  date: ISODate
  events: WeddingEvent[]
}

/**
 * Sort key for an event's start time.
 *
 * A pending time sorts after every known time on the same date, so a function
 * whose hour is not yet fixed sits at the end of its day rather than
 * arbitrarily at the front.
 */
function startTimeKey(event: WeddingEvent): string {
  return isPending(event.startTime) ? '99:99' : event.startTime
}

/**
 * Orders events by date then start time, and groups those sharing a date.
 *
 * Order is computed here, never taken from the order they were written in the
 * content file — so rearranging that file cannot change what a guest sees.
 */
export function groupEventsByDate(events: WeddingEvent[]): EventDateGroup[] {
  const sorted = [...events].sort((left, right) => {
    if (left.date !== right.date) return left.date < right.date ? -1 : 1
    const leftTime = startTimeKey(left)
    const rightTime = startTimeKey(right)
    if (leftTime !== rightTime) return leftTime < rightTime ? -1 : 1
    // Stable tiebreak so two pending times on one date keep a fixed order.
    return left.id < right.id ? -1 : 1
  })

  const groups: EventDateGroup[] = []
  for (const event of sorted) {
    const current = groups[groups.length - 1]
    if (current !== undefined && current.date === event.date) {
      current.events.push(event)
    } else {
      groups.push({ date: event.date, events: [event] })
    }
  }

  return groups
}
