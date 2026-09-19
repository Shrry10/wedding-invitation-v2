import { useRef } from 'react'
import { PlaceIcon, type PlaceIconName } from '../components/art/PlaceIcons'
import { FloralSpray } from '../components/art/Florals'
import { HeartFlourish, InvitationCard } from '../components/art/Paper'
import { OPEN_ENVELOPE_SEAL, OpenEnvelope } from '../components/art/Maroon'
import { WaxSeal } from '../components/art/Metal'
import {
  HeartMark,
  SCHEDULE_ROUTE_LAYOUT,
  ScheduleRoute,
  scheduleRouteNodes,
  scheduleRouteViewBox,
} from '../components/art/Paths'
import { FactValue } from '../components/a11y/FactValue'
import { paletteFor } from '../data/eventPalettes'
import { arrivalThrow } from '../lib/arrival'
import { formatLongDate, formatShortDate, formatTime } from '../lib/formatDate'
import { knownValue } from '../lib/isPending'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useStagedReveal } from '../hooks/useStagedReveal'
import type { PageId } from '../routes'
import type { InvitationContent, Venue, WeddingEvent } from '../data/types'

/** Which drawing stands for each function. */
const EVENT_ICONS: Record<string, PlaceIconName> = {
  mehndi: 'mehndi',
  haldi: 'haldi',
  sangeet: 'sangeet',
  marriage: 'mandap',
}

/**
 * The drawing at a schedule stop, in pixels.
 *
 * Handed to the stylesheet as well, because the stop is placed by its heart
 * and the heart belongs level with the drawing, not with the middle of the
 * three lines under it — so the stop is pulled up by exactly half of this.
 */
const SCHEDULE_ICON = 54

/**
 * A function's name, the same way everywhere it appears: the name it is
 * presented under, with the traditional name and its Devanagari beneath.
 */
function FunctionName({ event, className }: { event: WeddingEvent; className?: string }) {
  return (
    <span className={className === undefined ? 'function-name' : `function-name ${className}`}>
      <span className="function-name__title">{event.title}</span>
      <span className="t-label function-name__trad">
        {event.name}
        {event.nameDevanagari !== undefined && (
          <span className="function-name__native" lang="hi">
            {event.nameDevanagari}
          </span>
        )}
      </span>
    </span>
  )
}

/** A venue's street and city on one line, as much of it as is known. */
function venueAddress(venue: Venue | undefined): string {
  if (venue === undefined) return ''
  const lines = knownValue(venue.addressLines) ?? []
  return [...lines, knownValue(venue.city)].filter((line) => line !== undefined).join(', ')
}

/**
 * A venue's name, which is also the way to the map.
 *
 * The page carried a venues section until now, with a framed plate and a
 * "get directions" stamp for each place. It said the venue names a second
 * time and the dates not at all, so a guest reading the schedule had to go
 * looking further down for the one thing they actually wanted. The link now
 * sits on the name where they first meet it.
 *
 * A name with no map is still rendered — it is a fact the guest needs whether
 * or not we have somewhere to send them.
 */
function VenueLink({ venue }: { venue: Venue | undefined }) {
  const name = knownValue(venue?.name)
  if (name === undefined) return <>To be confirmed</>

  const mapsUrl = knownValue(venue?.mapsUrl)
  if (mapsUrl === undefined) return <>{name}</>

  return (
    <a className="venue-link" href={mapsUrl} target="_blank" rel="noreferrer noopener">
      {name}
      <span className="visually-hidden"> — find on Google Maps (opens in a new tab)</span>
    </a>
  )
}

interface DetailsPageProps {
  content: InvitationContent
  monogram: string
  navigate: (page: PageId) => void
}

/**
 * Everything a guest needs in order to turn up.
 *
 * Follows the reference section for section — the invitation, where and when,
 * what to wear, the order of the days — with two departures the couple asked
 * for. Nothing here offers travel or a stay: each function names its place and
 * links it to a map so a guest can find it, and that is all. And the dress
 * code is not one set of tones but four, because each function has its own
 * colours from its own decor deck, and a guest dressing for the Haldi should
 * not be shown the Sangeet's.
 */
