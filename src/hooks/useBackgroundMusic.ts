import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Track } from '../data/types'

/**
 * The records playing behind the invitation.
 *
 * Two `Audio` elements for the whole site, owned here and handed to whatever
 * wants to start or stop them. The pages swap inside one React tree, so the
 * elements survive every navigation and the song does not restart when a guest
 * opens the details.
 *
 * Five things decide the behaviour, and the first three are browser facts
 * rather than preferences:
 *
 *  - Sound cannot begin without a gesture. Every browser blocks it, so nothing
 *    here tries: the envelope's own "Tap to open" is the gesture, and a guest
 *    who arrives straight at an inner page gets silence until they ask.
 *  - Sound that begins at full volume on a wedding invitation is startling, so
 *    every start is faded in. The fade also covers the gap while the file
 *    buffers.
 *  - A guest who turns it off means it. The choice is kept in `localStorage`,
 *    so the envelope does not start the music again on their next visit.
 *  - Stopping is not a fade. A guest who presses pause wants silence now,
 *    usually because someone has walked into the room, so the way out is a
 *    ramp short enough to read as instant and long enough not to click.
 *  - One record never stops before the next has started. The cuts are short,
 *    and a short cut ends where the couple's editor cut it, not where the song
 *    finishes — so the tail is ridden down while the next head is brought up
 *    underneath it. That is why there are two elements: a crossfade needs both
 *    records sounding at once, and one element can only hold one file.
 */

/** Where the volume settles. Background music, not a performance. */
const VOLUME = 0.52

/** Fade length coming in from silence, in milliseconds. */
const FADE_IN_MS = 1400

/**
 * Fade length going out, in milliseconds.
 *
 * Short enough that a guest hears the press and the silence as one event —
 * anything past about a quarter of a second reads as the button not having
 * worked — and long enough that the waveform is not cut mid-cycle, which is
 * what makes a hard stop click.
 */
const FADE_OUT_MS = 140

/**
 * The overlap where one record hands over to the next, in milliseconds.
 *
 * Long enough to hear as a mix rather than a cut, short enough that the two
 * records are never both recognisable at once.
 */
const CROSSFADE_MS = 2600

/** Steps a fade is made of. Sixty a second is smooth and costs nothing. */
const FADE_TICK_MS = 1000 / 60

/**
 * How far into a record the hand-over may start, in seconds.
 *
 * A guard against a file whose whole length is shorter than the crossfade, or
 * one whose duration the browser has not worked out yet: without it such a
 * record would hand over in its first frames and take the rest of the sleeve
 * down with it.
 */
const EARLIEST_HANDOVER_S = 0.5

const STORAGE_KEY = 'wedding-invitation:music'

/** Which of the two elements is meant, everywhere below. */
type Deck = 0 | 1

/**
 * How the level is ridden up and down.
 *
 *  - `element`: `audio.volume`, which is what every desktop browser and
 *    Android does.
 *  - `gain`: a Web Audio gain node the decks are routed through, for a browser
 *    whose `volume` cannot be written — see `volumeIsWritable`.
 *  - `cut`: neither works, so a fade becomes a cut. Ugly, and never silent
 *    where it should be sounding or sounding where it should be silent.
 */
type Output = 'element' | 'gain' | 'cut'

/**
 * Whether this browser lets a script set the volume.
 *
 * iOS says no. On iPhone and iPad the volume belongs to the hardware buttons:
 * `volume` is read-only, an assignment is ignored, and a read always answers
 * 1. Anything that waits for the level it asked for to arrive — a fade that
 * ramps until it reaches its target, and pauses when it gets there — waits for
 * ever, which is why the music would not stop on a phone.
 */
function volumeIsWritable(audio: HTMLAudioElement): boolean {
  try {
    const was = audio.volume
    const probe = was > 0.5 ? 0.25 : 0.75
    audio.volume = probe
    const moved = audio.volume === probe
    audio.volume = was
    return moved
  } catch {
    return false
  }
}

