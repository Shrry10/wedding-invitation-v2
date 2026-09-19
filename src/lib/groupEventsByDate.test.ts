import { describe, expect, it } from 'vitest'
import { groupEventsByDate } from './groupEventsByDate'
import { PENDING, type WeddingEvent } from '../data/types'

function event(overrides: Partial<WeddingEvent> & { id: string; date: string }): WeddingEvent {
  return {
    name: overrides.id,
    title: overrides.id,
    startTime: PENDING,
    venueId: 'venue',
    motif: 'lotus',
    palette: 'plain',
    signature: 'none',
    ...overrides,
  }
}

describe('groupEventsByDate', () => {
  it('groups two events sharing a date into one group', () => {
    const groups = groupEventsByDate([
      event({ id: 'haldi', date: '2026-12-12', startTime: '10:00' }),
      event({ id: 'sangeet', date: '2026-12-12', startTime: '19:00' }),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0]!.events.map((entry) => entry.id)).toEqual(['haldi', 'sangeet'])
  })

  it('separates events on different dates into their own groups', () => {
    const groups = groupEventsByDate([
      event({ id: 'mehendi', date: '2026-12-11' }),
      event({ id: 'haldi', date: '2026-12-12' }),
    ])
    expect(groups.map((group) => group.date)).toEqual(['2026-12-11', '2026-12-12'])
  })

  it('orders by date regardless of the order events were written', () => {
    const groups = groupEventsByDate([
      event({ id: 'wedding', date: '2026-12-13' }),
      event({ id: 'mehendi', date: '2026-12-11' }),
      event({ id: 'haldi', date: '2026-12-12' }),
    ])
    expect(groups.map((group) => group.date)).toEqual([
      '2026-12-11',
      '2026-12-12',
      '2026-12-13',
    ])
  })

  it('orders events within a date by start time', () => {
    const groups = groupEventsByDate([
      event({ id: 'sangeet', date: '2026-12-12', startTime: '19:00' }),
      event({ id: 'haldi', date: '2026-12-12', startTime: '10:00' }),
    ])
    expect(groups[0]!.events.map((entry) => entry.id)).toEqual(['haldi', 'sangeet'])
  })

  it('places an event with a pending time after events with known times', () => {
    const groups = groupEventsByDate([
      event({ id: 'unscheduled', date: '2026-12-12' }),
      event({ id: 'haldi', date: '2026-12-12', startTime: '10:00' }),
    ])
    expect(groups[0]!.events.map((entry) => entry.id)).toEqual(['haldi', 'unscheduled'])
  })

  it('produces identical output however the input array is shuffled', () => {
    const events = [
      event({ id: 'mehendi', date: '2026-12-11', startTime: '16:00' }),
      event({ id: 'haldi', date: '2026-12-12', startTime: '10:00' }),
      event({ id: 'sangeet', date: '2026-12-12', startTime: '19:00' }),
      event({ id: 'wedding', date: '2026-12-13', startTime: '19:30' }),
    ]
    const expected = JSON.stringify(groupEventsByDate(events))
    const shuffles = [
      [3, 1, 0, 2],
      [2, 3, 1, 0],
      [1, 0, 3, 2],
    ]
    for (const order of shuffles) {
      expect(JSON.stringify(groupEventsByDate(order.map((index) => events[index]!)))).toBe(expected)
    }
  })

  it('does not mutate the array it was given', () => {
    const events = [
      event({ id: 'wedding', date: '2026-12-13' }),
      event({ id: 'mehendi', date: '2026-12-11' }),
    ]
    groupEventsByDate(events)
    expect(events.map((entry) => entry.id)).toEqual(['wedding', 'mehendi'])
  })

  it('returns no groups for an empty list', () => {
    expect(groupEventsByDate([])).toEqual([])
  })
})
