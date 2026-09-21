import { useId, type CSSProperties, type ReactNode } from 'react'
import type { Point } from './geometry'
import waxSealUrl from '../../assets/images/objects/wax-seal.webp'
import { ObjectPhoto } from './Objects'

/**
 * The metal objects photographed in the reference: the gold wax seal, the
 * engraved silver salver, the antique key lying on it and the pearl drops
 * beside it.
 *
 * These are redrawings of photographs, not icons, so the drawing budget goes
 * almost entirely into light. Every curved surface carries one specular
 * highlight and one dark reflection, and the shapes underneath them are kept
 * plain; flat fills were tried first and read as clip art at any size.
 *
 * Shades between the palette tokens are mixed here rather than added to the
 * stylesheet, because they are lighting artefacts of these four objects and
 * nothing else on the site should be able to reach for them.
 *
 * None of these components sets its own width. Each page class sizes them, and
 * an inline width would win against that class.
 */

/** The near-black in the deepest wax crevices, where gold-deep alone stays too warm. */
const WAX_CREVICE = 'color-mix(in srgb, var(--color-gold-deep) 58%, var(--color-ink))'

/**
 * Tarnished silver. The key in the reference is a silver blank that has gone
 * brown in its crevices, not the black iron an earlier pass drew: it is bright
 * along every filed edge and dark only where the tarnish has settled. Drawn in
 * iron it read as a different object from the plate it hangs beside.
 *
 * The warm partner is gold-deep pulled towards maroon rather than gold-deep
 * itself: the palette's deep gold is olive, and a metal mixed straight from it
 * comes out khaki instead of the brown-grey of old silver.
 */
const TARNISH = 'color-mix(in srgb, var(--color-gold-deep) 46%, var(--color-maroon-deep))'
const KEY_DARK = `color-mix(in srgb, var(--color-ink) 74%, ${TARNISH})`
const KEY_BODY = `color-mix(in srgb, var(--color-silver-deep) 52%, ${TARNISH})`
const KEY_LIT = `color-mix(in srgb, var(--color-silver-light) 64%, ${TARNISH})`
const KEY_HI = 'color-mix(in srgb, var(--color-silver-light) 82%, var(--color-gold))'

/** The warm grey-gold of the earring fittings, thrown far out of focus in the photograph. */
const FITTING = 'color-mix(in srgb, var(--color-gold) 52%, var(--color-cream-shade))'

/** The angle the reference hangs the key at, measured off the badge's corner. */
const KEY_TILT_DEGREES = -32

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

/** A point on an axis-aligned ellipse, at an angle measured clockwise from 3 o'clock. */
function onEllipse(cx: number, cy: number, rx: number, ry: number, deg: number): Point {
  const t = (deg * Math.PI) / 180
  return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]
}

/**
 * An arc of an axis-aligned ellipse, for the sweeping highlights that make a rim
 * read as turned metal. Emitted as a single `A` command so the highlight lies
 * exactly on the ellipse it belongs to instead of approximating it.
 */
function ellipseArc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fromDeg: number,
  toDeg: number,
): string {
  const [x0, y0] = onEllipse(cx, cy, rx, ry, fromDeg)
  const [x1, y1] = onEllipse(cx, cy, rx, ry, toDeg)
  const large = (toDeg - fromDeg + 360) % 360 > 180 ? 1 : 0
  return `M ${r2(x0)} ${r2(y0)} A ${rx} ${ry} 0 ${large} 1 ${r2(x1)} ${r2(y1)}`
}

interface WaxSealProps {
  /** The couple's initials. Two letters are set as a stacked cipher, as on the reference. */
  monogram: string
  /** Width in CSS pixels. The height follows the viewBox, so a class may override the width alone. */
  size?: number | undefined
  className?: string | undefined
  /** Placement, when the seal is pressed onto an object that states where its
      own seal belongs. */
  style?: CSSProperties | undefined
}

