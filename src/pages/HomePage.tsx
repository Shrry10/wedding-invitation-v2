import { useRef, type CSSProperties, type ReactNode } from 'react'
import { Countdown } from '../components/countdown/Countdown'
import { FloralSpray } from '../components/art/Florals'
import { EmbossedCard, ScallopedOval } from '../components/art/Paper'
import { Cartouche, DoveEmblem, InviteCard } from '../components/art/Ornament'
import { OPEN_ENVELOPE_SEAL, OpenEnvelope, Polaroid } from '../components/art/Maroon'
import { PrintFill } from '../components/PrintFill'
import { PlaylistSleeve } from '../components/art/Vinyl'
import { AntiqueKey, PearlEarrings, SilverTray, WaxSeal } from '../components/art/Metal'
import { FactValue } from '../components/a11y/FactValue'
import { knownValue } from '../lib/isPending'
import { arrivalThrow } from '../lib/arrival'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useStagedReveal } from '../hooks/useStagedReveal'
import type { PageId } from '../routes'
import type { GalleryImage, HomePhotoSlot, InvitationContent, PlaylistConfig } from '../data/types'

/**
 * The invitation is an absolute canvas, as the reference is.
 *
 * Every object's left, top and width were measured off `resc/website-ss/page-1.png`
 * and are stored here as percentages of that canvas. A stack of flow-laid
 * sections cannot reproduce this page: the objects overlap, tilt and sit at
 * unrelated heights, and only a shared coordinate space keeps them in register.
 *
 * Type inside the canvas is sized in container-query units so the whole
 * arrangement scales as one drawing rather than reflowing.
 */

/** Canvas proportions, from the reference screenshot. */
const CANVAS_W = 812
const CANVAS_H = 2100

/**
 * Places one object on the canvas, and decides where it flies in from.
 *
 * An object left of centre arrives from the left and an object right of centre
 * from the right, thrown further the further off centre it sits, so the page
 * assembles itself the way the objects would have been laid down.
 *
 * The tops come in five groups — the envelope and card, the tray and its door,
 * the story and its strip, save-the-date, and the countdown — and a group is
 * moved as a whole. Moving one object inside a group opens a hole in an
 * arrangement whose overlaps were measured off the reference; what is worth
 * adjusting is the air *between* groups, and that means shifting every top in
 * a group and in every group below it by the same amount.
 *
 * Judge that air by what is drawn, not by these numbers: a floral spray's box
 * is largely transparent, so the gap a reader sees is the blank band between
 * two groups' ink, which here ran a third longer than the boxes implied.
 */
function at(left: number, top: number, width: number, extra?: CSSProperties): CSSProperties {
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    ['--from-x' as string]: arrivalThrow(left + width / 2),
    ...extra,
  }
}

function Piece({
  style,
  children,
  fade,
  className,
}: {
  style: CSSProperties
  children: ReactNode
  /** Arrive by fading only — for small objects whose blur filters make a moving
      arrival expensive to re-render. */
  fade?: boolean
  className?: string
}) {
  return (
    <div
      className={className === undefined ? 'piece' : `piece ${className}`}
      style={style}
      data-piece
      {...(fade === true ? { 'data-fade': '' } : {})}
    >
      {children}
    </div>
  )
}

/**
 * A line with one word of it set apart. Falls back to the plain line when
 * there is no word to emphasise or it is not in the line, so a copy edit in
 * the content file can never make words disappear.
 */
function EmphasisedLine({ text, emphasis }: { text: string; emphasis: string | undefined }) {
  const index = emphasis === undefined || emphasis === '' ? -1 : text.lastIndexOf(emphasis)
  if (emphasis === undefined || index === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <em className="t-script countdown__emphasis">{emphasis}</em>
      {text.slice(index + emphasis.length)}
    </>
  )
}

/**
 * The playlist sleeve, and the way to it.
 *
 * A link only once there is somewhere to go: an anchor with no href is not a
 * link to a screen reader and a cue reading "click here" that does nothing is
 * worse than none. Until the songs are chosen the sleeve carries only its
 * title.
 */
function PlaylistDoor({ playlist }: { playlist: PlaylistConfig }) {
  const url = knownValue(playlist.url)
  const face = (
    <PlaylistSleeve>
      <span className="t-script sleeve__title">{playlist.heading}</span>
      {url !== undefined && <span className="t-label sleeve__cue">{playlist.cue}</span>}
    </PlaylistSleeve>
  )

  if (url === undefined) {
    return <Piece style={at(58.0, 0.6, 22.0)}>{face}</Piece>
  }
  return (
    <a
      className="door"
      data-piece
      style={at(58.0, 0.6, 22.0)}
      href={url}
      target="_blank"
      rel="noreferrer noopener"
    >
      {face}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  )
}

