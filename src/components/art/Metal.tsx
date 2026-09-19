import { useId, type CSSProperties, type ReactNode } from 'react'
import { jitter, type Point } from './geometry'

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

/** The wax itself: the palette's gold knocked back with cream to the brass of the photograph. */
const GOLD_BRASS = 'color-mix(in srgb, var(--color-gold) 86%, var(--color-cream))'

/** The near-black in the deepest wax crevices, where gold-deep alone stays too warm. */
const WAX_CREVICE = 'color-mix(in srgb, var(--color-gold-deep) 58%, var(--color-ink))'

/**
 * The shadow side of the pour. Gold-deep on its own is olive, and a seal built
 * from it alone photographs green; a little maroon puts the brass back.
 */
const GOLD_SHADE = 'color-mix(in srgb, var(--color-gold-deep) 84%, var(--color-maroon))'

/**
 * Oxidised iron. The key photographs almost black — a warm charcoal with only
 * narrow edge lights — so the lit tone here is a mid grey rather than a silver;
 * an earlier brighter pass turned the shaft into chrome.
 *
 * The warm partner is gold-deep pulled towards maroon rather than gold-deep
 * itself: the palette's deep gold is olive, and a key mixed straight from it
 * comes out khaki instead of the brown-black of aged steel.
 */
const IRON_RUST = 'color-mix(in srgb, var(--color-gold-deep) 52%, var(--color-maroon-deep))'
const IRON = `color-mix(in srgb, var(--color-ink) 72%, ${IRON_RUST})`
const IRON_LIT = `color-mix(in srgb, var(--color-silver-deep) 44%, ${IRON_RUST})`
const IRON_HI = `color-mix(in srgb, var(--color-silver-light) 52%, ${IRON_RUST})`
const IRON_DARK = 'color-mix(in srgb, var(--color-ink) 88%, var(--color-maroon-deep))'

/** The cool grey at the far edge of the salver, one step below silver-deep. */
const SILVER_SHADE = 'color-mix(in srgb, var(--color-silver-deep) 72%, var(--color-ink-soft))'

/** The warm grey-gold of the earring fittings, thrown far out of focus in the photograph. */
const FITTING = 'color-mix(in srgb, var(--color-gold) 52%, var(--color-cream-shade))'

/** The reference lays the key across the tray at roughly this angle. */
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