const SEAL_VIEW = { w: 212, h: 207 } as const
/**
 * The struck face, measured off the photograph: the groove where the rim wall
 * drops to the face runs from 0.179 to 0.818 across the blob, so the die is a
 * shade under two thirds of the pour and the rim band is nearly half as wide
 * as the face is across.
 */
const SEAL_DIE_X = 105.7
const SEAL_DIE_Y = 104.5
const SEAL_DIE_R = 67.7
const SEAL_SCRIPT =
  "'Pinyon Script','Snell Roundhand','Apple Chancery','Segoe Script',cursive,Georgia,serif"

/**
 * The gold wax seal, repeated on every page of the reference.
 *
 * The seal is the couple's photograph of the real thing, struck blank; only the
 * cipher is drawn, into the face the die left. Drawn whole it read as a printed
 * token — the pour's edge can be built out of sine terms but its satin is a
 * property of the wax, and a gradient standing in for satin is what gave the
 * earlier pass away.
 */
export function WaxSeal({ monogram, size = 96, className, style }: WaxSealProps) {
  const letters = [...monogram].filter((ch) => ch.trim() !== '')
  const first = letters[0]
  const second = letters[1]

  /* The die is cut in intaglio, so the initials stand proud of the struck face:
     their tops catch the same light as the rim and each stroke drops a short
     shadow to the lower right. Two offset copies of the glyph are cheaper and
     more convincing than any filter. An earlier pass had the layers the other
     way round, which sank the letters into the wax and lost them entirely at
     the sizes the pages use.

     Each copy is stroked as well as filled: the die was cut with a broad
     graver and the photographed hand is heavier than this script's hairlines,
     which otherwise vanish before the seal reaches the size a page uses it at. */
  const engrave = (ch: string, x: number, y: number, fontSize: number) => (
    <g>
      <text
        x={r2(x + fontSize * 0.026)}
        y={r2(y + fontSize * 0.03)}
        fontSize={fontSize}
        fontFamily={SEAL_SCRIPT}
        textAnchor="middle"
        dominantBaseline="central"
        fill={WAX_CREVICE}
        stroke={WAX_CREVICE}
        strokeWidth={r2(fontSize * 0.02)}
        opacity="0.5"
      >
        {ch}
      </text>
      <text
        x={r2(x)}
        y={r2(y)}
        fontSize={fontSize}
        fontFamily={SEAL_SCRIPT}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-cream)"
        stroke="var(--color-cream)"
        strokeWidth={r2(fontSize * 0.02)}
        opacity="0.8"
      >
        {ch}
      </text>
    </g>
  )

  /* Measured against the photograph: the cap of the first initial is a little
     over two thirds of the die's radius, which in this script means a font size
     of about 1.2 radii. Set any larger and the swashes cross the struck border. */
  const cipherSize = r2(SEAL_DIE_R * 1.2)

  return (
    <svg
      className={className}
      width={size}
      viewBox={`0 0 ${SEAL_VIEW.w} ${SEAL_VIEW.h}`}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', overflow: 'visible', ...style }}
    >
      <image href={waxSealUrl} x="0" y="0" width={SEAL_VIEW.w} height={SEAL_VIEW.h} />

      {first !== undefined && second !== undefined ? (
        <>
          {engrave(
            first,
            SEAL_DIE_X - SEAL_DIE_R * 0.25,
            SEAL_DIE_Y - SEAL_DIE_R * 0.33,
            cipherSize,
          )}
          {engrave(
            second,
            SEAL_DIE_X + SEAL_DIE_R * 0.33,
            SEAL_DIE_Y + SEAL_DIE_R * 0.32,
            cipherSize,
          )}
        </>
      ) : (
        engrave(monogram, SEAL_DIE_X, SEAL_DIE_Y, r2(SEAL_DIE_R * 1.3))
      )}
    </svg>
  )
}

interface SilverTrayProps {
  className?: string | undefined
  /** Whatever is being presented: the label, the photographs, the key. */
  children?: ReactNode
}

