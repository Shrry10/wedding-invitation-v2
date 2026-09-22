/**
 * The content contract.
 *
 * Declarations only — no values and no logic live in this file. Everything the
 * invitation renders is described here, so a field that does not appear in
 * these types cannot appear on the page.
 */

/** Calendar date, `YYYY-MM-DD`. */
export type ISODate = string

/** Wall-clock time at the venue, 24-hour `HH:mm`. */
export type ISOTime = string

/**
 * An instant carrying an **explicit** UTC offset, e.g.
 * `2026-12-13T19:30:00+05:30`.
 *
 * A floating local time is rejected at build time: it would resolve to a
 * different moment in every timezone, so the countdown would disagree between
 * two guests looking at the page side by side.
 */
export type ISOInstant = string

/**
 * The sentinel for a fact that is not yet known.
 *
 * A pending value is always rendered visibly. It is never hidden, never
 * defaulted, and never replaced with a guess.
 */
export const PENDING = 'TBD' as const
export type Pending = typeof PENDING

/** A value that may not be known yet. */
export type MaybePending<T> = T | Pending

export interface Venue {
  /** Stable slug, e.g. `suraj-palace`. */
  id: string
  name: MaybePending<string>
  /** One to four lines, rendered in order. */
  addressLines: MaybePending<string[]>
  city: MaybePending<string>
  /** Absolute HTTPS URL to a map, or pending. */
  mapsUrl: MaybePending<string>
  lat?: number
  lng?: number
}

/**
 * Which motion signature a card plays. Every event declares one; an event with
 * no signature of its own says so explicitly with `none`.
 *
 * Each identifier other than `none` may be claimed by at most one event —
 * uniqueness is what makes a signature a signature.
 */
export type PaletteId = 'mehndi' | 'haldi' | 'sangeet' | 'marriage' | 'plain'

export type PanelEntranceId =
  | 'mehndi-hands'
  | 'haldi-burst'
  | 'sangeet-lights'
  | 'mauli-knot'
  | 'none'

/**
 * A panel's own colour world.
 *
 * Every field is a CSS custom-property reference, never a literal — the values
 * live in the stylesheet so a palette change is one edit in one place.
 * `swatches` is what the panel shows the guest, in order.
 */
export interface EventPalette {
  ground: string
  text: string
  accents: string[]
  swatches: { label: string; token: string }[]
}

/**
 * The emblem drawn for a stop on the couple's journey.
 *
 * Six of the seven beats are places rather than dates, which is why the story
 * is built as a route rather than a timeline.
 */
export type PlaceEmblem =
  | 'college'
  | 'story'
  | 'flag'
  | 'hills'
  | 'skyline'
  | 'yacht'
  | 'market'
  | 'castle'
  | 'ring'
  | 'island'

export type MotifName = 'lotus' | 'knot' | 'kalash' | 'diya' | 'tree' | 'bell'

export interface WeddingEvent {
  /** Stable slug, e.g. `mehendi`. */
  id: string
  /** The traditional name — `Haldi` — shown beneath the title. */
  name: string
  /**
   * The name the function is presented under: `Touched by Turmeric`.
   *
   * Evocative rather than literal, so a guest who has never been to one still
   * gets a sense of the day, with `name` kept beneath it so a guest who knows
   * the ritual by its proper name still finds it.
   */
  title: string
  nameDevanagari?: string
  date: ISODate
  startTime: MaybePending<ISOTime>
  /** Omitted renders as an open-ended time. */
  endTime?: ISOTime
  /** Must resolve to a `Venue.id`. */
  venueId: string
  dressCode?: MaybePending<string>
  /** One short line, e.g. `Lunch will be served`. */
  note?: string
  motif: MotifName
  /**
   * Which colour world the panel wears.
   *
   * Separate from the entrance: a panel has its colours whether or not its
   * animation has been built, so the journey reads correctly from the start.
   */
  palette: PaletteId
  /** Required. Not optional — an event must state its choice. */
  signature: PanelEntranceId
  /**
   * One short line conveying the decor *theme*.
   *
   * Never the inventory: a guest wants to know how the evening will feel, not
   * how many chairs were hired.
   */
  decorNote?: MaybePending<string>
}

/**
 * The playlist the couple want playing.
 *
 * `url` is the provision: until there is one, the sleeve is drawn and says so
 * rather than offering a link to nowhere. Adding the songs later is one line in
 * the content file and no change to any page.
 */
