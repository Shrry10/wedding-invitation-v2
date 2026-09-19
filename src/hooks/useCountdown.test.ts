import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'
import { PENDING } from '../data/types'

const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const TARGET = '2026-12-13T19:30:00+05:30'
const TARGET_MS = new Date(TARGET).getTime()

/** A clock the test drives, so no assertion depends on real elapsed time. */
function makeClock(startMs: number) {
  let current = startMs
  return {
    now: () => current,
    advance(ms: number) {
      current += ms
    },
    set(ms: number) {
      current = ms
    },
  }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

/** Moves both the clock and the timer queue together, as real time would. */
function advance(clock: ReturnType<typeof makeClock>, ms: number) {
  act(() => {
    clock.advance(ms)
    vi.advanceTimersByTime(ms)
  })
}

describe('useCountdown', () => {
  it('reports the remaining time on its first render, without waiting a tick', () => {
    const clock = makeClock(TARGET_MS - 692 * DAY - 14 * HOUR)
    const { result } = renderHook(() => useCountdown(TARGET, { now: clock.now }))
    expect(result.current.status).toBe('counting')
    expect(result.current.remainingMs).toBe(692 * DAY + 14 * HOUR)
  })

  it('advances once per second', () => {
    const clock = makeClock(TARGET_MS - 10 * SECOND)
    const { result } = renderHook(() => useCountdown(TARGET, { now: clock.now }))
    expect(result.current.remainingMs).toBe(10 * SECOND)

    advance(clock, SECOND)
    expect(result.current.remainingMs).toBe(9 * SECOND)

    advance(clock, SECOND)
    expect(result.current.remainingMs).toBe(8 * SECOND)
  })

  it('does not drift over a simulated day', () => {
    const clock = makeClock(TARGET_MS - 3 * DAY)
    const { result } = renderHook(() => useCountdown(TARGET, { now: clock.now }))

    // A counter that decremented a stored value would lose the loop's latency
    // on every one of these ticks. Recomputing from the clock cannot.
    for (let elapsed = 0; elapsed < DAY; elapsed += 30 * MINUTE) {
      advance(clock, 30 * MINUTE)
    }

    expect(result.current.remainingMs).toBe(2 * DAY)
  })

  it('stays correct when the clock jumps forward, as after a sleeping tab', () => {
    const clock = makeClock(TARGET_MS - HOUR)
    const { result } = renderHook(() => useCountdown(TARGET, { now: clock.now }))
    expect(result.current.remainingMs).toBe(HOUR)

    // The tab was asleep: real time moved on while timers stayed parked.
    act(() => {
      clock.set(TARGET_MS - 5 * MINUTE)
      vi.advanceTimersByTime(SECOND)
    })

    // The next tick reports where the clock actually is, not where the timer
    // queue thinks it should be. A counter subtracting one second per tick
    // would still be reporting fifty-nine minutes here.
    expect(result.current.remainingMs).toBe(5 * MINUTE)
  })

  it('recomputes immediately when the tab becomes visible again', () => {
    const clock = makeClock(TARGET_MS - HOUR)
    const { result } = renderHook(() => useCountdown(TARGET, { now: clock.now }))

    act(() => {
      clock.set(TARGET_MS - 12 * MINUTE)
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current.remainingMs).toBe(12 * MINUTE)
  })

  it('reports completion on the tick that crosses zero', () => {
    const clock = makeClock(TARGET_MS - 2 * SECOND)
    const { result } = renderHook(() => useCountdown(TARGET, { now: clock.now }))
    expect(result.current.status).toBe('counting')

    advance(clock, SECOND)
    expect(result.current.status).toBe('counting')

    advance(clock, SECOND)
    expect(result.current.status).toBe('completed')
    expect(result.current.remainingMs).toBe(0)
  })

  it('reports completion for an instant already past', () => {
    const clock = makeClock(TARGET_MS + DAY)
    const { result } = renderHook(() => useCountdown(TARGET, { now: clock.now }))
    expect(result.current.status).toBe('completed')
  })

  it('schedules nothing more once completed', () => {
    const clock = makeClock(TARGET_MS - SECOND)
    renderHook(() => useCountdown(TARGET, { now: clock.now }))
    advance(clock, SECOND)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reports pending for a target that is not yet known', () => {
    const clock = makeClock(TARGET_MS - DAY)
    const { result } = renderHook(() => useCountdown(PENDING, { now: clock.now }))
    expect(result.current.status).toBe('pending')
    expect(result.current.remainingMs).toBe(0)
  })

  it('schedules no timer while the target is unknown', () => {
    const clock = makeClock(TARGET_MS - DAY)
    renderHook(() => useCountdown(PENDING, { now: clock.now }))
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reports pending rather than throwing for an unparseable target', () => {
    const clock = makeClock(0)
    const { result } = renderHook(() => useCountdown('not-an-instant', { now: clock.now }))
    expect(result.current.status).toBe('pending')
  })

  it('leaves no timer behind on unmount', () => {
    const clock = makeClock(TARGET_MS - DAY)
    const { unmount } = renderHook(() => useCountdown(TARGET, { now: clock.now }))
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('resolves the same instant whatever the local timezone', () => {
    // Two clocks reading the same moment produce the same remaining time; the
    // target carries its own offset, so nothing here depends on where the guest
    // happens to be.
    const moment = TARGET_MS - 3 * HOUR
    const { result: first } = renderHook(() =>
      useCountdown(TARGET, { now: makeClock(moment).now }),
    )
    const { result: second } = renderHook(() =>
      useCountdown('2026-12-13T14:00:00Z', { now: makeClock(moment).now }),
    )
    expect(first.current.remainingMs).toBe(second.current.remainingMs)
  })
})
