import { useRef, type CSSProperties, type ReactNode } from 'react'
import { Countdown } from '../components/countdown/Countdown'
import { FlowerPhoto } from '../components/art/Flowers'
import { EmbossedCard, NamesCard, ScallopedOval } from '../components/art/Paper'
import { Cartouche, DoveEmblem, InviteCard } from '../components/art/Ornament'
import { OPEN_ENVELOPE_SEAL, OpenEnvelope, Polaroid } from '../components/art/Maroon'
import { PrintFill } from '../components/PrintFill'
import { PlaylistSleeve } from '../components/art/Vinyl'
import type { BackgroundMusic } from '../hooks/useBackgroundMusic'
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
 * Every object's left, top and width were measured off the client's reference screenshot of page 1
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
 *
 * Across, each group is centred on the coordinate space rather than measured
 * straight off the reference, whose own collage sits a little right of its
 * middle: read down the page, four groups ending 2% right of centre and one
 * on it read as a page that drifts. The lefts below carry that correction —
 * the tray group by 2.2, the story and save-the-date groups by 2.4 and the
 * countdown by 2.0 — and a group keeps its internal arrangement, because what
 * is centred is the group's ink, not each object in it.
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
 * The playlist sleeve, and what it does.
 *
 * Three states, in the order they were built: a plain piece of scenery when
 * there is nothing to play and nowhere to send anyone; a link out, once a
 * streaming URL is filled in; and — now that the couple's own records are on
 * the site — the switch that plays them. The records win when both are set,
 * because a sleeve that plays when you press it is the honest reading of a
 * sleeve.
 *
 * An anchor with no href is not a link to a screen reader, and a cue reading
 * "click here" that does nothing is worse than no cue, so neither is rendered
 * until it means something.
 */