/**
 * The engraved silver salver.
 *
 * A photograph, not a drawing. The plate the couple chose is a chased
 * Victorian salver whose whole character is in the acanthus engraving filling
 * its well and the gadrooned rope round its lip — both of them fine enough
 * that drawing them at this size produced either a smudge or an invented
 * ornament, which is what the earlier drawn pass did. The file is the supplied
 * one cut to its own alpha bounding box, so the plate fills its box edge to
 * edge and the page can place it as a circle.
 *
 * The positioning context for the children is an inner element, because the
 * class this component is given is positioned by the page and an inline
 * `position` here would override it.
 */
export function SilverTray({ className, children }: SilverTrayProps) {
  return (
    <div className={className}>
      <div style={{ position: 'relative' }}>
        <ObjectPhoto photo="silver-plate" eager className="silver-plate" />

        {children === undefined ? null : (
          <div
            style={{
              position: 'absolute',
              left: '18%',
              top: '18%',
              width: '64%',
              height: '64%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

interface AntiqueKeyProps {
  className?: string | undefined
}

/* The upright drawing, before the key is tilted into its box. The shaft runs
   down the line x = 30; the bow sits above it and the split ring above that,
   dropped far enough that its lower arc passes through the bow's top opening.
   Every number below is the reference photograph's own proportion, scaled so
   the key measures 160 from the crown of the bow to the tip of the shaft:
   the bow is 45 across and 50 deep, the ring is 52 across, and the shaft is
   8 wide at the collar and 6.6 at the tip. */
const KEY_AXIS = 30
const KEY_RING = { cx: 24, cy: -3, r: 25 } as const

/** The bow's outer silhouette: a shield that flares from the neck to two
    shoulders and closes in two lobes with a valley between them. */
const KEY_BOW_OUTER =
  'M 30 59 C 21 56, 9.5 49.5, 7.6 38.5 C 5.8 27, 11.6 13.4, 21 13 ' +
  'C 26.8 12.8, 29.6 18.4, 30 24.5 C 30.4 18.4, 33.2 12.8, 39 13 ' +
  'C 48.4 13.4, 54.2 27, 52.4 38.5 C 50.5 49.5, 39 56, 30 59 Z'

/**
 * The two kidney-shaped openings cut through it.
 *
 * Two holes rather than one void with a member drawn back over it: the member
 * is then the strip of metal the holes leave between them, so it cannot drift
 * out of register with them, and the metal round the outside stays an even
 * six units thick the whole way round. A single opening made the bow read as a
 * gift-shop charm — what says cast iron is how much of the bow is air.
 */
const KEY_BOW_HOLE_LEFT =
  'M 28 50.5 C 23 48, 15.6 42.5, 14.2 34.2 C 12.8 26, 17 20.4, 22 20.8 ' +
  'C 26 21.1, 27.6 25.8, 28 30.6 Z'
const KEY_BOW_HOLE_RIGHT =
  'M 32 50.5 C 37 48, 44.4 42.5, 45.8 34.2 C 47.2 26, 43 20.4, 38 20.8 ' +
  'C 34 21.1, 32.4 25.8, 32 30.6 Z'

/** The fleur where the dividing member meets the crown: two curls thrown
    outward into the valley between the lobes. */
const KEY_CURL_LEFT =
  'M 30 30 C 29.5 24.8, 26.2 22, 24.1 24 C 22.3 25.7, 23.8 28.6, 26 28'
const KEY_CURL_RIGHT =
  'M 30 30 C 30.5 24.8, 33.8 22, 35.9 24 C 37.7 25.7, 36.2 28.6, 34 28'

/** The barrel where the bow is forged onto the shaft: a wide knop between two
    narrow rings, not the coil of four the earlier pass drew. */
const KEY_COLLARS: readonly (readonly [number, number, number, number])[] = [
  [21.4, 56.4, 17.2, 3.6],
  [20.2, 60.2, 19.6, 7.6],
  [21.8, 67.8, 16.4, 3.4],
]

/** The shaft, tapering, and rounded off past the bit. */
const KEY_SHAFT = 'M 26 70.8 L 34 70.8 L 33.3 155 Q 30 158.4 26.7 155 Z'

/** The bit: a plate hung off the near side of the shaft, with two wards cut
    into it and a square step at its foot. */
const KEY_BIT =
  'M 26.6 126 L 10.2 126 L 10.2 134.4 L 17.6 134.4 L 17.6 139.4 L 10.2 139.4 ' +
  'L 10.2 146.6 L 19.2 146.6 L 19.2 151.4 L 26.6 151.4 Z'

/**
 * The ornate key, hung on its split ring.
 *
 * It is a silver blank gone brown in its crevices, not the black iron of the
 * earlier pass: the photograph's key is bright along every filed edge and dark
 * only where the tarnish has settled, and drawing it in iron made the one
 * metal object beside the plate read as a different object entirely.
 *
 * Drawn upright and then tilted inside its own viewBox, so whatever places it
 * positions one box rather than composing a rotation with its own transform.
 * The ring is drawn before the bow and its lower arc crosses the bow's crown:
 * the crown's opening is a hole in the fill, so the ring shows through it and
 * the two read as linked rather than merely stacked.
 *
 * The box is the rotated drawing's own bounding box, which is what lets the
 * badge hang the key off its corner by two percentages.
 */
export function AntiqueKey({ className }: AntiqueKeyProps) {
  const uid = useId().replace(/:/g, '')
  const ref = (name: string) => `${name}-${uid}`

  /* The upright drawing spans -15.7..129.7 across and -52.5..134.5 down once
     it is turned; the translate brings that corner to the origin so the key
     fills the box without being clipped. */
  const place = `translate(15.7 52.5) rotate(${KEY_TILT_DEGREES})`

  return (
    <svg
      className={className}
      viewBox="0 0 146 187"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* User space, not bounding box: one light source has to run across the
            bow, the collars and the bit as if they were forged in one piece.
            The lit stop is narrow — a wide one turns the whole key to pewter. */}
        <linearGradient id={ref('broad')} gradientUnits="userSpaceOnUse" x1="6" y1="0" x2="54" y2="0">
          <stop offset="0" stopColor={KEY_DARK} />
          <stop offset="0.2" stopColor={KEY_BODY} />
          <stop offset="0.33" stopColor={KEY_LIT} />
          <stop offset="0.44" stopColor={KEY_BODY} />
          <stop offset="0.8" stopColor={KEY_DARK} />
          <stop offset="1" stopColor={KEY_DARK} />
        </linearGradient>
        <linearGradient
          id={ref('shaft')}
          gradientUnits="userSpaceOnUse"
          x1="25.8"
          y1="0"
          x2="34.2"
          y2="0"
        >
          <stop offset="0" stopColor={KEY_DARK} />
          <stop offset="0.24" stopColor={KEY_BODY} />
          <stop offset="0.4" stopColor={KEY_LIT} />
          <stop offset="0.66" stopColor={KEY_BODY} />
          <stop offset="1" stopColor={KEY_DARK} />
        </linearGradient>
        {/* The ring is the one part of the assembly that is bright polished
            wire rather than tarnished casting, and the photograph shows it
            almost white along its top. */}
        <linearGradient
          id={ref('ring')}
          gradientUnits="userSpaceOnUse"
          x1={KEY_RING.cx - KEY_RING.r}
          y1={KEY_RING.cy - KEY_RING.r}
          x2={KEY_RING.cx + KEY_RING.r}
          y2={KEY_RING.cy + KEY_RING.r}
        >
          <stop offset="0" stopColor={KEY_HI} />
          <stop offset="0.38" stopColor="var(--color-silver-deep)" />
          <stop offset="0.72" stopColor={KEY_BODY} />
          <stop offset="1" stopColor={KEY_DARK} />
        </linearGradient>
        <filter id={ref('cast')} x="-40%" y="-20%" width="180%" height="140%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <clipPath id={ref('holes')}>
          <path d={KEY_BOW_HOLE_LEFT} />
        </clipPath>
      </defs>

      <g transform={place}>
        <g
          transform="translate(2.6 3.4)"
          fill="var(--color-ink)"
          opacity="0.2"
          filter={`url(#${ref('cast')})`}
        >
          <path d={KEY_BOW_OUTER} />
          {KEY_COLLARS.map(([x, y, w, h]) => (
            <rect key={`s-${y}`} x={x} y={y} width={w} height={h} rx={h / 2} />
          ))}
          <path d={KEY_SHAFT} />
          <path d={KEY_BIT} />
        </g>

        {/* Two turns of a split ring, nearly as wide as the bow, drawn thin
            because it is bent wire rather than cast. */}
        <g fill="none" strokeWidth="4" strokeLinecap="round">
          <path
            d={ellipseArc(KEY_RING.cx, KEY_RING.cy, KEY_RING.r, KEY_RING.r, 300, 288)}
            stroke={`url(#${ref('ring')})`}
          />
          <path
            d={ellipseArc(KEY_RING.cx + 1.6, KEY_RING.cy + 1.8, KEY_RING.r, KEY_RING.r, 306, 232)}
            stroke={KEY_DARK}
            opacity="0.5"
          />
        </g>

        <path
          d={`${KEY_BOW_OUTER} ${KEY_BOW_HOLE_LEFT} ${KEY_BOW_HOLE_RIGHT}`}
          fillRule="evenodd"
          fill={`url(#${ref('broad')})`}
        />

        {/* The fleur at the crown, and the knop hanging on the member between
            the two openings. */}
        <g fill="none" stroke={`url(#${ref('broad')})`} strokeWidth="2.6" strokeLinecap="round">
          <path d={KEY_CURL_LEFT} />
          <path d={KEY_CURL_RIGHT} />
        </g>
        <circle cx={KEY_AXIS} cy="39" r="3.4" fill={`url(#${ref('broad')})`} />
        {/* A thread of light along each opening's wall, where the casting was
            filed back; without it the openwork closes up at small sizes. */}
        <g fill="none" stroke={KEY_HI} strokeWidth="0.9" opacity="0.42">
          <path d={KEY_BOW_HOLE_LEFT} />
          <path d={KEY_BOW_HOLE_RIGHT} />
        </g>
        {/* The ring again, this time only where it crosses the near opening.
            The first copy is behind the bow, so without this one the ring
            stops dead at the bow's edge and the two read as stacked rather
            than threaded. The ring hangs up and to the left, as the
            photograph has it, so it grazes that one opening and leaves the
            far one clear. */}
        <g clipPath={`url(#${ref('holes')})`} fill="none" strokeWidth="4" strokeLinecap="round">
          <path
            d={ellipseArc(KEY_RING.cx, KEY_RING.cy, KEY_RING.r, KEY_RING.r, 300, 288)}
            stroke={`url(#${ref('ring')})`}
          />
        </g>

        <g fill={`url(#${ref('broad')})`}>
          {KEY_COLLARS.map(([x, y, w, h]) => (
            <rect key={`c-${y}`} x={x} y={y} width={w} height={h} rx={h / 2} />
          ))}
          <rect x="24.2" y="120.4" width="11.6" height="3.4" rx="1.7" />
        </g>

        <path d={KEY_SHAFT} fill={`url(#${ref('shaft')})`} />
        <rect x="27.2" y="72" width="1.1" height="80" rx="0.55" fill={KEY_HI} opacity="0.42" />

        <path d={KEY_BIT} fill={`url(#${ref('broad')})`} />
        <path
          d="M 26 127.2 L 11.4 127.2 M 26 150.2 L 20.4 150.2 M 16.4 135.6 L 11.4 135.6"
          fill="none"
          stroke={KEY_HI}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.4"
        />
      </g>
    </svg>
  )
}

interface PearlEarringsProps {
  className?: string | undefined
}

/**
 * The pair of pearl drops set down beside the bouquet.
 *
 * In the photograph they lie well behind the plane of focus: two warm cream
 * discs with almost no specular at all, a faint cool edge where each turns
 * away, and a small blurred gold fitting floating above. Everything here is
 * drawn through a blur for that reason — a sharp pearl beside an out-of-focus
 * bouquet is the detail that gave the earlier pass away.
 */
export function PearlEarrings({ className }: PearlEarringsProps) {
  const uid = useId().replace(/:/g, '')
  const ref = (name: string) => `${name}-${uid}`

  const pearl = (cx: number, cy: number, r: number) => (
    <g>
      <ellipse
        cx={cx + r * 0.12}
        cy={cy + r * 0.92}
        rx={r * 0.74}
        ry={r * 0.24}
        fill="var(--color-cream-shade)"
        opacity="0.4"
      />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${ref('pearl')})`} />
      {/* The underside stays a touch warmer and darker than the gradient alone
          makes it, which is the only thing keeping the disc from reading as a
          flat blot once the blur has taken the highlight away. */}
      <ellipse
        cx={cx + r * 0.16}
        cy={cy + r * 0.44}
        rx={r * 0.74}
        ry={r * 0.5}
        fill="var(--color-cream-shade)"
        opacity="0.28"
        filter={`url(#${ref('deep')})`}
      />
      {/* One low, wide band of bounced light instead of a specular dot: at this
          degree of defocus a pearl has no highlight left, only a gradient. It
          carries its own blur because the group's haze is not enough to keep a
          disc this large from showing its own edge. */}
      <ellipse
        cx={cx - r * 0.2}
        cy={cy - r * 0.24}
        rx={r * 0.56}
        ry={r * 0.44}
        fill="var(--color-bloom)"
        opacity="0.55"
        filter={`url(#${ref('deep')})`}
      />
    </g>
  )

  /* The fitting is a cluster of granules, too small to resolve in the
     photograph; three overlapping beads reproduce its silhouette. */
  const fitting = (cx: number, cy: number, s: number) => (
    <g fill={FITTING}>
      <circle cx={cx - s * 0.5} cy={cy - s * 0.1} r={s * 0.6} />
      <circle cx={cx + s * 0.45} cy={cy - s * 0.4} r={s * 0.48} />
      <circle cx={cx + s * 0.05} cy={cy + s * 0.45} r={s * 0.44} />
    </g>
  )

  return (
    <svg
      className={className}
      viewBox="0 0 64 60"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      <defs>
        <radialGradient id={ref('pearl')} cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="var(--color-bloom)" />
          <stop offset="0.5" stopColor="var(--color-bloom-core)" />
          <stop offset="0.88" stopColor="var(--color-bloom-shade)" />
          <stop offset="1" stopColor="var(--color-cream-shade)" />
        </radialGradient>
        <filter
          id={ref('haze')}
          filterUnits="userSpaceOnUse"
          x="-12"
          y="-12"
          width="88"
          height="84"
        >
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
        {/* The fittings sit further back still, so they go softer than the pearls. */}
        <filter
          id={ref('deep')}
          filterUnits="userSpaceOnUse"
          x="-12"
          y="-12"
          width="88"
          height="84"
        >
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      <g filter={`url(#${ref('deep')})`}>
        {fitting(17.5, 7.5, 2.6)}
        {fitting(45, 9.5, 2.3)}
      </g>
      <g filter={`url(#${ref('haze')})`}>
        {pearl(18, 22, 9)}
        {pearl(45.6, 25.8, 2.8)}
        {pearl(44, 40.5, 9.4)}
      </g>
    </svg>
  )
}
