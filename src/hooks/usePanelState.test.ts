import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePanelState } from './usePanelState'
import { panelSlots } from './usePanelSlot'

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void

let callbacks: ObserverCallback[] = []
let disconnects = 0

const ENTER_MS = 900
const EXIT_MS = 540

function ratio(value: number): IntersectionObserverEntry[] {
  return [{ intersectionRatio: value } as IntersectionObserverEntry]
}

/** Drives the observer for the most recently mounted panel. */
function observe(value: number) {
  act(() => {
    callbacks[callbacks.length - 1]?.(ratio(value))
  })
}

function settle(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function mountPanel() {
  const result = renderHook(() =>
    usePanelState<HTMLElement>({ enterDurationMs: ENTER_MS, exitDurationMs: EXIT_MS }),
  )
  // Attaching the element is what starts the observer.
  act(() => {
    result.result.current.ref(document.createElement('section'))
  })
  return result
}

beforeEach(() => {
  vi.useFakeTimers()
  callbacks = []
  disconnects = 0
  panelSlots.reset()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: ObserverCallback) {
        callbacks.push(callback)
      }
      observe() {}
      disconnect() {
        disconnects += 1
      }
      unobserve() {}
      takeRecords() {
        return []
      }
    },
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('panel lifecycle', () => {
  it('starts idle', () => {
    const { result } = mountPanel()
    expect(result.current.phase).toBe('idle')
  })

  it('runs the full cycle without skipping a phase', () => {
    const { result } = mountPanel()

    observe(0.6)
    expect(result.current.phase).toBe('entering')

    settle(ENTER_MS)
    expect(result.current.phase).toBe('entered')

    observe(0.05)
    expect(result.current.phase).toBe('exiting')

    settle(EXIT_MS)
    expect(result.current.phase).toBe('idle')
  })

  it('replays the entrance on every return', () => {
    const { result } = mountPanel()

    for (let pass = 0; pass < 3; pass += 1) {
      observe(0.6)
      expect(result.current.phase).toBe('entering')
      settle(ENTER_MS)
      observe(0.05)
      settle(EXIT_MS)
      expect(result.current.phase).toBe('idle')
    }
  })
})

describe('hysteresis', () => {
  it('does not react to ratios between the two thresholds', () => {
    const { result } = mountPanel()

    for (const value of [0.11, 0.2, 0.39, 0.25, 0.12, 0.38]) {
      observe(value)
      expect(result.current.phase).toBe('idle')
    }
  })

  it('does not flicker for a panel resting on the enter boundary', () => {
    const { result } = mountPanel()
    observe(0.6)
    settle(ENTER_MS)
    expect(result.current.phase).toBe('entered')

    // Nudged either side of the enter threshold, but never below the exit one.
    for (const value of [0.39, 0.41, 0.38, 0.42, 0.37]) {
      observe(value)
      settle(ENTER_MS)
      expect(result.current.phase).toBe('entered')
    }
  })
})

describe('mid-flight guard', () => {
  it('does not reverse a running entrance', () => {
    const { result } = mountPanel()
    observe(0.6)
    expect(result.current.phase).toBe('entering')

    observe(0.05)
    expect(result.current.phase).toBe('entering')

    settle(ENTER_MS)
    // The exit was stored, not applied, and runs once the entrance finished.
    expect(result.current.phase).toBe('exiting')
  })

  it('keeps at most one pending target however fast the scroll', () => {
    const { result } = mountPanel()
    observe(0.6)

    for (let i = 0; i < 10; i += 1) {
      observe(0.05)
      observe(0.6)
    }

    settle(ENTER_MS)
    // The last request was to enter, which it already is: nothing queued.
    expect(result.current.phase).toBe('entered')

    settle(ENTER_MS + EXIT_MS)
    expect(result.current.phase).toBe('entered')
  })

  it('settles correctly after a fast pass in and straight out', () => {
    const { result } = mountPanel()
    observe(0.6)
    observe(0.05)

    settle(ENTER_MS)
    settle(EXIT_MS)
    expect(result.current.phase).toBe('idle')
  })
})

describe('concurrency', () => {
  it('defers a third panel until a slot frees', () => {
    const first = mountPanel()
    const second = mountPanel()
    const third = mountPanel()

    act(() => callbacks[0]?.(ratio(0.6)))
    act(() => callbacks[1]?.(ratio(0.6)))
    act(() => callbacks[2]?.(ratio(0.6)))

    expect(first.result.current.phase).toBe('entering')
    expect(second.result.current.phase).toBe('entering')
    expect(third.result.current.phase).toBe('idle')

    settle(ENTER_MS)
    expect(third.result.current.phase).toBe('entering')
  })

  it('never lets more than two animate at once', () => {
    const panels = [mountPanel(), mountPanel(), mountPanel(), mountPanel()]
    panels.forEach((_, index) => act(() => callbacks[index]?.(ratio(0.6))))

    const animating = panels.filter((panel) =>
      ['entering', 'exiting'].includes(panel.result.current.phase),
    )
    expect(animating.length).toBeLessThanOrEqual(2)
  })
})

describe('cleanup', () => {
  it('disconnects its observer and frees its slot on unmount', () => {
    const { unmount } = mountPanel()
    observe(0.6)
    expect(panelSlots.inUse).toBe(1)

    unmount()
    expect(disconnects).toBeGreaterThan(0)
    expect(panelSlots.inUse).toBe(0)
  })
})
