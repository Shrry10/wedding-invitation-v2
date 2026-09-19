import { isPending } from '../lib/isPending'
import { paletteFor } from './eventPalettes'
import type { InvitationContent, PanelEntranceId, WeddingEvent } from './types'

export interface ValidationFailure {
  /** Dotted path to the offending field, e.g. `events[2].venueId`. */
  field: string
  message: string
}

type Check = (content: InvitationContent) => ValidationFailure[]

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const EXPLICIT_OFFSET_PATTERN = /(?:Z|[+-]\d{2}:\d{2})$/

function duplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}

/** Every reference between collections resolves to something real. */
const checkReferentialIntegrity: Check = (content) => {
  const failures: ValidationFailure[] = []
  const venueIds = new Set(content.venues.map((venue) => venue.id))
  const imageIds = new Set(content.gallery.map((image) => image.id))

  content.events.forEach((event, index) => {
    if (!venueIds.has(event.venueId)) {
      failures.push({
        field: `events[${index}].venueId`,
        message: `Event "${event.id}" references venue "${event.venueId}", which does not exist.`,
      })
    }
  })

  content.story.beats.forEach((beat, index) => {
    if (beat.imageId !== undefined && !imageIds.has(beat.imageId)) {
      failures.push({
        field: `story.beats[${index}].imageId`,
        message: `Story beat "${beat.id}" references image "${beat.imageId}", which does not exist.`,
      })
    }
  })

  if (content.hero.imageId !== undefined && !imageIds.has(content.hero.imageId)) {
    failures.push({
      field: 'hero.imageId',
      message: `Hero references image "${content.hero.imageId}", which does not exist. Omit it to use the authored composition.`,
    })
  }

  return failures
}

/** Identifiers are unique within their own collection. */
const checkIdentifierUniqueness: Check = (content) => {
  const collections: [string, string[]][] = [
    ['venues', content.venues.map((venue) => venue.id)],
    ['events', content.events.map((event) => event.id)],
    ['story.beats', content.story.beats.map((beat) => beat.id)],
    ['gallery', content.gallery.map((image) => image.id)],
  ]

  return collections.flatMap(([name, ids]) =>
    duplicates(ids).map((id) => ({
      field: `${name}`,
      message: `Identifier "${id}" is used more than once in ${name}.`,
    })),
  )
}

/**
 * Required collections and image descriptions.
 *
 * An empty gallery is explicitly allowed: it omits the section, which is a
 * supported configuration rather than a failure.
 */
const checkCollectionsAndAltText: Check = (content) => {
  const failures: ValidationFailure[] = []

  if (content.events.length === 0) {
    failures.push({ field: 'events', message: 'At least one event is required.' })
  }

  content.gallery.forEach((image, index) => {
    if (image.alt.trim().length < 3) {
      failures.push({
        field: `gallery[${index}].alt`,
        message: `Image "${image.id}" needs descriptive alt text of at least three characters.`,
      })
    }
  })

  return failures
}

/** Dates are real calendar dates; times are well-formed. */
const checkDateAndTimeFormats: Check = (content) =>
  content.events.flatMap((event, index) => {
    const failures: ValidationFailure[] = []
    const [year, month, day] = event.date.split('-').map(Number)
    const parsed =
      year !== undefined && month !== undefined && day !== undefined
        ? new Date(Date.UTC(year, month - 1, day))
        : undefined

    const isRealDate =
      parsed !== undefined &&
      !Number.isNaN(parsed.getTime()) &&
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === (month as number) - 1 &&
      parsed.getUTCDate() === day

    if (!isRealDate) {
      failures.push({
        field: `events[${index}].date`,
        message: `Event "${event.id}" has date "${event.date}", which is not a real calendar date.`,
      })
    }

    if (!isPending(event.startTime) && !TIME_PATTERN.test(event.startTime)) {
      failures.push({
        field: `events[${index}].startTime`,
        message: `Event "${event.id}" has start time "${event.startTime}"; expected 24-hour HH:mm.`,
      })
    }

    if (event.endTime !== undefined && !TIME_PATTERN.test(event.endTime)) {
      failures.push({
        field: `events[${index}].endTime`,
        message: `Event "${event.id}" has end time "${event.endTime}"; expected 24-hour HH:mm.`,
      })
    }

    return failures
  })