function PlaylistDoor({
  playlist,
  music,
}: {
  playlist: PlaylistConfig
  music: BackgroundMusic | null
}) {
  const url = knownValue(playlist.url)

  const face = (cue: string | undefined) => (
    <PlaylistSleeve>
      <span className="t-script sleeve__title">{playlist.heading}</span>
      {cue !== undefined && <span className="t-label sleeve__cue">{cue}</span>}
    </PlaylistSleeve>
  )

  if (music !== null) {
    return (
      <button
        type="button"
        className="door playlist"
        data-piece
        style={at(51.1, 0.6, 22.6)}
        onClick={music.toggle}
        aria-pressed={music.playing}
        aria-label={music.playing ? `Pause ${music.current.title}` : 'Play the playlist'}
      >
        {face(music.playing ? music.current.title : 'Press to play')}
      </button>
    )
  }

  if (url === undefined) {
    return (
      <Piece style={at(51.1, 0.6, 22.6)} className="playlist">
        {face(undefined)}
      </Piece>
    )
  }
  return (
    <a
      className="door playlist"
      data-piece
      style={at(51.1, 0.6, 22.6)}
      href={url}
      target="_blank"
      rel="noreferrer noopener"
    >
      {face(playlist.cue)}
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
  /** The site's one player, or null when no records are listed. */
  music: BackgroundMusic | null
}

export function HomePage({ content, names, nameOrder, monogram, navigate, music }: HomePageProps) {
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
        {/* Beside the envelope, as the reference has it: the sleeve, and the
            record halfway out of it. It stands in the invitation card's own
            column — sleeve's left edge and record's right edge on the card's
            two edges — and is drawn before the envelope, so the envelope's
            shoulder covers the corner where the two meet. A decorative piece
            takes no pointer events, so nothing laid over it can swallow the
            link. */}
        <PlaylistDoor playlist={playlist} music={music} />

        {/* The envelope it arrived in, opened, with the flowers still inside. */}
        <Piece style={at(26.1, 0.6, 28.8)}>
          {/* Flowers held *in* the envelope, not printed on its lining: the
              thrown-back flap is drawn first, the flowers over it, the pocket
              over them, so a bouquet lies on the flap with its bow and stems
              disappearing into the opening. One hand-tied bouquet is the
              object — a second bow beside it would read as a second bouquet —
              with two cut bunches of heads tucked in behind at the shoulders
              to fill the paper either side of it. Every bottom edge falls
              behind the pocket's V. */}
          <span className="sealed-object">
            <OpenEnvelope>
              <span className="envelope-liner">
                <FlowerPhoto
                  photo="liner-roses"
                  eager
                  className="envelope-liner__bunch envelope-liner__bunch--left"
                />
                <FlowerPhoto
                  photo="liner-roses"
                  eager
                  className="envelope-liner__bunch envelope-liner__bunch--right"
                />
                <FlowerPhoto
                  photo="tray-bouquet"
                  eager
                  className="envelope-liner__bunch envelope-liner__bunch--middle"
                />
                <FlowerPhoto
                  photo="liner-roses"
                  eager
                  className="envelope-liner__bunch envelope-liner__bunch--front"
                />
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
        <Piece style={at(52.2, 5.2, 17.5)}>
          <FlowerPhoto photo="tied-posy" eager className="flowers--card" />
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
        {/* Roses tucked in behind the plate's rim: laid before the tray, so the
            plate covers their stems and only the heads show past its edge. */}
        <Piece style={at(28.1, 23.0, 19.0)}>
          <FlowerPhoto photo="tray-bouquet" className="flowers--tray" />
        </Piece>
        <Piece style={at(37.8, 25.6, 31.5)} className="piece--turning">
          <span className="plate-shadow" aria-hidden="true" />
          <span className="turning">
            <SilverTray />
          </span>
        </Piece>
        <Piece style={at(30.8, 32.2, 4.2)}>
          <PearlEarrings />
        </Piece>
        <Piece style={at(54.8, 25.2, 13.5)}>
          <Polaroid tilt={11}>
            <PrintFill image={photo('details-1')} seed={3} />
          </Polaroid>
        </Piece>
        <Piece style={at(57.8, 29.2, 13.5)}>
          <Polaroid tilt={-7}>
            <PrintFill image={photo('details-2')} seed={4} />
          </Polaroid>
        </Piece>
        <Piece style={at(51.3, 33.0, 13.5)}>
          <Polaroid tilt={4}>
            <PrintFill image={photo('details-3')} seed={5} />
          </Polaroid>
        </Piece>
        <button
          type="button"
          className="door"
          data-piece
          style={at(40.0, 27.4, 16.8)}
          onClick={() => navigate('details')}
        >
          <Cartouche>
            <span className="t-script oval__title">The Details</span>
            <span className="t-label oval__cue">Click here</span>
            <DoveEmblem className="oval__doves" />
          </Cartouche>
          {/* The key hangs off the badge's shoulder rather than lying loose on
              the plate, as the reference has it: one object, so it lifts with
              the badge on hover and a reader who aims at the key still opens
              the details. */}
          <AntiqueKey className="badge-key" />
        </button>

        {/* Door two: the story, on a strip of photographs. */}
        <button
          type="button"
          className="door"
          data-piece
          /* Centred on the canvas itself, not on the group: it is a badge
             standing alone above the strip, and a reader takes it as the
             heading of the page rather than as part of the arrangement. */
          style={at(42.35, 40.9, 15.3)}
          onClick={() => navigate('story')}
        >
          <Cartouche>
            <span className="t-script oval__title">Our story</span>
            <span className="t-label oval__cue">Click here</span>
          </Cartouche>
        </button>
        {/* Flowers behind the strip: laid before the prints, so the prints
            cover the branch and stems and only the blooms show above their top
            edges, a few spilling a little way onto the frames. */}
        <Piece style={at(24.6, 43.3, 18.5)}>
          <FlowerPhoto photo="wild-rose-spray" className="flowers--once" />
        </Piece>
        <Piece style={at(58.8, 45.2, 18.5)}>
          <FlowerPhoto photo="wild-rose-spray" className="flowers--a-time" />
        </Piece>
        <Piece style={at(24.6, 46.5, 21.5)}>
          <Polaroid caption="Once" tilt={-4}>
            <PrintFill image={photo('story-1')} seed={6} />
          </Polaroid>
        </Piece>
        <Piece style={at(39.4, 47.3, 21.5)}>
          <Polaroid caption="Upon" tilt={2}>
            <PrintFill image={photo('story-2')} seed={7} />
          </Polaroid>
        </Piece>
        <Piece style={at(53.8, 48.4, 21.5)}>
          <Polaroid caption="A time" tilt={7}>
            <PrintFill image={photo('story-3')} seed={8} />
          </Polaroid>
        </Piece>
        {/* Two sprigs laid after the prints, resting on their corners: the
            flowers behind the strip all stop at its edge otherwise. */}
        <Piece style={at(24.8, 45.6, 9.6)}>
          <FlowerPhoto photo="wild-roses-on-frame" className="flowers--once-front" />
        </Piece>
        <Piece style={at(67.6, 47.5, 9.6)}>
          <FlowerPhoto photo="wild-roses-on-frame" className="flowers--a-time-front" />
        </Piece>
        {/* Save the date, and one more photograph. */}
        <Piece style={at(24.1, 60.0, 22.0)}>
          <ScallopedOval>
            <span className="t-script oval__title oval__title--wide">Save the Date</span>
            <span className="t-date oval__date">{hero.dateLabel}</span>
          </ScallopedOval>
        </Piece>
        {/* One bouquet standing in the envelope, as the reference has it: laid
            before the envelope, so the flap and the card cover its stems and
            only the blooms show, rising to the save-the-date card's height. */}
        <Piece style={at(44.6, 60.3, 26.0)}>
          <FlowerPhoto photo="envelope-bouquet" className="flowers--save-the-date" />
        </Piece>
        <Piece style={at(47.4, 65.7, 28.5)}>
          <OpenEnvelope>
            <NamesCard className="envelope__card">
              <span className="t-script envelope__card-names">{names}</span>
            </NamesCard>
          </OpenEnvelope>
        </Piece>
        <Piece style={at(25.6, 67.3, 19.5)}>
          <Polaroid tilt={-2}>
            <PrintFill image={photo('save-the-date')} seed={9} />
          </Polaroid>
        </Piece>

        {/* The countdown closes the page. */}
        <Piece style={at(25.5, 78.6, 49.0)} className="countdown-slot">
          <EmbossedCard className="countdown-plate">
            <div className="countdown-card">
              <h2 className="t-script countdown__title">Countdown</h2>
              <Countdown
                countdown={countdown}
                fallbackLabel={hero.dateLabel}
                subject={`the wedding of ${names}`}
              />
              <p className="countdown__sub">
                <EmphasisedLine
                  text={countdown.headingLabel}
                  emphasis={countdown.headingEmphasis}
                />
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
