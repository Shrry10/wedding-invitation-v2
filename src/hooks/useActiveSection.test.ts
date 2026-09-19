import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useActiveSection } from './useActiveSection'

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void

let capturedCallback: ObserverCallback | undefined
let observed: Element[] = []
let disconnected = false

function entryFor(id: string, height: number): IntersectionObserverEntry {
  return {
    target: { id } as Element,
    intersectionRect: { height } as DOMRectReadOnly,
  } as IntersectionObserverEntry
}

beforeEach(() => {
  capturedCallback = undefined
  observed = []
  disconnected = false

  for (const id of ['story', 'events', 'gallery']) {
    const element = document.createElement('section')
    element.id = id
    document.body.append(element)
  }

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: ObserverCallback) {
        capturedCallback = callback
      }
      observe(element: Element) {
        observed.push(element)
      }
      disconnect() {
        disconnected = true
      }
      unobserve() {}
      takeRecords() {
        return []
      }
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

const SECTIONS = ['story', 'events', 'gallery']

describe('useActiveSection', () => {
  it('starts on the first section rather than on nothing', () => {
    const { result } = renderHook(() => useActiveSection(SECTIONS))
    expect(result.current).toBe('story')
  })

  it('observes every section it was given', () => {
    renderHook(() => useActiveSection(SECTIONS))
    expect(observed).toHaveLength(3)
  })

  it('selects the section occupying the most viewport', () => {
    const { result } = renderHook(() => useActiveSection(SECTIONS))
    act(() => {
      capturedCallback?.([entryFor('story', 100), entryFor('events', 620), entryFor('gallery', 0)])
    })
    expect(result.current).toBe('events')
  })

  it('moves the marker as the largest share changes', () => {
    const { result } = renderHook(() => useActiveSection(SECTIONS))
    act(() => capturedCallback?.([entryFor('story', 700), entryFor('events', 40)]))
    expect(result.current).toBe('story')

    act(() => capturedCallback?.([entryFor('story', 40), entryFor('events', 700)]))
    expect(result.current).toBe('events')
  })

  it('holds the previous section when nothing is visible', () => {
    const { result } = renderHook(() => useActiveSection(SECTIONS))
    act(() => capturedCallback?.([entryFor('events', 500)]))
    expect(result.current).toBe('events')

    act(() => capturedCallback?.([entryFor('events', 0)]))
    expect(result.current).toBe('events')
  })

  it('never reports more than one section', () => {
    const { result } = renderHook(() => useActiveSection(SECTIONS))
    act(() => {
      capturedCallback?.([entryFor('story', 300), entryFor('events', 300), entryFor('gallery', 300)])
    })
    expect(typeof result.current).toBe('string')
  })

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useActiveSection(SECTIONS))
    unmount()
    expect(disconnected).toBe(true)
  })
})
