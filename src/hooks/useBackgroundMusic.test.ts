import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBackgroundMusic } from './useBackgroundMusic'
import type { Track } from '../data/types'

/**
 * jsdom has no media stack, so `Audio` is stood in for. The stub records what
 * the hook asked of it, which is the whole of what these tests check: the hook
 * decides when to play, what to play and how loud, and the browser does the
 * rest.
 *
 * The hook works two elements so one record can come up under the tail of the
 * one before it, so the stub also carries a clock — `currentTime`, `duration`
 * and a `tick()` that plays a record up to a moment — which is what tells the
 * hook the tail has been reached.
 */
class FakeAudio {
  static made: FakeAudio[] = []
  /** iPhones ignore an assignment to `volume` and always read back 1. */
  static volumeLocked = false
  src = ''
  preload = ''
  paused = true
  currentTime = 0
  duration = 30
  loads = 0
  plays = 0
  private listeners = new Map<string, Set<() => void>>()
  private level = 1

  constructor() {
    FakeAudio.made.push(this)
  }

  get volume(): number {
    return FakeAudio.volumeLocked ? 1 : this.level
  }

  set volume(level: number) {
    if (FakeAudio.volumeLocked) return
    this.level = level
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

  private emit(type: string) {
    for (const fn of [...(this.listeners.get(type) ?? [])]) fn()
  }

  /** Run the needle to `at` seconds, as playback does. */
  tick(at: number) {
    this.currentTime = at
    this.emit('timeupdate')
  }

  /** Run a track out, as the browser does when the file ends. */
  end() {
    this.currentTime = this.duration
    this.emit('ended')
  }
}

/** Just enough Web Audio for the route a locked-down phone is given. */
class FakeGain {
  gain = { value: 0 }
  connect() {}
}

class FakeContext {
  static made: FakeContext[] = []
  destination = {}
  gains: FakeGain[] = []
  resumes = 0

  constructor() {
    FakeContext.made.push(this)
  }

  createGain() {
    const gain = new FakeGain()
    this.gains.push(gain)
    return gain
  }

  createMediaElementSource() {
    return { connect: (to: FakeGain) => to }
  }

  resume() {
    this.resumes += 1
    return Promise.resolve()
  }
}

/** The gain node the hook is riding for a deck, in creation order. */
function gain(n: 0 | 1): FakeGain {
  const made = FakeContext.made[0]?.gains[n]
  if (made === undefined) throw new Error(`the hook made no gain for deck ${n}`)
  return made
}

const TRACKS: Track[] = [
  { title: 'First', artist: 'A', src: '/audio/first.m4a' },
  { title: 'Second', artist: 'B', src: '/audio/second.m4a' },
]

/** The elements in the order the hook made them: deck 0, then its spare. */
function deck(n: 0 | 1): FakeAudio {
  const made = FakeAudio.made[n]
  if (made === undefined) throw new Error(`the hook made no deck ${n}`)
  return made
}

/** The last element the hook made, whichever deck that is. */
function element(): FakeAudio {
  const last = FakeAudio.made.at(-1)
  if (last === undefined) throw new Error('the hook made no audio element')
  return last
}

/** Let the play() promise settle and a fade in or out finish. */
async function settle() {
  await act(async () => {
    await Promise.resolve()
    vi.advanceTimersByTime(2000)
  })
}

/** The same, long enough for a whole hand-over to have crossed over. */
async function settleHandover() {
  await act(async () => {
    await Promise.resolve()
    vi.advanceTimersByTime(4000)
  })
}

beforeEach(() => {
  FakeAudio.made = []
  FakeAudio.volumeLocked = false
  FakeContext.made = []
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

    expect(deck(0).src).toContain('/audio/first.m4a')
    expect(deck(0).plays).toBe(1)
    expect(result.current?.playing).toBe(true)
    // Background music, and never at full volume.
    expect(deck(0).volume).toBeGreaterThan(0)
    expect(deck(0).volume).toBeLessThan(1)
  })

  it('wakes the spare deck inside the same gesture, and leaves it silent', async () => {
    /* Safari lets an element play for the first time only in answer to a
       gesture, and the hand-over is on a timer — so the spare is started and
       stopped here, while the finger is still down. */
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    expect(FakeAudio.made).toHaveLength(2)
    expect(deck(1).plays).toBe(1)
    expect(deck(1).paused).toBe(true)
    expect(deck(1).volume).toBe(0)
    expect(deck(1).src).toContain('/audio/second.m4a')
  })

