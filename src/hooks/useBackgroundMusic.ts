import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Track } from '../data/types'

/**
 * The records playing behind the invitation.
 *
 * One `Audio` element for the whole site, owned here and handed to whatever
 * wants to start or stop it. The pages swap inside one React tree, so a single
 * element survives every navigation and the song does not restart when a guest
 * opens the details.
 *
 * Four things decide the behaviour, and the first three are browser facts
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
 */

/** Where the volume settles. Background music, not a performance. */
const VOLUME = 0.52

/** Fade length coming in, in milliseconds. */
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

/** Steps the fade is made of. Sixty a second is smooth and costs nothing. */
const FADE_TICK_MS = 1000 / 60

const STORAGE_KEY = 'wedding-invitation:music'

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
 * the running order and a wedding playlist is a sequence, not a jukebox.
 */
export function useBackgroundMusic(tracks: readonly Track[]): BackgroundMusic | null {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeRef = useRef<number | null>(null)
  /* Which press the element is answering. Pointing the element at a new file
     aborts the play() promise for the old one, and that rejection lands *after*
     the new press has already been accepted — so without a token the abort
     from the record being skipped would switch the control off underneath the
     record being skipped to. Every press takes the next number; a promise that
     settles holding an old one has been overtaken and says nothing. */
  const pressRef = useRef(0)

  const clearFade = useCallback(() => {
    if (fadeRef.current !== null) {
      window.clearInterval(fadeRef.current)
      fadeRef.current = null
    }
  }, [])

  /** Ride the volume to a target over `ms`, and run `done` when it arrives. */
  const fadeTo = useCallback(
    (target: number, ms: number, done?: () => void) => {
      const audio = audioRef.current
      if (audio === null) return
      clearFade()
      const step = ((target - audio.volume) * FADE_TICK_MS) / ms
      fadeRef.current = window.setInterval(() => {
        const next = audio.volume + step
        if ((step > 0 && next >= target) || (step < 0 && next <= target) || step === 0) {
          audio.volume = target
          clearFade()
          done?.()
          return
        }
        audio.volume = next
      }, FADE_TICK_MS)
    },
    [clearFade],
  )

  /* The element is made on demand, inside the gesture that first asks for
     sound: an element created earlier would sit there having been blocked. */
  const ensureAudio = useCallback((): HTMLAudioElement | null => {
    if (typeof window === 'undefined') return null
    if (audioRef.current === null) {
      const audio = new Audio()
      audio.preload = 'none'
      audio.volume = 0
      audioRef.current = audio
    }
    return audioRef.current
  }, [])

  const play = useCallback(
    (at: number) => {
      const audio = ensureAudio()
      const track = tracks[at]
      if (audio === null || track === undefined) return
      /* Any fade still running belongs to the press before this one — most
         often a stop the guest changed their mind about. Its finishing move is
         to pause the element, which would silence the record this press is
         starting, so it is cancelled before anything else happens. */
      clearFade()
      const src = new URL(track.src, window.location.href).href
      if (audio.src !== src) {
        audio.src = src
        audio.load()
      }
      audio.volume = 0
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
          fadeTo(VOLUME, FADE_IN_MS)
        })
        .catch(() => {
          if (pressRef.current !== press) return
          /* Blocked, or the file is missing. Either way the page is silent and
             the control goes back to its stopped state, which is the truth. */
          setPlaying(false)
        })
    },
    [clearFade, ensureAudio, fadeTo, tracks],
  )

  const start = useCallback(() => {
    if (playing || !readPreference()) return
    writePreference(true)
    play(index)
  }, [index, play, playing])

  const stop = useCallback(() => {
    const audio = audioRef.current
    writePreference(false)
    /* Before the ramp, not after it: the tag stops printing "Now playing", the
       record stops turning and the switch reads as off within the frame of the
       press, while the sound itself takes FADE_OUT_MS to get out of the way. */
    setPlaying(false)
    /* Takes a number of its own, so a play() still in flight cannot come back
       and fade the volume up on a record the guest has just silenced. */
    pressRef.current += 1
    if (audio === null) return
    fadeTo(0, FADE_OUT_MS, () => {
      audio.pause()
    })
  }, [fadeTo])

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
    writePreference(true)
    play(at)
  }, [index, play, tracks.length])

  /* When a record runs out, the next one drops. The handler is re-bound as the
     index moves, which is what keeps the sleeve in step with the sound. */
  useEffect(() => {
    const audio = audioRef.current
    if (audio === null) return
    const onEnded = () => {
      const at = (index + 1) % tracks.length
      setIndex(at)
      play(at)
    }
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [index, play, playing, tracks.length])

  useEffect(
    () => () => {
      clearFade()
      audioRef.current?.pause()
    },
    [clearFade],
  )

  const current = tracks[index]

  return useMemo(() => {
    if (current === undefined) return null
    return { playing, current, start, stop, toggle, next }
  }, [current, next, playing, start, stop, toggle])
}