/** An end time that precedes its start is a data error, not a late-night event. */
const checkEndFollowsStart: Check = (content) =>
  content.events.flatMap((event, index) => {
    if (event.endTime === undefined || isPending(event.startTime)) return []
    if (event.endTime > event.startTime) return []
    return [
      {
        field: `events[${index}].endTime`,
        message: `Event "${event.id}" ends at ${event.endTime}, which is not after its start of ${event.startTime}.`,
      },
    ]
  })

/** Map links are absolute and secure, or absent. */
const checkVenueMapUrls: Check = (content) =>
  content.venues.flatMap((venue, index) => {
    if (isPending(venue.mapsUrl)) return []
    let parsed: URL
    try {
      parsed = new URL(venue.mapsUrl)
    } catch {
      return [
        {
          field: `venues[${index}].mapsUrl`,
          message: `Venue "${venue.id}" has a map URL that is not absolute: "${venue.mapsUrl}".`,
        },
      ]
    }
    if (parsed.protocol !== 'https:') {
      return [
        {
          field: `venues[${index}].mapsUrl`,
          message: `Venue "${venue.id}" has a map URL using ${parsed.protocol}; HTTPS is required.`,
        },
      ]
    }
    return []
  })

/**
 * The countdown target must carry an explicit UTC offset.
 *
 * A floating local time is the defect most likely to reach production: it looks
 * correct on the machine that wrote it and is wrong for every guest in another
 * timezone. It is cheaper to refuse it here than to discover it after the link
 * has gone out.
 */
const checkCountdownOffset: Check = (content) => {
  const target = content.countdown.targetInstant
  if (isPending(target)) return []

  if (!EXPLICIT_OFFSET_PATTERN.test(target)) {
    return [
      {
        field: 'countdown.targetInstant',
        message: `Countdown target "${target}" has no explicit UTC offset. Without one it resolves to a different moment in every timezone. Use a trailing Z or +HH:mm.`,
      },
    ]
  }

  if (Number.isNaN(new Date(target).getTime())) {
    return [
      {
        field: 'countdown.targetInstant',
        message: `Countdown target "${target}" is not a parseable instant.`,
      },
    ]
  }

  return []
}

/**
 * Every event declares a signature, and no signature is claimed twice.
 *
 * Uniqueness is the point: a signature shared between two functions is not a
 * signature.
 */
const checkSignatureAssignment: Check = (content) => {
  const failures: ValidationFailure[] = []
  const claimed = new Map<PanelEntranceId, string[]>()

  content.events.forEach((event: WeddingEvent, index) => {
    if (event.signature === undefined) {
      failures.push({
        field: `events[${index}].signature`,
        message: `Event "${event.id}" does not declare a signature. Use "none" to opt out explicitly.`,
      })
      return
    }
    if (event.signature === 'none') return
    claimed.set(event.signature, [...(claimed.get(event.signature) ?? []), event.id])
  })

  for (const [signature, eventIds] of claimed) {
    if (eventIds.length > 1) {
      failures.push({
        field: 'events[].signature',
        message: `Signature "${signature}" is claimed by more than one event: ${eventIds.join(', ')}. Each signature belongs to exactly one function.`,
      })
    }
  }

  return failures
}

/** The one signature that needs authored artwork must have it on disk. */
const checkSignatureAssets =
  (assetExists: (relativePath: string) => boolean): Check =>
  (content) => {
    const REQUIRED_HAND_ASSETS = [
      'src/components/artwork/entrances/handLeft.tsx',
      'src/components/artwork/entrances/handRight.tsx',
      'src/components/artwork/entrances/mehndiGarden.tsx',
    ]

    const usesHands = content.events.some((event) => event.signature === 'mehndi-hands')
    if (!usesHands) return []

    return REQUIRED_HAND_ASSETS.filter((path) => !assetExists(path)).map((path) => ({
      field: 'events[].signature',
      message: `An event claims the hand-opening signature but its artwork is missing: ${path}`,
    }))
  }

