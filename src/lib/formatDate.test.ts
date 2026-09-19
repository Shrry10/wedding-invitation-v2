import { describe, expect, it } from 'vitest'
import { formatFullDate, formatLongDate, formatShortDate, formatTime, formatTimeRange } from './formatDate'

describe('formatFullDate', () => {
  it('renders weekday, day, month and year', () => {
    expect(formatFullDate('2026-12-11')).toBe('Friday, 11 December 2026')
  })

  it('renders the day after as the next weekday', () => {
    expect(formatFullDate('2026-12-12')).toBe('Saturday, 12 December 2026')
  })

  it('does not shift across a month boundary', () => {
    expect(formatFullDate('2026-01-01')).toBe('Thursday, 1 January 2026')
  })

  it('returns the input unchanged when it cannot be parsed', () => {
    expect(formatFullDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatLongDate', () => {
  it('renders weekday, day and month in full, without the year', () => {
    expect(formatLongDate('2026-12-12')).toBe('Saturday, 12 December')
  })
})

describe('formatShortDate', () => {
  it('renders weekday, day and month, without the year', () => {
    expect(formatShortDate('2026-12-11')).toBe('Fri, 11 Dec')
  })

  it('returns the input unchanged when it cannot be parsed', () => {
    expect(formatShortDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatTime', () => {
  it('renders midnight as twelve at night, not zero', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
  })

  it('renders noon as twelve in the afternoon, not zero', () => {
    expect(formatTime('12:00')).toBe('12:00 PM')
  })

  it('renders a single-digit hour without padding it', () => {
    expect(formatTime('09:05')).toBe('9:05 AM')
  })

  it('renders an evening time in the afternoon half', () => {
    expect(formatTime('18:30')).toBe('6:30 PM')
  })

  it('renders the last minute of the day', () => {
    expect(formatTime('23:59')).toBe('11:59 PM')
  })
})

describe('formatTimeRange', () => {
  it('renders a closed range with both ends', () => {
    expect(formatTimeRange('18:30', '22:00')).toBe('6:30 PM – 10:00 PM')
  })

  it('renders an open-ended start as onwards', () => {
    expect(formatTimeRange('18:30')).toBe('6:30 PM onwards')
  })

  it('renders a range that crosses noon', () => {
    expect(formatTimeRange('11:00', '14:00')).toBe('11:00 AM – 2:00 PM')
  })
})