function other(deck: Deck): Deck {
  return deck === 0 ? 1 : 0
}

/** Times through this record before the next one, never fewer than one. */
function passesOf(track: Track | undefined): number {
  return Math.max(1, Math.round(track?.plays ?? 1))
}

export interface BackgroundMusic {
  /** Whether a track is sounding now. */
  playing: boolean
  /** The track the needle is on, or the first one before anything has played. */
  current: Track
  /** Start playing, if the guest has not turned the music off. Safe to call
      from any gesture, and does nothing if something is already sounding. */
  start: () => void
  /** Stop, and remember that the guest wanted silence. */
  stop: () => void
  /** Start or stop, for a control that is one button. */
  toggle: () => void
  /** Skip to the next record in the sleeve. */
  next: () => void
}

function readPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    /* Private browsing, or storage turned off. Treat it as no preference. */
    return true
  }
}

function writePreference(wanted: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, wanted ? 'on' : 'off')
  } catch {
    /* Nothing to do: the choice simply will not outlive the visit. */
  }
}

/**
 * @param tracks The records, in the order the couple set them. They play down
 * the list and then round again; there is no shuffle, because the couple chose
 * the running order and a wedding playlist is a sequence, not a jukebox. A
 * track with `plays: 2` is heard twice before the list moves on.
 */