/** A closed Catmull-Rom spline, so a sampled outline comes back smooth instead of faceted. */
function closedSpline(points: readonly Point[]): string {
  const n = points.length
  const at = (i: number): Point => points[((i % n) + n) % n] as Point
  const start = at(0)
  let d = `M ${r2(start[0])} ${r2(start[1])}`
  for (let i = 0; i < n; i += 1) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${r2(c1x)} ${r2(c1y)} ${r2(c2x)} ${r2(c2y)} ${r2(p2[0])} ${r2(p2[1])}`
  }
  return `${d} Z`
}

/**
 * The outline of a blob of wax pressed by a round die.
 *
 * Three sine terms of different period, not one: the photographed pour has a
 * few broad flat runs with a couple of squeezed nubs between them, and a single
 * frequency gives an evenly scalloped coin instead. Amplitudes are deliberately
 * large — the previous pass was round enough to read as a medal.
 */
function pouredWaxEdge(cx: number, cy: number, r: number, seed: number): string {
  const steps = 44
  const points: Point[] = []
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2
    const lobes =
      Math.sin(a * 3 - 1.35) * 0.026 + Math.sin(a * 5 + 0.9) * 0.017 + Math.sin(a * 8 + 2.2) * 0.007
    const grain = (jitter(seed + i) - 0.5) * 0.008
    const rr = r * (1 + lobes + grain)
    points.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)])
  }
  return closedSpline(points)
}

interface WaxSealProps {
  /** The couple's initials. Two letters are set as a stacked cipher, as on the reference. */
  monogram: string
  /** Width in CSS pixels. The height follows the square viewBox, so a class may override the width alone. */
  size?: number | undefined
  className?: string | undefined
  /** Placement, when the seal is pressed onto an object that states where its
      own seal belongs. */
  style?: CSSProperties | undefined
}

const SEAL_DIE_X = 50.9
const SEAL_DIE_Y = 51.2
/**
 * Measured off the photograph: the struck face is a shade under two thirds of
 * the pour's radius, which leaves a rim band nearly half as wide as the face is
 * across. Drawing the face larger — the previous value was 0.74 — is what made
 * the earlier pass read as a printed token rather than as a bead of wax.
 */
const SEAL_BLOB_R = 43
const SEAL_DIE_R = 28.4
const SEAL_RIM_R = (SEAL_BLOB_R + SEAL_DIE_R) / 2
const SEAL_SCRIPT =
  "'Pinyon Script','Snell Roundhand','Apple Chancery','Segoe Script',cursive,Georgia,serif"

/**
 * Short radial cuts where the pour folded against the die wall. Fixed angles,
 * because a crease that moved between renders would flicker in the screenshot
 * comparisons — and because these four are the ones the photograph has.
 */
const WAX_CREASES: readonly { readonly deg: number; readonly len: number; readonly w: number }[] = [
  { deg: 163, len: 13, w: 1.5 },
  { deg: 127, len: 11, w: 1.2 },
  { deg: 44, len: 10, w: 1.3 },
  { deg: 302, len: 8.5, w: 1 },
]

/**
 * The gold wax seal, repeated on every page of the reference.
 *
 * The die strike is a true circle inside an irregular pour: in the photograph
 * the wax edge wanders by a few percent while the struck border stays perfectly
 * round, and that contrast is what identifies the object. The die sits a
 * fraction off the blob's centre for the same reason — a hand-pressed stamp
 * never lands dead centre.
 */
export function WaxSeal({ monogram, size = 96, className, style }: WaxSealProps) {
  const uid = useId().replace(/:/g, '')
  const ref = (name: string) => `${name}-${uid}`

  const blob = pouredWaxEdge(50, 50.5, SEAL_BLOB_R, 7)
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
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', overflow: 'visible', ...style }}
    >
      <defs>
        {/* Linear, not radial: a radial gradient on the body turns the wax
            glossy, and the photographed seal is satin. */}
        <linearGradient id={ref('body')} x1="0.16" y1="0.04" x2="0.82" y2="0.96">
          <stop offset="0" stopColor="var(--color-gold-light)" />
          <stop offset="0.34" stopColor={GOLD_BRASS} />
          <stop offset="0.78" stopColor={GOLD_SHADE} />
          <stop offset="1" stopColor={WAX_CREVICE} />
        </linearGradient>
        {/* The struck face is matte and sits below the rim, so it stays a step
            darker than the band around it whatever the light does. */}
        <radialGradient id={ref('face')} cx="42%" cy="34%" r="80%">
          <stop offset="0" stopColor={GOLD_BRASS} />
          <stop offset="0.46" stopColor="var(--color-gold)" />
          <stop offset="1" stopColor={GOLD_SHADE} />
        </radialGradient>
        <clipPath id={ref('blobClip')}>
          <path d={blob} />
        </clipPath>
        <clipPath id={ref('faceClip')}>
          <circle cx={SEAL_DIE_X} cy={SEAL_DIE_Y} r={SEAL_DIE_R} />
        </clipPath>
        {/* User space, not the default bounding box: most of what is blurred
            here is a thin arc, and a region sized off that arc's own box cuts
            the blur off along a straight line across the rim. */}
        <filter
          id={ref('soft')}
          filterUnits="userSpaceOnUse"
          x="-20"
          y="-20"
          width="140"
          height="140"
        >
          <feGaussianBlur stdDeviation="2.3" />
        </filter>
        <filter
          id={ref('hot')}
          filterUnits="userSpaceOnUse"
          x="-20"
          y="-20"
          width="140"
          height="140"
        >
          <feGaussianBlur stdDeviation="0.85" />
        </filter>
        <filter
          id={ref('cast')}
          filterUnits="userSpaceOnUse"
          x="-20"
          y="-20"
          width="140"
          height="140"
        >
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>

      <path
        d={blob}
        transform="translate(1.4 2.6)"
        fill="var(--color-ink)"
        opacity="0.22"
        filter={`url(#${ref('cast')})`}
      />

      <path d={blob} fill={`url(#${ref('body')})`} />
      <path d={blob} fill="none" stroke={WAX_CREVICE} strokeWidth="1.2" opacity="0.3" />

      {/* Everything that shapes the rim runs along its midline, so the band
          reads as one rolled torus rather than as tinted areas of a disc. The
          photograph's rim is not evenly lit: brightest from ten o'clock to
          twelve, darkest at seven, and warm again along the right flank. */}
      <g clipPath={`url(#${ref('blobClip')})`}>
        <path
          d={ellipseArc(50, 50.5, SEAL_RIM_R, SEAL_RIM_R, 108, 172)}
          fill="none"
          stroke={WAX_CREVICE}
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.44"
          filter={`url(#${ref('soft')})`}
        />
        <path
          d={ellipseArc(50, 50.5, SEAL_RIM_R, SEAL_RIM_R, 62, 108)}
          fill="none"
          stroke={WAX_CREVICE}
          strokeWidth="11"
          strokeLinecap="round"
          opacity="0.24"
          filter={`url(#${ref('soft')})`}
        />
        <path
          d={ellipseArc(50, 50.5, SEAL_RIM_R, SEAL_RIM_R, 178, 300)}
          fill="none"
          stroke="var(--color-gold-light)"
          strokeWidth="13"
          strokeLinecap="round"
          opacity="0.5"
          filter={`url(#${ref('soft')})`}
        />
        <path
          d={ellipseArc(50, 50.5, SEAL_RIM_R, SEAL_RIM_R, 318, 46)}
          fill="none"
          stroke="var(--color-gold-light)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.52"
          filter={`url(#${ref('soft')})`}
        />
        {/* The hot line. A torus turns a narrow, nearly hard specular; the broad
            wash alone only looks like a lighter patch of gold. */}
        <path
          d={ellipseArc(50, 50.5, SEAL_RIM_R, SEAL_RIM_R, 204, 296)}
          fill="none"
          stroke="var(--color-cream)"
          strokeWidth="3.4"
          strokeLinecap="round"
          opacity="0.82"
          filter={`url(#${ref('hot')})`}
        />
        <path
          d={ellipseArc(50, 50.5, SEAL_RIM_R, SEAL_RIM_R, 348, 24)}
          fill="none"
          stroke="var(--color-cream)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
          filter={`url(#${ref('hot')})`}
        />
        {/* The outermost edge of the pour catches a thread of light where it
            turns away; without it the blob's top silhouette goes soft. */}
        <path
          d={ellipseArc(50, 50.5, SEAL_BLOB_R - 1.1, SEAL_BLOB_R - 1.1, 200, 290)}
          fill="none"
          stroke="var(--color-gold-light)"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.5"
          filter={`url(#${ref('hot')})`}
        />
        <g stroke={WAX_CREVICE} strokeLinecap="round" opacity="0.3" filter={`url(#${ref('hot')})`}>
          {WAX_CREASES.map((crease) => {
            const [x0, y0] = onEllipse(50, 50.5, SEAL_DIE_R + 1, SEAL_DIE_R + 1, crease.deg)
            const [x1, y1] = onEllipse(
              50,
              50.5,
              SEAL_DIE_R + 1 + crease.len,
              SEAL_DIE_R + 1 + crease.len,
              crease.deg,
            )
            return (
              <line
                key={crease.deg}
                x1={r2(x0)}
                y1={r2(y0)}
                x2={r2(x1)}
                y2={r2(y1)}
                strokeWidth={crease.w}
              />
            )
          })}
        </g>
      </g>

      {/* The ditch the die cut, where the rim wall drops to the face. */}
      <circle
        cx={SEAL_DIE_X}
        cy={SEAL_DIE_Y}
        r={SEAL_DIE_R + 1.4}
        fill="none"
        stroke={WAX_CREVICE}
        strokeWidth="3.8"
        opacity="0.62"
        filter={`url(#${ref('hot')})`}
      />
      <circle cx={SEAL_DIE_X} cy={SEAL_DIE_Y} r={SEAL_DIE_R} fill={`url(#${ref('face')})`} />

      <g clipPath={`url(#${ref('faceClip')})`}>
        {/* The rim overhangs the face the whole way round, so there is a faint
            shadow everywhere and a strong one where the light is blocked. */}
        <circle
          cx={SEAL_DIE_X}
          cy={SEAL_DIE_Y}
          r={SEAL_DIE_R}
          fill="none"
          stroke={WAX_CREVICE}
          strokeWidth="5"
          opacity="0.16"
          filter={`url(#${ref('soft')})`}
        />
        <circle
          cx={SEAL_DIE_X + 2.4}
          cy={SEAL_DIE_Y + 2.8}
          r={SEAL_DIE_R}
          fill="none"
          stroke={WAX_CREVICE}
          strokeWidth="6.5"
          opacity="0.38"
          filter={`url(#${ref('soft')})`}
        />
        <ellipse
          cx={SEAL_DIE_X - 4}
          cy={SEAL_DIE_Y + 16}
          rx="16"
          ry="8"
          fill="var(--color-gold-light)"
          opacity="0.18"
          filter={`url(#${ref('soft')})`}
        />
      </g>

      {/* One incised border, not three: the photograph has a single fine groove
          set well in from the wall, dark on its far side and lit on its near. */}
      <circle
        cx={SEAL_DIE_X}
        cy={SEAL_DIE_Y}
        r={SEAL_DIE_R - 3}
        fill="none"
        stroke={WAX_CREVICE}
        strokeWidth="1"
        opacity="0.45"
      />
      <circle
        cx={SEAL_DIE_X}
        cy={SEAL_DIE_Y}
        r={SEAL_DIE_R - 3.9}
        fill="none"
        stroke="var(--color-cream)"
        strokeWidth="0.85"
        opacity="0.55"
      />

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

      {/* Bubbles risen in the pour. Three is enough to break the gradient; more
          reads as dirt. */}
      <g clipPath={`url(#${ref('blobClip')})`} opacity="0.32">
        <circle
          cx="20"
          cy="62"
          r="2.4"
          fill="var(--color-gold-light)"
          filter={`url(#${ref('soft')})`}
        />
        <circle
          cx="79"
          cy="33"
          r="1.8"
          fill="var(--color-gold-light)"
          filter={`url(#${ref('soft')})`}
        />
        <circle cx="61" cy="88" r="2" fill={WAX_CREVICE} filter={`url(#${ref('soft')})`} />
      </g>
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
 * Seen from slightly above centre, so the plate is a shallow ellipse and the
 * well sits a little high inside the rim — the one cue that separates a
 * photographed tray from a drawn circle. The rope border is a dashed stroke
 * rather than a hundred drawn beads: at the size this appears on the page the
 * two are indistinguishable, and a dash keeps its bead density when the tray is
 * scaled. Two bead courses at slightly different radii and half a period apart
 * make each bead read as slanted, which is what separates a gadroon from the
 * milled edge of a coin.
 *
 * The well carries no ornament. The lace-and-doves crest in the reference
 * belongs to the paper label lying on the tray, not to the silver; an invented
 * fleuron chased into the well was the clearest tell of the earlier pass.
 *
 * The positioning context for the children is an inner element, because the
 * class this component is given is positioned by the page and an inline
 * `position` here would override it.
 */
export function SilverTray({ className, children }: SilverTrayProps) {
  const uid = useId().replace(/:/g, '')
  const ref = (name: string) => `${name}-${uid}`

  const cx = 100
  const cy = 97

  return (
    <div className={className}>
      <div style={{ position: 'relative' }}>
        <svg
          viewBox="0 0 200 196"
          aria-hidden="true"
          focusable="false"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        >
          <defs>
            <linearGradient id={ref('plate')} x1="0.1" y1="0" x2="0.84" y2="1">
              <stop offset="0" stopColor="var(--color-paper)" />
              <stop offset="0.24" stopColor="var(--color-silver-light)" />
              <stop offset="0.58" stopColor="var(--color-silver)" />
              <stop offset="0.86" stopColor="var(--color-silver-deep)" />
              <stop offset="1" stopColor={SILVER_SHADE} />
            </linearGradient>
            <radialGradient id={ref('well')} cx="33%" cy="24%" r="82%">
              <stop offset="0" stopColor="var(--color-silver-light)" />
              <stop offset="0.38" stopColor="var(--color-silver-light)" />
              <stop offset="0.76" stopColor="var(--color-silver)" />
              <stop offset="1" stopColor="var(--color-silver-deep)" />
            </radialGradient>
            <clipPath id={ref('rimClip')}>
              <path
                clipRule="evenodd"
                d={
                  `M ${cx - 90} ${cy} a 90 85 0 1 0 180 0 a 90 85 0 1 0 -180 0 ` +
                  `M ${cx - 74} ${cy - 2.5} a 74 70 0 1 0 148 0 a 74 70 0 1 0 -148 0`
                }
              />
            </clipPath>
            <clipPath id={ref('wellClip')}>
              <ellipse cx={cx} cy={cy - 2.5} rx="73" ry="69" />
            </clipPath>
            {/* User space, not the default bounding box: the rim highlights are
                thin arcs, and a region sized off an arc's own box cropped the
                blur square, which showed as a straight seam across the plate. */}
            <filter
              id={ref('soft')}
              filterUnits="userSpaceOnUse"
              x="-24"
              y="-24"
              width="248"
              height="244"
            >
              <feGaussianBlur stdDeviation="3.2" />
            </filter>
            <filter
              id={ref('cast')}
              filterUnits="userSpaceOnUse"
              x="-24"
              y="-24"
              width="248"
              height="244"
            >
              <feGaussianBlur stdDeviation="4.5" />
            </filter>
          </defs>

          <ellipse
            cx={cx + 2}
            cy={cy + 7}
            rx="95"
            ry="90"
            fill="var(--color-ink)"
            opacity="0.15"
            filter={`url(#${ref('cast')})`}
          />

          <ellipse cx={cx} cy={cy} rx="97" ry="92" fill={`url(#${ref('plate')})`} />
          <ellipse
            cx={cx}
            cy={cy}
            rx="97"
            ry="92"
            fill="none"
            stroke={SILVER_SHADE}
            strokeWidth="0.9"
            opacity="0.5"
          />

          {/* The rim proper: a broad, nearly white sloping band. It is filled
              before the rope so the rope can be struck across the join. */}
          <ellipse cx={cx} cy={cy - 0.6} rx="90.4" ry="85.4" fill={`url(#${ref('plate')})`} />

          <g clipPath={`url(#${ref('rimClip')})`}>
            <path
              d={ellipseArc(cx, cy, 82.4, 77.8, 172, 302)}
              fill="none"
              stroke="var(--color-paper)"
              strokeWidth="19"
              strokeLinecap="round"
              filter={`url(#${ref('soft')})`}
            />
            <path
              d={ellipseArc(cx, cy, 82.4, 77.8, 326, 30)}
              fill="none"
              stroke="var(--color-silver-light)"
              strokeWidth="16"
              strokeLinecap="round"
              filter={`url(#${ref('soft')})`}
            />
            {/* The tray stands on a white ground, so the only real darkness on
                the rim is the narrow band at seven o'clock where it turns away
                from the window. */}
            <path
              d={ellipseArc(cx, cy, 82.4, 77.8, 100, 166)}
              fill="none"
              stroke={SILVER_SHADE}
              strokeWidth="16"
              strokeLinecap="round"
              opacity="0.4"
              filter={`url(#${ref('soft')})`}
            />
            <path
              d={ellipseArc(cx, cy, 82.4, 77.8, 40, 96)}
              fill="none"
              stroke={SILVER_SHADE}
              strokeWidth="13"
              strokeLinecap="round"
              opacity="0.18"
              filter={`url(#${ref('soft')})`}
            />
            {/* The gadrooned edge: a rope of short twists running the whole way
                round the outer lip. It is what makes the plate read as a
                salver rather than as a plain disc. */}
            {Array.from({ length: 96 }, (_, i) => {
              const a = (i / 96) * Math.PI * 2
              const rx = 86.5
              const ry = 81.8
              const px = cx + Math.cos(a) * rx
              const py = cy + Math.sin(a) * ry
              // Each twist lies across the rim, so it is drawn along the
              // outward normal of the ellipse rather than at a fixed angle.
              const nx = Math.cos(a) / rx
              const ny = Math.sin(a) / ry
              const nl = Math.hypot(nx, ny)
              const ux = (nx / nl) * 3.4
              const uy = (ny / nl) * 3.4
              const tilt = 0.42
              const sx = px - ux - uy * tilt
              const sy = py - uy + ux * tilt
              const ex = px + ux - uy * tilt
              const ey = py + uy + ux * tilt
              const lit = Math.sin(a + 2.2) > 0
              return (
                <line
                  key={i}
                  x1={sx.toFixed(2)}
                  y1={sy.toFixed(2)}
                  x2={ex.toFixed(2)}
                  y2={ey.toFixed(2)}
                  stroke={lit ? 'var(--color-paper)' : SILVER_SHADE}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity={lit ? 0.85 : 0.5}
                />
              )
            })}

            {/* A single incised line partway across the rim, which the
                photograph shows and which gives the slope a mid-point. */}
            <ellipse
              cx={cx}
              cy={cy - 1}
              rx="82.4"
              ry="77.8"
              fill="none"
              stroke={SILVER_SHADE}
              strokeWidth="0.7"
              opacity="0.3"
            />
            <ellipse
              cx={cx}
              cy={cy - 1.8}
              rx="82.4"
              ry="77.8"
              fill="none"
              stroke="var(--color-paper)"
              strokeWidth="0.8"
              opacity="0.5"
            />
          </g>

          {/* Gadrooned rope, struck at the outer edge where the reference puts
              it: one course of bright beads on a dark band, with a bright line
              containing it outside and a groove inside. Two bead courses at
              different radii were tried and read as a zip fastener — the
              photograph's beads run in a single file. */}
          <ellipse
            cx={cx}
            cy={cy}
            rx="93.6"
            ry="88.6"
            fill="none"
            stroke={SILVER_SHADE}
            strokeWidth="5.2"
            opacity="0.55"
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx="93.6"
            ry="88.6"
            fill="none"
            stroke="var(--color-silver-light)"
            strokeWidth="3.8"
            strokeDasharray="1.5 1.4"
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx="93.6"
            ry="88.6"
            fill="none"
            stroke={SILVER_SHADE}
            strokeWidth="4.4"
            strokeDasharray="0.55 2.35"
            opacity="0.4"
          />
          {/* The beads sit slightly proud, so the light catches their outer
              shoulder as a continuous thread and the inner side falls away. */}
          <ellipse
            cx={cx}
            cy={cy - 0.6}
            rx="95.6"
            ry="90.6"
            fill="none"
            stroke="var(--color-silver-light)"
            strokeWidth="2"
            opacity="0.8"
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx="96.6"
            ry="91.6"
            fill="none"
            stroke={SILVER_SHADE}
            strokeWidth="0.9"
            opacity="0.5"
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx="90.4"
            ry="85.4"
            fill="none"
            stroke={SILVER_SHADE}
            strokeWidth="1.1"
            opacity="0.55"
          />

          {/* The step down into the well: a shadowed groove with a lit lip
              below it. The well takes three quarters of the plate's radius,
              measured off the photograph — a narrower one leaves a rim so wide
              that the tray reads as a charger plate. */}
          <ellipse
            cx={cx}
            cy={cy - 2}
            rx="75.6"
            ry="71.6"
            fill="none"
            stroke={SILVER_SHADE}
            strokeWidth="2.2"
            opacity="0.45"
          />
          <ellipse
            cx={cx}
            cy={cy - 2.5}
            rx="74.3"
            ry="70.3"
            fill="none"
            stroke="var(--color-paper)"
            strokeWidth="1.6"
          />

          <ellipse cx={cx} cy={cy - 2.5} rx="73" ry="69" fill={`url(#${ref('well')})`} />

          <g clipPath={`url(#${ref('wellClip')})`}>
            {/* The wall of the step, shading the near edge of the well. */}
            <ellipse
              cx={cx + 1.5}
              cy={cy + 0.5}
              rx="73"
              ry="69"
              fill="none"
              stroke={SILVER_SHADE}
              strokeWidth="6"
              opacity="0.36"
              filter={`url(#${ref('soft')})`}
            />
            {/* Polished silver shows the room, not a pattern: one broad soft
                sheet of light across the top of the well and a cooler one
                lying under it. Hard-edged window reflections were tried and
                read as smudges on the plate. */}
            <ellipse
              cx={cx - 18}
              cy={cy - 36}
              rx="62"
              ry="30"
              transform={`rotate(-14 ${cx - 18} ${cy - 36})`}
              fill="var(--color-paper)"
              opacity="0.5"
              filter={`url(#${ref('soft')})`}
            />
            <ellipse
              cx={cx + 22}
              cy={cy + 38}
              rx="60"
              ry="22"
              transform={`rotate(-12 ${cx + 22} ${cy + 38})`}
              fill={SILVER_SHADE}
              opacity="0.15"
              filter={`url(#${ref('soft')})`}
            />
            <path
              d={ellipseArc(cx, cy - 2.5, 64, 60, 96, 168)}
              fill="none"
              stroke={SILVER_SHADE}
              strokeWidth="9"
              strokeLinecap="round"
              opacity="0.16"
              filter={`url(#${ref('soft')})`}
            />
          </g>
        </svg>

        {children === undefined ? null : (
          <div
            style={{
              position: 'absolute',
              left: '17%',
              top: '18%',
              width: '66%',
              height: '62%',
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

/**
 * The ornate key lying across the salver.
 *
 * Drawn upright and then tilted inside its own viewBox, so the page positions
 * one box rather than composing a rotation with whatever transform it is
 * already using. The split ring is drawn passing through the bow's opening —
 * the opening is a hole in the fill, so the ring behind shows through it and
 * the two read as linked instead of merely overlapping.
 *
 * The bow is openwork: an outer heart-shaped outline with an inner void cut out
 * of it by the even-odd rule, scroll ears at the shoulders and a small knop
 * hanging into the middle. A solid heart with one round piercing — the earlier
 * pass — reads as a gift-shop charm rather than as cast iron.
 */
export function AntiqueKey({ className }: AntiqueKeyProps) {
  const uid = useId().replace(/:/g, '')
  const ref = (name: string) => `${name}-${uid}`

  const bowOuter =
    'M 26 76 C 22 70 13 61 9 52 C 5 42 9 32.6 16 32.6 ' +
    'C 20.6 32.6 24.2 36.4 26 42.4 C 27.8 36.4 31.4 32.6 36 32.6 ' +
    'C 43 32.6 47 42 43 52 C 39 61 30 70 26 76 Z'
  const bowVoid =
    'M 26 65.5 C 23.6 61.8 18.2 56.4 15.8 51 C 13.4 45 15.8 40.2 19.6 40.2 ' +
    'C 22.4 40.2 24.6 43 26 47.4 C 27.4 43 29.6 40.2 32.4 40.2 ' +
    'C 36.2 40.2 38.6 45 36.2 51 C 33.8 56.4 28.4 61.8 26 65.5 Z'
  /* Four rings packed tight rather than spaced: a visible gap between them
     turns the collar into a coil spring. */
  const collars: readonly (readonly [number, number, number, number])[] = [
    [19, 74.6, 14, 3.2],
    [16.8, 77.9, 18.4, 3.6],
    [18.4, 81.6, 15.2, 3.2],
    [20.6, 84.9, 10.8, 2.6],
  ]
  const shaft = 'M 22.7 87.8 L 29.3 87.8 L 29.1 153.6 Q 26 156.6 22.9 153.6 Z'
  const bit =
    'M 23.4 129.6 L 6.4 129.6 L 6.4 139.4 L 14.4 139.4 L 14.4 144.6 L 6.4 144.6 ' +
    'L 6.4 152.2 L 16 152.2 L 16 157 L 23.4 157 Z'

  /* The upright drawing spans roughly 2..48 across and 2..158 down; the
     translate puts the centre of that box on the centre of the viewBox before
     the tilt, so the rotated key fills 122x158 without being clipped. */
  const place = `rotate(${KEY_TILT_DEGREES} 61 79) translate(35.9 -0.9)`

  return (
    <svg
      className={className}
      viewBox="0 0 122 158"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* User space, not bounding box: one light source has to run across the
            bow, the collars and the bit as if they were forged in one piece.
            The lit stop is narrow — a wide one turned the whole key to pewter. */}
        <linearGradient id={ref('broad')} gradientUnits="userSpaceOnUse" x1="5" y1="0" x2="48" y2="0">
          <stop offset="0" stopColor={IRON_DARK} />
          <stop offset="0.22" stopColor={IRON} />
          <stop offset="0.34" stopColor={IRON_LIT} />
          <stop offset="0.42" stopColor={IRON} />
          <stop offset="0.78" stopColor={IRON_DARK} />
          <stop offset="1" stopColor={IRON_DARK} />
        </linearGradient>
        <linearGradient
          id={ref('shaft')}
          gradientUnits="userSpaceOnUse"
          x1="22.6"
          y1="0"
          x2="29.4"
          y2="0"
        >
          <stop offset="0" stopColor={IRON_DARK} />
          <stop offset="0.26" stopColor={IRON} />
          <stop offset="0.62" stopColor={IRON} />
          <stop offset="1" stopColor={IRON_DARK} />
        </linearGradient>
        <linearGradient id={ref('ring')} gradientUnits="userSpaceOnUse" x1="3" y1="4" x2="34" y2="34">
          <stop offset="0" stopColor={IRON_LIT} />
          <stop offset="0.45" stopColor={IRON} />
          <stop offset="1" stopColor={IRON_DARK} />
        </linearGradient>
        <filter id={ref('cast')} x="-40%" y="-20%" width="180%" height="140%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      <g transform={place}>
        <g
          transform="translate(2.6 3.4)"
          fill="var(--color-ink)"
          opacity="0.2"
          filter={`url(#${ref('cast')})`}
        >
          <path d={bowOuter} />
          {collars.map(([x, y, w, h]) => (
            <rect key={`s-${y}`} x={x} y={y} width={w} height={h} rx={h / 2} />
          ))}
          <path d={shaft} />
          <path d={bit} />
        </g>

        {/* Two turns of a split ring. It is nearly as wide as the bow in the
            photograph, and it is the one part of the key that is bent wire
            rather than cast, so it is drawn thin. It is set low enough that its
            lower arc crosses the bow's top cusp: in the photograph the ring
            hangs through the opening, it does not sit above it. */}
        <g fill="none" strokeWidth="2.5" strokeLinecap="round">
          <path d={ellipseArc(20, 21.5, 14.4, 14.4, 310, 282)} stroke={`url(#${ref('ring')})`} />
          <path
            d={ellipseArc(21, 22.6, 14.4, 14.4, 316, 240)}
            stroke={IRON_DARK}
            opacity="0.6"
          />
        </g>

        <path
          d={`${bowOuter} ${bowVoid}`}
          fillRule="evenodd"
          fill={`url(#${ref('broad')})`}
        />
        {/* Scroll ears cast onto the shoulders, and the central member that
            carries the knop. The member runs the full depth of the opening,
            which is what divides the bow into the two kidney-shaped voids the
            photograph shows; a single undivided heart read as a charm. */}
        <g fill={`url(#${ref('broad')})`}>
          <circle cx="8.2" cy="45.4" r="3.3" />
          <circle cx="43.8" cy="45.4" r="3.3" />
          <path d="M 24.9 43.4 L 27.1 43.4 L 26.6 64.4 L 25.4 64.4 Z" />
          <circle cx="26" cy="53.6" r="3.5" />
        </g>
        {/* A thread of light along the bow's inner wall, where the casting was
            filed back; without it the openwork closes up at small sizes. */}
        <path
          d={bowVoid}
          fill="none"
          stroke={IRON_HI}
          strokeWidth="0.8"
          opacity="0.35"
        />

        <g fill={`url(#${ref('broad')})`}>
          {collars.map(([x, y, w, h]) => (
            <rect key={`c-${y}`} x={x} y={y} width={w} height={h} rx={h / 2} />
          ))}
          <rect x="20.4" y="117.4" width="11.2" height="3.2" rx="1.6" />
          <rect x="21.2" y="121" width="9.6" height="2.8" rx="1.4" />
        </g>

        <path d={shaft} fill={`url(#${ref('shaft')})`} />
        <rect x="23.4" y="89.4" width="1" height="62" rx="0.5" fill={IRON_HI} opacity="0.4" />

        <path d={bit} fill={`url(#${ref('broad')})`} />
        <path
          d="M 22.6 130.8 L 7.6 130.8 M 22.6 155.8 L 17.2 155.8 M 13.4 140.6 L 7.6 140.6"
          fill="none"
          stroke={IRON_HI}
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.38"
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