export interface PlaylistConfig {
  heading: string
  /** The words under the heading when there is somewhere to send a guest. */
  cue: string
  /** Absolute HTTPS URL to the playlist, or pending. */
  url: MaybePending<string>
  /**
   * The records the site plays behind itself. An empty list is a site with no
   * sound and no control for it — nothing else has to change.
   */
  tracks: Track[]
}

/** One record in the sleeve. */
export interface Track {
  /** As it is printed on the sleeve while it plays. */
  title: string
  /** Who recorded it. */
  artist: string
  /** Path from the site root, served from `public/audio`. */
  src: string
  /**
   * Times through before the sleeve moves on. One unless the cut is too short
   * to hold a page on its own; the repeat crossfades into itself, so it is
   * heard as a longer record rather than as the same record twice.
   */
  plays?: number
}

export interface CountdownConfig {
  /** The wedding ceremony start, or pending. */
  targetInstant: MaybePending<ISOInstant>
  headingLabel: string
  /**
   * A word inside `headingLabel` to set apart, e.g. `yes`. Its last
   * occurrence is rendered in the script face; omit it for a plain line.
   */
  headingEmphasis?: string
  /** Shown once the target has passed. */
  completedMessage: string
}

export interface StoryBeat {
  id: string
  /**
   * The short capitalised label on the route, e.g. `FIRST TRIP`.
   *
   * Separate from the heading because the route shows two lines — what the
   * milestone was, and where or when it happened — and the heading is a
   * sentence, not a label.
   */
  label: string
  heading: string
  /** Plain text. No markup. */
  body: MaybePending<string>
  /** Where it happened, when that is the thing worth saying under the label. */
  place?: string
  /**
   * When it happened, when that is the thing worth saying instead — a date, or
   * "Six years later". Only where genuinely known; never inferred from
   * neighbouring beats.
   */
  year?: string
  emblem: PlaceEmblem
  /** Must resolve to a `GalleryImage.id` when present. */
  imageId?: string
}

export interface GalleryImage {
  id: string
  /**
   * The file, as a path from the repository root, under
   * `src/assets/images/photos/`. Not a URL: the bundler fingerprints the file,
   * and `photoUrl()` turns this path into what the page loads.
   */
  src: string
  srcSet?: string
  /** Intrinsic pixels, so the grid can reserve space before the image loads. */
  width: number
  height: number
  /** Never empty — a photograph with no description is a defect. */
  alt: string
  caption?: string
}

/** Whose name comes first where the pair is shown. */
export type LeadName = 'bride' | 'groom'

export interface Couple {
  brideName: string
  groomName: string
  /**
   * Which name leads wherever the pair is shown.
   *
   * Stored rather than baked into a component, so the order is a content
   * decision and the two names stay semantically labelled. This is the order
   * at the root address; `/bs/` and `/sb/` choose one explicitly (see
   * `routes.ts`).
   */
  leadName: LeadName
  hashtag: string
}

export interface Theme {
  title: string
  titleDevanagari: string
  tagline: string
}

export interface HeroContent {
  /**
   * Omitted by default. With no photograph the hero renders its authored
   * composition, which is the intended treatment rather than a fallback.
   */
  imageId?: string
  dateLabel: string
  cityLabel: string
}

export interface StoryContent {
  heading: string
  intro?: string
  beats: StoryBeat[]
  /**
   * The closing note to guests, shown in its own framed box at the foot of the
   * page. Not one of the beats: it is addressed to the reader, not a milestone.
   */
  closingMessage: MaybePending<string>
}

export interface FooterContent {
  message: MaybePending<string>
  hostedByLines: MaybePending<string[]>
}

/** The formal message, between the hero and the story. */
export interface InvitationMessageContent {
  heading: string
  message: MaybePending<string>
}

/**
 * The polaroids on the home page, top to bottom: the one propped against the
 * invitation card, the three under the tray, the three on the story strip
 * ("Once", "Upon", "A time"), and the one beside Save the Date.
 */
export type HomePhotoSlot =
  | 'invitation'
  | 'details-1'
  | 'details-2'
  | 'details-3'
  | 'story-1'
  | 'story-2'
  | 'story-3'
  | 'save-the-date'

export interface InvitationContent {
  couple: Couple
  invitation: InvitationMessageContent
  theme: Theme
  hero: HeroContent
  countdown: CountdownConfig
  playlist: PlaylistConfig
  story: StoryContent
  events: WeddingEvent[]
  venues: Venue[]
  /** Every photograph on the site. May be empty. */
  gallery: GalleryImage[]
  /**
   * Which gallery photograph fills each home-page polaroid, by image id. A
   * slot left out keeps its drawn stand-in.
   */
  homePhotos: Partial<Record<HomePhotoSlot, string>>
  footer: FooterContent
}