export function useBackgroundMusic(tracks: readonly Track[]): BackgroundMusic | null {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  /* The list and the index as the handlers see them. The hand-over happens on
     a media event rather than in a render, so it reads the refs: a listener
     bound once would otherwise hold whatever the values were when it was. */
  const tracksRef = useRef(tracks)
  const indexRef = useRef(0)

  const decksRef = useRef<(HTMLAudioElement | null)[]>([null, null])
  const activeRef = useRef<Deck>(0)
  const fadeRef = useRef<(number | null)[]>([null, null])
  /* Where each deck's level is, as this hook understands it. Kept here rather
     than read back off the element, because an element is allowed to ignore
     the level it was given and one of them does. */
  const levelRef = useRef([0, 0])
  const outputRef = useRef<Output | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<(GainNode | null)[]>([null, null])
  /* Set by a stop, cleared by a start. A play() that was still in flight when
     the guest pressed pause resolves into a record nobody asked for, so it
     pauses itself on arrival. */
  const silenceRef = useRef(false)
  const wokenRef = useRef([false, false])
  /* Passes left on the record now sounding, counting the one in progress. */
  const passesRef = useRef(1)
  /* Set while a hand-over is under way, so the tail cannot ask for a second. */
  const handingRef = useRef(false)
  /* The record after the one sounding, which the freed deck is armed with. */
  const afterRef = useRef(0)
  /* Which press the elements are answering. Pointing an element at a new file
     aborts the play() promise for the old one, and that rejection lands *after*
     the new press has already been accepted — so without a token the abort
     from the record being skipped would switch the control off underneath the
     record being skipped to. Every press takes the next number; a promise that
     settles holding an old one has been overtaken and says nothing. */
  const pressRef = useRef(0)

  const clearFade = useCallback((deck: Deck) => {
    const id = fadeRef.current[deck]
    if (id !== undefined && id !== null) {
      window.clearInterval(id)
      fadeRef.current[deck] = null
    }
  }, [])

  /** Put one deck's level where it is asked for, by whatever route works. */
  const setLevel = useCallback((deck: Deck, level: number) => {
    levelRef.current[deck] = level
    const gain = gainRef.current[deck]
    if (gain !== null && gain !== undefined) {
      gain.gain.value = level
      return
    }
    const audio = decksRef.current[deck]
    if (audio === null || audio === undefined) return
    try {
      audio.volume = level
    } catch {
      /* Read-only, and there is no gain node to fall back on. */
    }
  }, [])

  /**
   * Ride one deck's level to a target over `ms`, and run `done` on arrival.
   *
   * The ramp is driven by the clock and by this hook's own record of where the
   * level is, never by reading the level back off the element. An element that
   * ignores what it is given would otherwise never be seen to arrive, and
   * `done` — which is where a deck is paused — would never run.
   */
  const fadeTo = useCallback(
    (deck: Deck, target: number, ms: number, done?: () => void) => {
      clearFade(deck)
      const from = levelRef.current[deck] ?? 0
      if (outputRef.current === 'cut' || ms <= 0) {
        /* Nothing can be heard to move, so the move is made at once rather
           than pretended at for two and a half seconds. */
        setLevel(deck, target)
        done?.()
        return
      }
      const started = Date.now()
      fadeRef.current[deck] = window.setInterval(() => {
        const through = Math.min(1, (Date.now() - started) / ms)
        setLevel(deck, from + (target - from) * through)
        if (through >= 1) {
          clearFade(deck)
          done?.()
        }
      }, FADE_TICK_MS)
    },
    [clearFade, setLevel],
  )

  /* The hand-over runs from a media event, and the functions it needs are
     rebuilt every render, so it reaches them through a ref rather than being
     re-bound to the elements each time. */
  const handOverRef = useRef<(overlapMs: number) => void>(() => {})

  /* An element is made on demand, inside the gesture that first asks for
     sound: an element created earlier would sit there having been blocked. */
  const ensureDeck = useCallback((deck: Deck): HTMLAudioElement | null => {
    if (typeof window === 'undefined') return null
    let audio = decksRef.current[deck] ?? null
    if (audio === null) {
      audio = new Audio()
      /* The deck that is sounding streams as it plays; the one being armed for
         the hand-over has to have its head buffered before the overlap starts,
         and `load()` is what asks for that. Nothing is fetched until a deck is
         pointed at a file, which does not happen before the first press. */
      audio.preload = 'auto'
      /* The first deck settles how every deck's level will be ridden. */
      if (outputRef.current === null) {
        outputRef.current = volumeIsWritable(audio) ? 'element' : 'gain'
      }
      if (outputRef.current === 'gain') {
        /* iOS. The level cannot be set on the element, so the decks are routed
           through gain nodes, which can. The context is made inside the
           gesture that asked for sound, so it starts out allowed to run. */
        try {
          const Context: typeof AudioContext | undefined =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          if (Context === undefined) throw new Error('no Web Audio')
          const context = contextRef.current ?? new Context()
          contextRef.current = context
          const gain = context.createGain()
          gain.gain.value = 0
          context.createMediaElementSource(audio).connect(gain)
          gain.connect(context.destination)
          gainRef.current[deck] = gain
        } catch {
          /* No Web Audio either: fades become cuts, but a stop still stops. */
          outputRef.current = 'cut'
        }
      }
      setLevel(deck, 0)
      audio.addEventListener('timeupdate', () => {
        if (decksRef.current[activeRef.current] !== audio) return
        if (handingRef.current) return
        const { currentTime, duration } = audio as HTMLAudioElement
        if (!Number.isFinite(duration) || duration <= 0) return
        if (currentTime < EARLIEST_HANDOVER_S) return
        if (duration - currentTime > CROSSFADE_MS / 1000) return
        handOverRef.current(CROSSFADE_MS)
      })
      audio.addEventListener('ended', () => {
        /* Only the record on the air decides what follows it. A tail that is
           already being faded out has handed over and has nothing to say. */
        if (decksRef.current[activeRef.current] !== audio) return
        /* No tail left to mix under, so the next head comes up from silence. */
        handOverRef.current(FADE_IN_MS)
      })
      decksRef.current[deck] = audio
    }
    return audio
  }, [setLevel])

  /** Point a silent deck at the record it will have to bring in, and let the
      browser buffer its head before the overlap starts. */
  const arm = useCallback(
    (deck: Deck, at: number) => {
      const audio = ensureDeck(deck)
      const track = tracksRef.current[at]
      if (audio === null || track === undefined) return
      const src = new URL(track.src, window.location.href).href
      if (audio.src !== src) {
        audio.src = src
        audio.load()
      }
    },
    [ensureDeck],
  )

  /** Put a record on one deck and bring it up over `fadeMs` from silence. */
  const startOn = useCallback(
    (deck: Deck, at: number, fadeMs: number, onRefused?: () => void) => {
      const audio = ensureDeck(deck)
      const track = tracksRef.current[at]
      if (audio === null || track === undefined) return
      /* Any fade still running on this deck belongs to the press before this
         one — most often a stop the guest changed their mind about. Its
         finishing move is to pause the element, which would silence the record
         this press is starting, so it is cancelled before anything else. */
      clearFade(deck)
      const src = new URL(track.src, window.location.href).href
      if (audio.src !== src) {
        audio.src = src
        audio.load()
      }
      try {
        /* A deck that has been woken, or played this record before, is not at
           the top of the file. */
        audio.currentTime = 0
      } catch {
        /* Nothing is loaded yet, so it is already at the top. */
      }
      setLevel(deck, 0)
      silenceRef.current = false
      wokenRef.current[deck] = true
      activeRef.current = deck
      handingRef.current = false
      /* The control turns on now, not when the file has buffered: the press is
         what the guest is watching, and a switch that waits for the network to
         agree reads as a switch that did not work. `catch` puts it back. */
      setPlaying(true)
      const press = (pressRef.current += 1)
      /* `play()` returns a promise in every browser, and nothing at all under
         jsdom and in engines old enough to predate the promise. Wrapping it
         means the failure path is the same shape either way. */
      void Promise.resolve(audio.play())
        .then(() => {
          if (pressRef.current !== press) return
          if (silenceRef.current) {
            /* The guest pressed pause while this was still buffering. */
            audio.pause()
            return
          }
          fadeTo(deck, VOLUME, fadeMs)
        })
        .catch(() => {
          if (pressRef.current !== press) return
          /* Blocked, or the file is missing. Either way this deck is silent. */
          if (onRefused !== undefined) {
            onRefused()
            return
          }
          /* The control goes back to its stopped state, which is the truth. */
          setPlaying(false)
        })
    },
    [clearFade, ensureDeck, fadeTo, setLevel],
  )

  /**
   * Wake the spare deck while a finger is still on the glass.
   *
   * Safari lets an element play for the first time only in answer to a
   * gesture, and the hand-over happens seconds later on a media event. So the
   * spare is started and stopped here, inside the press that started the
   * music, which is enough to make it playable later — and it arrives at the
   * hand-over with its head already buffered.
   */
  const wake = useCallback(
    (deck: Deck, at: number) => {
      if (wokenRef.current[deck]) return
      const audio = ensureDeck(deck)
      const track = tracksRef.current[at]
      if (audio === null || track === undefined) return
      wokenRef.current[deck] = true
      setLevel(deck, 0)
      const src = new URL(track.src, window.location.href).href
      if (audio.src !== src) {
        audio.src = src
        audio.load()
      }
      void Promise.resolve(audio.play())
        .then(() => {
          audio.pause()
          try {
            audio.currentTime = 0
          } catch {
            /* Not loaded far enough to seek; it will be sought when it starts. */
          }
        })
        .catch(() => {
          /* Refused. The hand-over falls back to the deck already sounding. */
          wokenRef.current[deck] = false
        })
    },
    [ensureDeck, setLevel],
  )

  /** Start a record on a press: from silence, on the deck that is free. */
  const play = useCallback(
    (at: number) => {
      /* A context made under an autoplay policy can start out suspended, and
         a press is the one moment it is allowed to be woken. */
      void contextRef.current?.resume()
      const deck = activeRef.current
      const spare = other(deck)
      /* Whatever the spare was doing belonged to the record being replaced. */
      clearFade(spare)
      decksRef.current[spare]?.pause()
      passesRef.current = passesOf(tracksRef.current[at])
      startOn(deck, at, FADE_IN_MS)
      afterRef.current = passesRef.current > 1 ? at : (at + 1) % tracksRef.current.length
      wake(spare, afterRef.current)
    },
    [clearFade, startOn, wake],
  )

  /**
   * Bring in whatever follows the record now sounding, under its tail.
   *
   * The next record is the same one again while the couple asked for another
   * pass, and the one below it in the list otherwise. The tail goes down over
   * the same `overlapMs` that the head comes up over, on the other deck, so
   * the two ramps cross in the middle and the sound never reaches silence.
   */
  const handOver = useCallback(
    (overlapMs: number) => {
      if (handingRef.current) return
      const list = tracksRef.current
      if (list.length === 0) return
      handingRef.current = true
      const from = activeRef.current
      const to = other(from)
      const again = passesRef.current > 1
      const at = again ? indexRef.current : (indexRef.current + 1) % list.length
      passesRef.current = again ? passesRef.current - 1 : passesOf(list[at])

      const outgoing = decksRef.current[from]
      if (outgoing !== null && outgoing !== undefined) {
        fadeTo(from, 0, overlapMs, () => {
          outgoing.pause()
          /* Freed, and now the spare: armed for the hand-over after this one,
             so its head is buffered long before it is needed. */
          arm(from, afterRef.current)
        })
      }
      if (!again) setIndex(at)
      indexRef.current = at

      startOn(to, at, overlapMs, () => {
        /* The spare deck refused — Safari, most likely, having decided it was
           never woken by a gesture. The deck that is already sounding has no
           such problem, so the record moves there instead and comes up from
           silence: a dip rather than a mix, but not a silence that stays. */
        wokenRef.current[to] = false
        startOn(from, at, FADE_IN_MS)
      })
      afterRef.current = passesRef.current > 1 ? at : (at + 1) % list.length
    },
    [arm, fadeTo, startOn],
  )

  /* Refs are written where a render cannot see them: after the render that
     changed them, and before any media event that reads them. */
  useEffect(() => {
    tracksRef.current = tracks
    indexRef.current = index
    handOverRef.current = handOver
  })

  const start = useCallback(() => {
    if (playing || !readPreference()) return
    writePreference(true)
    play(index)
  }, [index, play, playing])

  const stop = useCallback(() => {
    writePreference(false)
    /* Before the ramp, not after it: the tag stops printing "Now playing", the
       record stops turning and the switch reads as off within the frame of the
       press, while the sound itself takes FADE_OUT_MS to get out of the way. */
    setPlaying(false)
    /* Takes a number of its own, so a play() still in flight cannot come back
       and fade the volume up on a record the guest has just silenced. */
    pressRef.current += 1
    handingRef.current = true
    /* Anything still buffering pauses itself the moment it arrives. */
    silenceRef.current = true
    for (const deck of [0, 1] as Deck[]) {
      const audio = decksRef.current[deck]
      if (audio === null || audio === undefined) continue
      if (audio.paused) {
        clearFade(deck)
        setLevel(deck, 0)
        continue
      }
      fadeTo(deck, 0, FADE_OUT_MS, () => audio.pause())
    }
  }, [clearFade, fadeTo, setLevel])

  const toggle = useCallback(() => {
    if (playing) {
      stop()
      return
    }
    /* An explicit press overrules a remembered "off": the guest is asking. */
    writePreference(true)
    play(index)
  }, [index, play, playing, stop])

  const next = useCallback(() => {
    const at = (index + 1) % tracks.length
    setIndex(at)
    indexRef.current = at
    writePreference(true)
    play(at)
  }, [index, play, tracks.length])

  useEffect(
    () => () => {
      for (const deck of [0, 1] as Deck[]) {
        clearFade(deck)
        decksRef.current[deck]?.pause()
      }
    },
    [clearFade],
  )

  const current = tracks[index]

  return useMemo(() => {
    if (current === undefined) return null
    return { playing, current, start, stop, toggle, next }
  }, [current, next, playing, start, stop, toggle])
}