  it('plays the records in the order they are listed, not shuffled', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    expect(result.current?.current.title).toBe('First')

    act(() => result.current?.start())
    await settle()
    expect(deck(0).src).toContain('/audio/first.m4a')

    act(() => deck(0).end())
    await settle()
    expect(result.current?.current.title).toBe('Second')
    expect(deck(1).src).toContain('/audio/second.m4a')
  })

  it('brings the next record up under the tail of the one ending', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    // Two seconds from the end of a thirty-second cut: inside the overlap.
    act(() => deck(0).tick(28))
    await act(async () => {
      await Promise.resolve()
      vi.advanceTimersByTime(1300)
    })

    // Both sounding, one going down and one coming up.
    expect(deck(0).paused).toBe(false)
    expect(deck(1).paused).toBe(false)
    expect(deck(0).volume).toBeGreaterThan(0)
    expect(deck(1).volume).toBeGreaterThan(0)

    await settleHandover()
    expect(deck(0).paused).toBe(true)
    expect(deck(1).volume).toBeGreaterThan(0)
    expect(result.current?.current.title).toBe('Second')
  })

  it('hands over once, however many times the tail is reported', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    act(() => {
      deck(0).tick(28)
      deck(0).tick(29)
      deck(0).tick(29.5)
    })
    await settleHandover()

    // One start on the spare, not three. (The first is the waking play.)
    expect(deck(1).plays).toBe(2)
    expect(result.current?.current.title).toBe('Second')
  })

  it('does not hand over in the opening moments of a record', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    // A file whose duration the browser has not worked out, and one so short
    // that every moment of it is inside the overlap.
    act(() => {
      deck(0).duration = Number.NaN
      deck(0).tick(0.2)
      deck(0).duration = 1
      deck(0).tick(0.3)
    })
    await settleHandover()

    expect(result.current?.current.title).toBe('First')
  })

  it('plays a short record twice before the sleeve moves on', async () => {
    const short: Track[] = [
      { title: 'Short', artist: 'A', src: '/audio/short.m4a', plays: 2 },
      { title: 'Next', artist: 'B', src: '/audio/next.m4a' },
    ]
    const { result } = renderHook(() => useBackgroundMusic(short))
    act(() => result.current?.start())
    await settle()

    // The spare is armed with the same record, not the one after it.
    expect(deck(1).src).toContain('/audio/short.m4a')

    act(() => deck(0).tick(28))
    await settleHandover()
    // Second pass, still the same record and still the same name on the tag.
    expect(deck(1).src).toContain('/audio/short.m4a')
    expect(result.current?.current.title).toBe('Short')

    act(() => deck(1).tick(28))
    await settleHandover()
    expect(result.current?.current.title).toBe('Next')
    expect(deck(0).src).toContain('/audio/next.m4a')
  })

  it('falls back to the deck already sounding if the spare is refused', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    // Safari, having decided the spare was never woken by a gesture.
    vi.spyOn(deck(1), 'play').mockRejectedValue(new Error('NotAllowedError'))
    act(() => deck(0).tick(28))
    await settleHandover()
    // A second turn of the crank: the fallback is a press behind, because it
    // only starts once the spare's refusal has landed.
    await settle()

    expect(result.current?.playing).toBe(true)
    expect(result.current?.current.title).toBe('Second')
    expect(deck(0).paused).toBe(false)
    expect(deck(0).src).toContain('/audio/second.m4a')
    expect(deck(0).volume).toBeGreaterThan(0)
  })

  it('rides a gain node where the element will not take a level', async () => {
    /* An iPhone: `volume` is the hardware buttons' business, so the fades are
       made on a Web Audio gain node instead. */
    FakeAudio.volumeLocked = true
    vi.stubGlobal('AudioContext', FakeContext)

    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    expect(gain(0).gain.value).toBeGreaterThan(0)
    expect(gain(0).gain.value).toBeLessThan(1)
    expect(deck(0).paused).toBe(false)

    act(() => result.current?.stop())
    act(() => vi.advanceTimersByTime(250))

    expect(deck(0).paused).toBe(true)
    expect(gain(0).gain.value).toBe(0)
  })

  it('still stops on a phone with neither a writable volume nor Web Audio', async () => {
    /* The fade cannot be heard, so it is not pretended at — but the press has
       to silence the music, which is the whole of what a pause is for. */
    FakeAudio.volumeLocked = true

    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()
    expect(deck(0).paused).toBe(false)

    act(() => result.current?.stop())
    act(() => vi.advanceTimersByTime(250))

    expect(deck(0).paused).toBe(true)
    expect(deck(1).paused).toBe(true)
    expect(result.current?.playing).toBe(false)
  })

  it('pauses a record that was still buffering when the guest pressed stop', async () => {
    const inFlight: (() => void)[] = []
    vi.spyOn(FakeAudio.prototype, 'play').mockImplementation(function (this: FakeAudio) {
      this.paused = false
      return new Promise<void>((resolve) => inFlight.push(resolve))
    })

    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    act(() => result.current?.stop())

    await act(async () => {
      for (const resolve of inFlight) resolve()
      await Promise.resolve()
      vi.advanceTimersByTime(2000)
    })

    expect(deck(0).paused).toBe(true)
    expect(result.current?.playing).toBe(false)
  })

  it('says it is playing within the press, before the file has answered', () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    // No `settle()`: this is the state the guest sees in the frame of the tap.
    act(() => result.current?.toggle())
    expect(result.current?.playing).toBe(true)
  })

  it('says it has stopped within the press, before the sound has gone', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    act(() => result.current?.toggle())
    // Again no `settle()`: the switch reads as off while the ramp is still
    // running, which is the whole point of the ramp being short.
    expect(result.current?.playing).toBe(false)
  })

  it('is out of the way in well under a quarter of a second', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    act(() => result.current?.stop())
    act(() => vi.advanceTimersByTime(250))

    expect(deck(0).paused).toBe(true)
    expect(deck(0).volume).toBe(0)
  })

  it('silences both decks when a stop lands mid hand-over', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()
    act(() => deck(0).tick(28))
    await act(async () => {
      await Promise.resolve()
      vi.advanceTimersByTime(600)
    })

    act(() => result.current?.stop())
    act(() => vi.advanceTimersByTime(250))

    expect(deck(0).paused).toBe(true)
    expect(deck(1).paused).toBe(true)
  })

  it('does not let a stop already under way silence a guest who changed their mind', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    act(() => result.current?.stop())
    // Pressed again mid-ramp, before the element has been paused.
    act(() => result.current?.toggle())
    await settle()

    expect(result.current?.playing).toBe(true)
    expect(deck(0).paused).toBe(false)
    expect(deck(0).volume).toBeGreaterThan(0)
  })

  it('ignores a play that the press after it aborted', async () => {
    /* Pointing an element at a new file rejects the promise from the old one,
       and that rejection arrives after the new press has been accepted. A real
       WebKit does exactly this on every skip. */
    const inFlight: { resolve: () => void; reject: () => void }[] = []
    vi.spyOn(FakeAudio.prototype, 'play').mockImplementation(function (this: FakeAudio) {
      this.paused = false
      return new Promise<void>((resolve, reject) => {
        inFlight.push({ resolve, reject: () => reject(new Error('AbortError')) })
      })
    })

    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()
    act(() => result.current?.next())

    await act(async () => {
      // [0] is the first record, [1] the waking of the spare, [2] the skip.
      inFlight[0]?.reject()
      inFlight[2]?.resolve()
      await Promise.resolve()
    })
    await settle()

    expect(result.current?.playing).toBe(true)
    expect(result.current?.current.title).toBe('Second')
  })

  it('drops the next record when one runs out', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()
    const first = result.current?.current.title

    act(() => deck(0).end())
    await settle()

    expect(result.current?.current.title).not.toBe(first)
    expect(deck(1).paused).toBe(false)
    expect(deck(1).volume).toBeGreaterThan(0)
  })

  it('comes back round to the first record at the end of the sleeve', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()
    const first = result.current?.current.title

    for (let i = 0; i < TRACKS.length; i += 1) {
      act(() => {
        const sounding = FakeAudio.made.find((made) => !made.paused)
        sounding?.end()
      })
      await settleHandover()
    }

    expect(result.current?.current.title).toBe(first)
  })

  it('stops when asked, and remembers that the guest wanted silence', async () => {
    const { result } = renderHook(() => useBackgroundMusic(TRACKS))
    act(() => result.current?.start())
    await settle()

    act(() => result.current?.stop())
    await settle()

    expect(deck(0).paused).toBe(true)
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
    expect(element().volume).toBe(0)
  })
})
