import { describe, expect, it } from 'vitest'
import { breakDownDuration, toDurationUnits, toSpokenDuration } from './formatDuration'

const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('breakDownDuration', () => {
  it('splits a long span into its parts', () => {
    expect(breakDownDuration(692 * DAY + 14 * HOUR + 35 * MINUTE + 9 * SECOND)).toEqual({
      days: 692,
      hours: 14,
      minutes: 35,
      seconds: 9,
    })
  })

  it('reports zero days for a span just under one day', () => {
    expect(breakDownDuration(23 * HOUR + 59 * MINUTE + 59 * SECOND).days).toBe(0)
  })

  it('returns all zeroes for exactly zero', () => {
    expect(breakDownDuration(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it('clamps a negative span to zero rather than throwing', () => {
    expect(breakDownDuration(-5 * DAY)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it('clamps a non-finite input to zero', () => {
    expect(breakDownDuration(Number.NaN).days).toBe(0)
  })

  it('discards sub-second remainder rather than rounding up', () => {
    expect(breakDownDuration(59 * SECOND + 999).seconds).toBe(59)
  })
})

describe('toDurationUnits', () => {
  it('renders four units in day, hour, minute, second order', () => {
    const units = toDurationUnits(DAY)
    expect(units.map((unit) => unit.label)).toEqual(['Day', 'Hours', 'Minutes', 'Seconds'])
  })

  it('leaves a large day count unpadded and uncapped', () => {
    expect(toDurationUnits(692 * DAY)[0]!.value).toBe('692')
  })

  it('zero-pads hours, minutes and seconds', () => {
    const units = toDurationUnits(5 * HOUR + 7 * MINUTE + 3 * SECOND)
    expect(units[1]!.value).toBe('05')
    expect(units[2]!.value).toBe('07')
    expect(units[3]!.value).toBe('03')
  })

  it('still renders the days unit when under a day remains', () => {
    const units = toDurationUnits(59 * SECOND)
    expect(units).toHaveLength(4)
    expect(units[0]!.value).toBe('0')
  })

  it('uses a singular label for a value of one', () => {
    expect(toDurationUnits(DAY + HOUR + MINUTE + SECOND).map((unit) => unit.label)).toEqual([
      'Day',
      'Hour',
      'Minute',
      'Second',
    ])
  })

  it('uses a plural label for a value of zero', () => {
    expect(toDurationUnits(0).map((unit) => unit.label)).toEqual([
      'Days',
      'Hours',
      'Minutes',
      'Seconds',
    ])
  })

  it('returns zeroed units for a span that has already passed', () => {
    expect(toDurationUnits(-1).map((unit) => unit.value)).toEqual(['0', '00', '00', '00'])
  })
})

describe('toSpokenDuration', () => {
  it('states days and hours only, never seconds', () => {
    const spoken = toSpokenDuration(42 * DAY + 6 * HOUR + 30 * SECOND, 'the wedding')
    expect(spoken).toBe('42 days and 6 hours until the wedding')
    expect(spoken).not.toContain('second')
  })

  it('omits days when under one day remains', () => {
    expect(toSpokenDuration(6 * HOUR, 'the wedding')).toBe('6 hours until the wedding')
  })

  it('reports a sub-hour span without numbers that would churn', () => {
    expect(toSpokenDuration(5 * MINUTE, 'the wedding')).toBe('Less than an hour until the wedding')
  })

  it('uses singular wording for a single day', () => {
    expect(toSpokenDuration(DAY + HOUR, 'the wedding')).toBe('1 day and 1 hour until the wedding')
  })
})