/** The hero counter and the wedding card must agree about when the wedding is. */
const checkCountdownMatchesWeddingEvent: Check = (content) => {
  const target = content.countdown.targetInstant
  if (isPending(target)) return []

  const wedding = content.events.find((event) => event.signature === 'mauli-knot')
  if (wedding === undefined || isPending(wedding.startTime)) return []

  const targetTime = new Date(target).getTime()
  if (Number.isNaN(targetTime)) return []

  const offsetMatch = /(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(target)
  if (offsetMatch === null) return []

  const offsetMinutes =
    offsetMatch[1] === undefined
      ? 0
      : (offsetMatch[1] === '-' ? -1 : 1) *
        (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3]))

  const [hours, minutes] = wedding.startTime.split(':').map(Number)
  const eventTime =
    new Date(`${wedding.date}T00:00:00Z`).getTime() +
    ((hours ?? 0) * 60 + (minutes ?? 0) - offsetMinutes) * 60_000

  if (eventTime !== targetTime) {
    return [
      {
        field: 'countdown.targetInstant',
        message: `Countdown target "${target}" does not match the wedding event (${wedding.date} at ${wedding.startTime}). The hero counter and the card would disagree.`,
      },
    ]
  }

  return []
}

/** Relative luminance of a `#rrggbb` colour, per WCAG. */
function relativeLuminance(hex: string): number {
  const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((pair) => {
    const value = Number.parseInt(pair, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return (
    0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0)
  )
}

function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first)
  const b = relativeLuminance(second)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Every panel's own ground and text must be readable together.
 *
 * Checked here rather than trusted, because a palette arriving later from the
 * client is exactly the kind of change that silently breaks contrast.
 */
const checkPaletteContrast =
  (resolveToken: (token: string) => string | undefined): Check =>
  (content) =>
    content.events.flatMap((event, index) => {
      const palette = paletteFor(event.palette)
      const ground = resolveToken(palette.ground)
      const text = resolveToken(palette.text)
      if (ground === undefined || text === undefined) {
        return [
          {
            field: `events[${index}].palette`,
            message: `Event "${event.id}" uses palette "${event.palette}", whose ground or text token does not resolve to a colour.`,
          },
        ]
      }
      const ratio = contrastRatio(ground, text)
      if (ratio < 4.5) {
        return [
          {
            field: `events[${index}].palette`,
            message: `Event "${event.id}" has panel text at ${ratio.toFixed(2)}:1 against its ground; at least 4.5:1 is required.`,
          },
        ]
      }
      return []
    })

/** Every stop on the journey needs an emblem, and no beat may carry a date nobody gave us. */
const checkStoryBeats: Check = (content) =>
  content.story.beats.flatMap((beat, index) => {
    const failures: ValidationFailure[] = []
    if (beat.emblem === undefined) {
      failures.push({
        field: `story.beats[${index}].emblem`,
        message: `Story beat "${beat.id}" declares no emblem.`,
      })
    }
    if (beat.year !== undefined && beat.year.trim() === '') {
      failures.push({
        field: `story.beats[${index}].year`,
        message: `Story beat "${beat.id}" has an empty year. Omit the field rather than leaving it blank — an invented date is worse than none.`,
      })
    }
    return failures
  })

/**
 * Runs every check and collects all failures.
 *
 * Deliberately does not stop at the first: a content file with three faults
 * should report three, so the whole set can be fixed in one pass.
 */
export function validateContent(
  content: InvitationContent,
  options: {
    assetExists?: (relativePath: string) => boolean
    /** Maps a `var(--token)` reference to its `#rrggbb` value. */
    resolveToken?: (token: string) => string | undefined
  } = {},
): ValidationFailure[] {
  const assetExists = options.assetExists ?? (() => true)
  const resolveToken = options.resolveToken ?? (() => undefined)

  const checks: Check[] = [
    checkReferentialIntegrity,
    checkIdentifierUniqueness,
    checkCollectionsAndAltText,
    checkDateAndTimeFormats,
    checkEndFollowsStart,
    checkVenueMapUrls,
    checkCountdownOffset,
    checkSignatureAssignment,
    checkSignatureAssets(assetExists),
    checkCountdownMatchesWeddingEvent,
    checkStoryBeats,
    ...(options.resolveToken === undefined ? [] : [checkPaletteContrast(resolveToken)]),
  ]

  return checks.flatMap((check) => check(content))
}

/** Formats failures for a build log. */
export function formatFailures(failures: ValidationFailure[]): string {
  return failures.map((failure) => `  ${failure.field}: ${failure.message}`).join('\n')
}
