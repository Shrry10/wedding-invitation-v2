import { useRef } from 'react'
import { LineIcon } from '../components/art/LineIcons'
import { PlaceIcon, type PlaceIconName } from '../components/art/PlaceIcons'
import { HeartFlourish, ScallopedBox } from '../components/art/Paper'
import { Polaroid } from '../components/art/Maroon'
import { WaxSeal } from '../components/art/Metal'
import {
  HeartMark,
  PHOTO_ROUTE_LAYOUT,
  PhotoRoute,
  photoRouteNodes,
  photoRouteViewBox,
} from '../components/art/Paths'
import { PhotoStandIn } from '../components/art/PhotoStandIn'
import { FactValue } from '../components/a11y/FactValue'
import { arrivalThrow } from '../lib/arrival'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useStagedReveal } from '../hooks/useStagedReveal'
import type { PageId } from '../routes'
import type { GalleryImage, MaybePending, PlaceEmblem, StoryBeat } from '../data/types'

/**
 * Which drawing stands for each stop.
 *
 * The engagement uses the reference's own hand-and-ring; every other stop is a
 * place the reference never had to draw.
 */
const EMBLEM_ICONS: Record<Exclude<PlaceEmblem, 'ring'>, PlaceIconName> = {
  college: 'college',
  story: 'story',
  flag: 'flag',
  hills: 'hills',
  skyline: 'skyline',
  yacht: 'yacht',
  market: 'market',
  castle: 'castle',
  island: 'island',
}

/** The drawing, at the size it sits beside a line of type rather than above it. */
const EMBLEM_SIZE = 34

function StoryIcon({ emblem }: { emblem: PlaceEmblem }) {
  if (emblem === 'ring') {
    return <LineIcon name="ring-hand" size={EMBLEM_SIZE} className="route__emblem" />
  }
  return <PlaceIcon name={EMBLEM_ICONS[emblem]} size={EMBLEM_SIZE} className="route__emblem" />
}

/**
 * What goes in one mount.
 *
 * A beat names its photograph by id, so the photographs arrive by being added
 * to the gallery and named here — no change to this page. Until one arrives the
 * mount holds the same drawn stand-in the rest of the site uses, which is a
 * picture rather than an empty frame, and the real photograph then drops into
 * the identical well at the identical size.
 */
function StoryPrint({ image, seed }: { image: GalleryImage | undefined; seed: number }) {
  if (image === undefined) {
    return <PhotoStandIn seed={seed} className="route__fill" />
  }
  return (
    <img
      className="route__fill"
      src={image.src}
      {...(image.srcSet === undefined ? {} : { srcSet: image.srcSet })}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading="lazy"
      decoding="async"
    />
  )
}

interface StoryPageProps {
  beats: StoryBeat[]
  /** The gallery a beat's `imageId` is resolved against. */
  images: GalleryImage[]
  heading: string
  closingMessage: MaybePending<string>
  names: string
  monogram: string
  navigate: (page: PageId) => void
}

/**
 * Where the two of them have been.
 *
 * One object carries the whole story: a dashed line winding down the page with
 * a photograph tied to it at every milestone. The prints were pegged to a
 * separate line above before, which asked the reader to hold two sequences at
 * once and told them nothing about which photograph belonged to which stop.
 *
 * Nothing here is positioned by eye. The curve is generated from the stop
 * count, the hearts are placed by evaluating the same spline the browser
 * strokes, and the prints are placed by CSS from `PHOTO_ROUTE_LAYOUT` — the
 * numbers the curve itself was built from — so a print's outer edge meets its
 * own heart at every width the route is drawn at.
 */
export function StoryPage({
  beats,
  images,
  heading,
  closingMessage,
  names,
  monogram,
  navigate,
}: StoryPageProps) {
  const nodes = photoRouteNodes(beats.length)
  const box = photoRouteViewBox(beats.length)
  const byId = new Map(images.map((image) => [image.id, image]))
  const columnRef = useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()
  useStagedReveal(columnRef, !reducedMotion)
  // Half a card, as a percentage of the route — where a stop's middle sits, and
  // so which side of the page it should be thrown in from.
  const cardHalf = PHOTO_ROUTE_LAYOUT.cardWidth * 50

  return (
    <main className="page page--story" id="main">
      <div className="page__column" ref={columnRef}>
        <h1 className="t-title" data-piece>
          {heading}
        </h1>

        <div
          className="route"
          style={{
            ['--route-ratio' as string]: `${box.width} / ${box.height.toFixed(2)}`,
            ['--route-card' as string]: `${(PHOTO_ROUTE_LAYOUT.cardWidth * 100).toFixed(3)}%`,
            ['--route-photo-half' as string]: `${(PHOTO_ROUTE_LAYOUT.photoHalf * 100).toFixed(3)}%`,
          }}
        >
          {/* The line fades rather than travels: it is the thing the prints are
              measured against, so it must not be anywhere but where it belongs
              even for a frame. */}
          <span className="route__line" data-piece data-fade>
            <PhotoRoute stops={beats.length} className="route__path" />
          </span>
          <span className="route__rail" aria-hidden="true" data-piece data-fade />
          <ol className="route__list">
            {beats.map((beat, index) => {
              const node = nodes[index]
              const right = node !== undefined && node.x > 0.5
              return (
                <li
                  className="route__stop"
                  key={beat.id}
                  data-piece
                  data-side={right ? 'right' : 'left'}
                  style={{
                    ['--stop-y' as string]: `${((node?.y ?? 0) * 100).toFixed(3)}%`,
                    // Read as --from-x only in the two-column layout. In one
                    // column every stop is on the left, and throwing them in
                    // from the right would push the page sideways.
                    ['--stop-from-x' as string]: arrivalThrow(right ? 100 - cardHalf : cardHalf),
                  }}
                >
                  <HeartMark className="route__mark" />
                  {/* Tilted the other way at every other stop, so seven prints
                      read as laid out by hand rather than as a printed grid. */}
                  <Polaroid className="route__print" tilt={index % 2 === 0 ? -1.6 : 1.6}>
                    <StoryPrint
                      image={beat.imageId === undefined ? undefined : byId.get(beat.imageId)}
                      seed={index * 3 + 2}
                    />
                  </Polaroid>
                  <p className="t-label route__label">{beat.label}</p>
                  <p className="route__when">
                    <StoryIcon emblem={beat.emblem} />
                    <span className="t-date">{beat.place ?? beat.year ?? ''}</span>
                  </p>
                  {/* The sentence that makes it a story rather than a caption:
                      what happened, in the couple's own voice. */}
                  <p className="t-prose route__story">
                    <FactValue value={beat.body} label={`Our story: ${beat.label}`} />
                  </p>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Wrapped only so the drawn box, the flourish and the seal can arrive:
            they are drawings that take a class, not elements that take an
            attribute. */}
        <div className="column__block" data-piece>
          <ScallopedBox className="story__message">
            <p className="t-script story__message-title">Message for you</p>
            <p className="t-label t-label--tight story__message-text">
              <FactValue value={closingMessage} label="A message for you" />
            </p>
          </ScallopedBox>
        </div>

        <p className="t-title story__with-love" data-piece>
          With love,
        </p>
        <p className="t-script story__names" data-piece>
          {names}
        </p>

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