export function DetailsPage({ content, monogram, navigate }: DetailsPageProps) {
  const { events, venues, invitation } = content
  const venuesById = new Map(venues.map((venue) => [venue.id, venue] as const))
  const columnRef = useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()
  useStagedReveal(columnRef, !reducedMotion)

  const stops = scheduleRouteNodes(events.length)
  const box = scheduleRouteViewBox(events.length)
  const cardHalf = SCHEDULE_ROUTE_LAYOUT.cardWidth * 50

  return (
    <main className="page page--details" id="main">
      <div className="page__column" ref={columnRef}>
        <h1 className="t-title" data-piece>
          The Details
        </h1>
        <p className="t-script section__script" data-piece>
          You are invited
        </p>

        {/* The same object the invitation page lays on its table: the opened
            envelope with the card rising out of it, the seal pressed over the
            notch, a spray at the corner. It is one piece, so the seal cannot
            drift and the whole thing casts one shadow. */}
        <div className="details__envelope" data-piece>
          <span className="sealed-object">
            <OpenEnvelope>
              <InvitationCard className="details__card" />
            </OpenEnvelope>
            <FloralSpray variant="corner" className="details__spray" />
            <WaxSeal
              monogram={monogram}
              className="sealed-object__seal"
              style={{
                left: `${(OPEN_ENVELOPE_SEAL.left * 100).toFixed(2)}%`,
                top: `${(OPEN_ENVELOPE_SEAL.top * 100).toFixed(2)}%`,
                width: `${(OPEN_ENVELOPE_SEAL.diameter * 100).toFixed(2)}%`,
              }}
            />
          </span>
        </div>

        <p className="t-prose details__message" data-piece>
          <FactValue value={invitation.message} label="The invitation message" />
        </p>

        <h2 className="t-script section__script" data-piece>
          Date and Location
        </h2>
        <ul className="functions">
          {events.map((event) => {
            const venue = venuesById.get(event.venueId)
            const start = knownValue(event.startTime)
            return (
              <li className="functions__item" key={event.id} data-piece>
                <PlaceIcon
                  name={EVENT_ICONS[event.id] ?? 'mandap'}
                  size={56}
                  className="functions__icon"
                />
                <FunctionName event={event} />
                <p className="t-prose functions__when">
                  {formatLongDate(event.date)}
                  <br />
                  {start !== undefined ? formatTime(start) : 'Time to be confirmed'}
                </p>
                <p className="t-prose functions__where">
                  <VenueLink venue={venue} />
                </p>
                <p className="t-prose functions__address">{venueAddress(venue)}</p>
              </li>
            )
          })}
        </ul>

        <h2 className="t-script section__script" data-piece>
          Dress Code
        </h2>
        <p className="t-prose details__note" data-piece>
          Each celebration has its own colours. Come in whatever feels festive, and borrow from
          these if you like.
        </p>
        <ol className="palettes">
          {events.map((event) => (
            <li className="palette" key={event.id} data-piece>
              <div className="palette__event">
                <PlaceIcon name={EVENT_ICONS[event.id] ?? 'mandap'} size={40} />
                <FunctionName event={event} className="function-name--left" />
              </div>
              <ul className="palette__swatches" aria-label={`${event.title}: the colours`}>
                {paletteFor(event.palette).swatches.map((swatch) => (
                  <li className="palette__swatch" key={swatch.label}>
                    <span
                      className="palette__chip"
                      style={{ ['--swatch' as string]: swatch.token }}
                      aria-hidden="true"
                    />
                    <span className="t-label palette__label">{swatch.label}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <h2 className="t-script section__script" data-piece>
          Timeline
        </h2>
        <div
          className="schedule"
          style={{
            ['--route-ratio' as string]: `${box.width} / ${box.height.toFixed(2)}`,
            ['--schedule-card' as string]: `${(SCHEDULE_ROUTE_LAYOUT.cardWidth * 100).toFixed(3)}%`,
            ['--schedule-icon' as string]: `${SCHEDULE_ICON}px`,
          }}
        >
          <span className="schedule__line" data-piece data-fade>
            <ScheduleRoute stops={events.length} className="schedule__path" />
          </span>
          <span className="schedule__rail" aria-hidden="true" data-piece data-fade />
          <ol className="schedule__list">
            {events.map((event, index) => {
              const node = stops[index]
              const right = node !== undefined && node.x > 0.5
              const start = knownValue(event.startTime)
              return (
                <li
                  className="schedule__stop"
                  key={event.id}
                  data-piece
                  data-side={right ? 'right' : 'left'}
                  style={{
                    ['--stop-y' as string]: `${((node?.y ?? 0) * 100).toFixed(3)}%`,
                    ['--stop-from-x' as string]: arrivalThrow(right ? 100 - cardHalf : cardHalf),
                  }}
                >
                  <HeartMark className="schedule__mark" />
                  <PlaceIcon
                    name={EVENT_ICONS[event.id] ?? 'mandap'}
                    size={SCHEDULE_ICON}
                    className="schedule__icon"
                  />
                  <FunctionName event={event} className="schedule__name" />
                  <p className="t-date schedule__when">
                    {formatShortDate(event.date)}
                    {start !== undefined ? ` · ${formatTime(start)}` : ''}
                  </p>
                  <p className="t-prose schedule__where">
                    {knownValue(venuesById.get(event.venueId)?.name) ?? ''}
                  </p>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="column__block" data-piece>
          <HeartFlourish className="section__flourish" />
          <WaxSeal monogram={monogram} className="section__seal" />
        </div>
        <button type="button" className="back-link" data-piece onClick={() => navigate('home')}>
          ← Back to home
        </button>
      </div>
    </main>
  )
}