interface HomePageProps {
  content: InvitationContent
  /** Both names, already in the order they are shown, as one line. */
  names: string
  /** The same two names, apart, for the card that sets them on lines of their own. */
  nameOrder: readonly [string, string]
  monogram: string
  navigate: (page: PageId) => void
}

export function HomePage({ content, names, nameOrder, monogram, navigate }: HomePageProps) {
  const { hero, countdown, footer, playlist } = content
  const gallery = new Map(content.gallery.map((image) => [image.id, image]))
  const photo = (slot: HomePhotoSlot): GalleryImage | undefined => {
    const id = content.homePhotos[slot]
    return id === undefined ? undefined : gallery.get(id)
  }
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()
  useStagedReveal(canvasRef, !reducedMotion)

  return (
    <main className="page page--home" id="main">
      <div
        className="canvas"
        ref={canvasRef}
        style={{ ['--canvas-ratio' as string]: `${CANVAS_W} / ${CANVAS_H}` }}
      >
        {/* The envelope it arrived in, opened, with the flowers still inside. */}
        <Piece style={at(26.1, 0.6, 28.8)}>
          {/* The reference lines the whole opening with roses rather than
              standing one posy in it, so three sprays overlap to fill it. */}
          <span className="sealed-object">
          <OpenEnvelope>
            <span className="envelope-liner">
              <FloralSpray variant="tied" className="envelope-liner__spray envelope-liner__spray--a" />
              <FloralSpray variant="tied" flip className="envelope-liner__spray envelope-liner__spray--b" />
              <FloralSpray variant="corner" className="envelope-liner__spray envelope-liner__spray--c" />
              <FloralSpray variant="sprig" className="envelope-liner__spray envelope-liner__spray--d" />
              <FloralSpray variant="sprig" flip className="envelope-liner__spray envelope-liner__spray--e" />
              <FloralSpray variant="corner" flip className="envelope-liner__spray envelope-liner__spray--f" />
              <FloralSpray variant="corner" className="envelope-liner__spray envelope-liner__spray--g" />
              <FloralSpray variant="sprig" className="envelope-liner__spray envelope-liner__spray--h" />
              <FloralSpray variant="corner" flip className="envelope-liner__spray envelope-liner__spray--i" />
            </span>
          </OpenEnvelope>
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
        </Piece>
        {/* Beside the envelope, as the reference has it: the sleeve, and the
            record halfway out of it. Drawn before the spray below so the
            flowers lie over its bottom edge the way they do on the reference —
            they cannot swallow the link, because a decorative piece takes no
            pointer events. */}
        <PlaylistDoor playlist={playlist} />
        <Piece style={at(53.6, 4.9, 19.5)}>
          <FloralSpray variant="corner" />
        </Piece>

        {/* A photograph propped against the invitation card. */}
        <Piece style={at(28.1, 13.7, 19.6)}>
          <Polaroid tilt={-3}>
            <PrintFill image={photo('invitation')} seed={2} eager />
          </Polaroid>
        </Piece>
        <Piece style={at(51.1, 11.2, 23.4)}>
          <InviteCard>
            <p className="t-label card__kicker">Invitation</p>
            <p className="t-label card__sub">To celebrate the wedding of</p>
            <h1 className="card__names">
              <span className="card__name">{nameOrder[0]}</span>
              <span className="card__amp" aria-hidden="true">
                &amp;
              </span>
              <span className="card__name">{nameOrder[1]}</span>
            </h1>
            <p className="card__when">{hero.dateLabel}</p>
            <p className="card__where">{hero.cityLabel}</p>
          </InviteCard>
        </Piece>

        {/* Door one: the tray, the key, and everything they unlock. */}
        {/* The plate turns, slowly, under a label that does not. The spin is
            on the tray alone: the piece's own drop shadow is switched off for
            this one object and a still disc beneath carries the same shadow
            instead, because a filter on an ancestor of something that moves
            is re-run on every frame, and this page has been made to stop
            stuttering once already. A circle's shadow is the same at every
            angle, so nothing is lost by not turning it. */}
        <Piece style={at(39.5, 25.6, 32.5)} className="piece--turning">
          <span className="plate-shadow" aria-hidden="true" />
          <span className="turning">
            <SilverTray />
          </span>
        </Piece>
        <Piece style={at(26.1, 23.3, 20.8)}>
          <FloralSpray variant="tied" />
        </Piece>
        <Piece style={at(33.0, 32.2, 4.2)}>
          <PearlEarrings />
        </Piece>
        <Piece style={at(57.0, 25.2, 13.5)}>
          <Polaroid tilt={11}>
            <PrintFill image={photo('details-1')} seed={3} />
          </Polaroid>
        </Piece>
        <Piece style={at(60.0, 29.2, 13.5)}>
          <Polaroid tilt={-7}>
            <PrintFill image={photo('details-2')} seed={4} />
          </Polaroid>
        </Piece>
        <Piece style={at(53.5, 33.0, 13.5)}>
          <Polaroid tilt={4}>
            <PrintFill image={photo('details-3')} seed={5} />
          </Polaroid>
        </Piece>
        <button
          type="button"
          className="door"
          data-piece
          style={at(42.2, 27.4, 16.8)}
          onClick={() => navigate('details')}
        >
          <Cartouche>
            <span className="t-script oval__title">The Details</span>
            <span className="t-label oval__cue">Click here</span>
            <DoveEmblem className="oval__doves" />
          </Cartouche>
        </button>
        <Piece style={at(50.5, 25.4, 15.0)}>
          <AntiqueKey />
        </Piece>

        {/* Door two: the story, on a strip of photographs. */}
        <button
          type="button"
          className="door"
          data-piece
          style={at(42.2, 40.9, 15.3)}
          onClick={() => navigate('story')}
        >
          <Cartouche>
            <span className="t-script oval__title">Our story</span>
            <span className="t-label oval__cue">Click here</span>
          </Cartouche>
        </button>
        <Piece style={at(27.0, 46.5, 21.5)}>
          <Polaroid caption="Once" tilt={-4}>
            <PrintFill image={photo('story-1')} seed={6} />
          </Polaroid>
        </Piece>
        <Piece style={at(41.8, 47.3, 21.5)}>
          <Polaroid caption="Upon" tilt={2}>
            <PrintFill image={photo('story-2')} seed={7} />
          </Polaroid>
        </Piece>
        <Piece style={at(56.2, 48.4, 21.5)}>
          <Polaroid caption="A time" tilt={7}>
            <PrintFill image={photo('story-3')} seed={8} />
          </Polaroid>
        </Piece>
        {/* The sprigs are laid down last, over the photographs, and a little
            higher than before. A sprig's bloom is at its foot, and once the
            sprigs were enlarged the foot fell behind the strip — only the
            astilbe spikes showed above it. Drawn on top, the bloom rests on the
            corner of a print the way the tray's bouquet rests on its
            photographs; lifted, it straddles the print's edge rather than
            sitting deep in the picture. The right one is not lifted: the tray's
            last photograph hangs just above it, and its spikes would cross that. */}
        <Piece style={at(23.9, 35.4, 21.2)}>
          <FloralSpray variant="sprig" />
        </Piece>
        <Piece style={at(54.3, 37.9, 22.0)}>
          <FloralSpray variant="sprig" flip />
        </Piece>
        {/* Save the date, and one more photograph. */}
        <Piece style={at(26.5, 60.0, 22.0)}>
          <ScallopedOval>
            <span className="t-script oval__title oval__title--wide">Save the Date</span>
            <span className="t-date oval__date">{hero.dateLabel}</span>
          </ScallopedOval>
        </Piece>
        <Piece style={at(43.2, 62.3, 15.6)}>
          <FloralSpray variant="corner" />
        </Piece>
        <Piece style={at(45.2, 62.7, 15.6)}>
          <FloralSpray variant="corner" />
        </Piece>
        <Piece style={at(49.8, 65.7, 28.5)}>
          <OpenEnvelope>
            <span className="envelope__card">
              <span className="t-script envelope__card-names">{names}</span>
            </span>
          </OpenEnvelope>
        </Piece>
        <Piece style={at(28.0, 67.3, 19.5)}>
          <Polaroid tilt={-2}>
            <PrintFill image={photo('save-the-date')} seed={9} />
          </Polaroid>
        </Piece>

        {/* The countdown closes the page. */}
        <Piece style={at(27.5, 78.6, 49.0)} className="countdown-slot">
          <EmbossedCard className="countdown-plate">
            <div className="countdown-card">
            <h2 className="t-script countdown__title">Countdown</h2>
            <Countdown
              countdown={countdown}
              fallbackLabel={hero.dateLabel}
              subject={`the wedding of ${names}`}
            />
            <p className="countdown__sub">
              <EmphasisedLine text={countdown.headingLabel} emphasis={countdown.headingEmphasis} />
            </p>
            <p className="t-script countdown__gratitude">With love and gratitude</p>
            <p className="countdown__signoff">{names}</p>
            <p className="countdown__contact">
              <FactValue value={footer.message} label="A closing word" />
            </p>
            <span className="countdown__seal" aria-hidden="true">
              <WaxSeal monogram={monogram} />
            </span>
            <button type="button" className="back-link" onClick={() => navigate('envelope')}>
              ← Back to envelope
            </button>
            </div>
          </EmbossedCard>
        </Piece>
      </div>
    </main>
  )
}
