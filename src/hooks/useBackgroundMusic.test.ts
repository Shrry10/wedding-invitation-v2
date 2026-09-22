import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBackgroundMusic } from './useBackgroundMusic'
import type { Track } from '../data/types'

/**
 * jsdom has no media stack, so `Audio` is stood in for. The stub records what
 * the hook asked of it, which is the whole of what these tests check: the hook
 * decides when to play, what to play and how loud, and the browser does the
 * rest.
 */
class FakeAudio {
  static made: FakeAudio[] = []
  src = ''
  volume = 1
  preload = ''
  paused = true
  loads = 0
  plays = 0
  private listeners = new Map<string, Set<() => void>>()

  constructor() {
    FakeAudio.made.push(this)
  }

  load() {
    this.loads += 1
  }

  play(): Promise<void> {
    this.plays += 1
    this.paused = false
    return Promise.resolve()
  }

  pause() {
    this.paused = true
  }

  addEventListener(type: string, fn: () => void) {
    const set = this.listeners.get(type) ?? new Set()
    set.add(fn)
    this.listeners.set(type, set)
  }

  removeEventListener(type: string, fn: () => void) {
    this.listeners.get(type)?.delete(fn)
  }

  /** Run a track out, as the browser does when the file ends. */
  end() {
    for (const fn of this.listeners.get('ended') ?? []) fn()
  }
}

const TRACKS: Track[] = [
  { title: 'First', artist: 'A', src: '/audio/first.m4a' },
  { title: 'Second', artist: 'B', src: '/audio/second.m4a' },
]

/** The last element the hook made, which is the one it is playing through. */
function element(): FakeAudio {
  const last = FakeAudio.made.at(-1)
  if (last === undefined) throw new Error('the hook made no audio element')
  return last
}

/** Let the play() promise settle and the fade finish. */
async function settle() {
  await act(async () => {
    await Promise.resolve()
    vi.advanceTimersByTime(2000)
  })
}

beforeEach(() => {
  FakeAudio.made = []
  vi.stubGlobal('Audio', FakeAudio)
  vi.useFakeTimers()
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useBackgroundMusic', () => {
  it('has nothing to offer when no records are listed', () => {
    const { result } = renderHook(() => useBackgroundMusic([]))
    expect(result.current).toBeNull()
  })

  it('makes no audio element until something asks for sound', () => {
    renderHook(() => useBackgroundMusic(TRACKS))
    expect(FakeAudio.made).toHaveLength(0)
  })

  it('plays the first record on the opening gesture, faded in', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    expect(element().src).toContain('/audio/')
    expect(element().plays).toBe(1)
    expect(result.current?.playing).toBe(true)
    // Background music, and never at full volume.
    expect(element().volume).toBeGreaterThan(0)
    expect(element().volume).toBeLessThan(1)
  })

  it('plays the records in the order they are listed, not shuffled', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    expect(result.current?.current.title).toBe('First')

    act(() => result.current?.start())
    await settle()
    expect(element().src).toContain('/audio/first.m4a')

    act(() => element().end())
    await settle()
    expect(result.current?.current.title).toBe('Second')
    expect(element().src).toContain('/audio/second.m4a')
  })

  it('drops the next record when one runs out', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()
    const first = result.current?.current.title

    act(() => element().end())
    await settle()

    expect(result.current?.current.title).not.toBe(first)
    expect(element().plays).toBe(2)
  })

  it('comes back round to the first record at the end of the sleeve', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()
    const first = result.current?.current.title

    for (let i = 0; i < TRACKS.length; i += 1) {
      act(() => element().end())
      await settle()
    }

    expect(result.current?.current.title).toBe(first)
  })

  it('stops when asked, and remembers that the guest wanted silence', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    act(() => result.current?.stop())
    await settle()

    expect(element().paused).toBe(true)
    expect(result.current?.playing).toBe(false)
    expect(window.localStorage.getItem('wedding-invitation:music')).toBe('off')
  })

  it('does not start itself again for a guest who turned it off', async () => {
    window.localStorage.setItem('wedding-invitation:music', 'off')
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))

    act(() => result.current?.start())
    await settle()

    expect(FakeAudio.made).toHaveLength(0)
    expect(result.current?.playing).toBe(false)
  })

  it('still plays for that guest when they press the control themselves', async () => {
    window.localStorage.setItem('wedding-invitation:music', 'off')
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))

    act(() => result.current?.toggle())
    await settle()

    expect(result.current?.playing).toBe(true)
    expect(window.localStorage.getItem('wedding-invitation:music')).toBe('on')
  })

  it('stays silent, and says so, when the browser refuses to play', async () => {
    vi.spyOn(FakeAudio.prototype, 'play').mockRejectedValue(new Error('blocked'))
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))

    act(() => result.current?.start())
    await settle()

    expect(result.current?.playing).toBe(false)
  })
})
