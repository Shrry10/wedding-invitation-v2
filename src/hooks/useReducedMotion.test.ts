import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useReducedMotion } from './useReducedMotion'

type ChangeHandler = (event: MediaQueryListEvent) => void

function mockMatchMedia(initialMatches: boolean) {
  const handlers = new Set<ChangeHandler>()
  const query = {
    matches: initialMatches,
    addEventListener: (_: string, handler: ChangeHandler) => handlers.add(handler),
    removeEventListener: (_: string, handler: ChangeHandler) => handlers.delete(handler),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  )
  return {
    emit(matches: boolean) {
      query.matches = matches
      handlers.forEach((handler) => handler({ matches } as MediaQueryListEvent))
    },
    get listenerCount() {
      return handlers.size
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('useReducedMotion', () => {
  it('reports the preference when it is already set', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('reports no preference when it is not set', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('updates when the preference changes without a reload', () => {
    const media = mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    act(() => media.emit(true))
    expect(result.current).toBe(true)

    act(() => media.emit(false))
    expect(result.current).toBe(false)
  })

  it('removes its listener on unmount', () => {
    const media = mockMatchMedia(false)
    const { unmount } = renderHook(() => useReducedMotion())
    expect(media.listenerCount).toBe(1)
    unmount()
    expect(media.listenerCount).toBe(0)
  })
})
