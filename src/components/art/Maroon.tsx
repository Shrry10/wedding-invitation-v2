import { useId, type CSSProperties, type ReactNode } from 'react'
import { jitter, scallopedRect } from './geometry'

/**
 * The maroon stationery: two envelopes, the instant photo and the filigree
 * frame.
 *
 * Every one of these is a photograph of real paper in the reference, so none of
 * them may be a flat fill. Each maroon surface carries a linear gradient, a
 * fibre grain, and a crease wherever the sheet was actually folded — the crease
 * is what separates a folded envelope from a triangle laid on a rectangle.
 */

/* --------------------------------------------------------------------------
   Shared paper treatment
   -------------------------------------------------------------------------- */

/** Ids must survive two instances on one page, and `:` breaks `url(#…)`. */
function useLocalId(): string {
  return useId().replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * The fibre grain of the stock.
 *
 * Frequency is anisotropic and low: the reference is a soft, cloudy mottle with
 * a faint vertical drift, not a fine even speckle. Raising the frequency here
 * turns the paper into brushed metal, which was the first thing that went wrong.
 */
function Grain({ id, frequency, seed }: { id: string; frequency: string; seed: number }) {
  return (
    <filter
      id={id}
      x="-5%"
      y="-5%"
      width="110%"
      height="110%"
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency={frequency}
        numOctaves={5}
        seed={seed}
        result="fibre"
      />
      {/* Luminance only — the turbulence's own alpha would punch holes in the sheet. */}
      <feColorMatrix
        in="fibre"
        type="matrix"
        values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1"
      />
    </filter>
  )
}

function GrainWash({
  filterId,
  clipId,
  width,
  height,
  opacity,
}: {
  filterId: string
  clipId: string
  width: number
  height: number
  opacity: number
}) {
  return (
    <g clipPath={`url(#${clipId})`} style={{ mixBlendMode: 'overlay', opacity }}>
      <rect x={0} y={0} width={width} height={height} filter={`url(#${filterId})`} />
    </g>
  )
}

/**
 * A matte maroon face under a soft key light from the upper left.
 *
 * `lift` and `fall` are percentages of the light and deep maroons mixed into
 * the base at the two ends, so a face that catches the light and a face in
 * shadow are the same gradient with two numbers changed.
 */
function MaroonFace({
  id,
  x1,
  y1,
  x2,
  y2,
  lift,
  fall,
}: {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  lift: number
  fall: number
}) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      <stop
        offset="0"
        stopColor={`color-mix(in srgb, var(--color-maroon-light) ${lift}%, var(--color-maroon))`}
      />
      <stop offset="0.52" stopColor="var(--color-maroon)" />
      <stop
        offset="1"
        stopColor={`color-mix(in srgb, var(--color-maroon-deep) ${fall}%, var(--color-maroon))`}
      />
    </linearGradient>
  )
}

const LAYER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
}

/** Where two straight creases cross, so a fold can be cut off at the one above it. */
function crossing(
  a: readonly [number, number],
  b: readonly [number, number],
  c: readonly [number, number],
  d: readonly [number, number],
): [number, number] {
  const denom = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0])
  const p = a[0] * b[1] - a[1] * b[0]
  const q = c[0] * d[1] - c[1] * d[0]
  return [
    (p * (c[0] - d[0]) - (a[0] - b[0]) * q) / denom,
    (p * (c[1] - d[1]) - (a[1] - b[1]) * q) / denom,
  ]
}

const f1 = (n: number): string => (Math.round(n * 10) / 10).toString()

/* --------------------------------------------------------------------------
   Sealed envelope — page 0
   -------------------------------------------------------------------------- */

const SEALED = { x: 24, y: 14, w: 1352, h: 948 } as const
const SEALED_VIEW = { w: 1400, h: 1020 } as const
/**
 * The flap point sits at seven tenths of the height, not at the middle. In the
 * reference this is the single strongest cue that the envelope is a real one:
 * a flap that stops at the middle reads as an icon of an envelope.
 */
const FLAP_POINT: readonly [number, number] = [700, SEALED.y + SEALED.h * 0.7]

/**
 * Where the wax seal belongs on `<SealedEnvelope />`.
 *
 * The seal is not drawn here — it is a separate object pressed over the flap
 * point, overlapping it rather than balancing on it, and in the reference its
 * centre sits a little above the point. `left`, `top` and `diameter` are
 * fractions of the rendered box, so a page can place an absolutely positioned
 * seal without knowing the viewBox.
 */
export const SEALED_ENVELOPE_SEAL = {
  viewBox: { width: SEALED_VIEW.w, height: SEALED_VIEW.h },
  cx: FLAP_POINT[0],
  cy: FLAP_POINT[1] - 18,
  r: 135,
  left: FLAP_POINT[0] / SEALED_VIEW.w,
  top: (FLAP_POINT[1] - 18) / SEALED_VIEW.h,
  diameter: 270 / SEALED_VIEW.w,
} as const

export function SealedEnvelope({ className }: { className?: string | undefined }) {
  const uid = useLocalId()
  const { x, y, w, h } = SEALED
  const right = x + w
  const bottom = y + h
  const [px, py] = FLAP_POINT

  // The flap's own tip is a fold, not a cut, so it is slightly blunt.
  const tip = 24
  const flapEdges =
    `M ${x} ${y} L ${f1(px - tip)} ${f1(py - tip)} ` +
    `Q ${px} ${f1(py + 6)} ${f1(px + tip)} ${f1(py - tip)} L ${right} ${y}`

  // The side flaps beneath run from the bottom corners up towards the top of
  // the sheet and vanish under the top flap; they do not meet at its point.
  const apex: readonly [number, number] = [px, y + 40]
  const leftEnd = crossing([x, bottom], apex, [x, y], FLAP_POINT)
  const rightEnd = crossing([right, bottom], apex, [right, y], FLAP_POINT)
  const gussetEdges =
    `M ${x} ${bottom} L ${f1(leftEnd[0])} ${f1(leftEnd[1])} ` +
    `M ${right} ${bottom} L ${f1(rightEnd[0])} ${f1(rightEnd[1])}`

  return (
    <svg
      className={className}
      viewBox={`0 0 ${SEALED_VIEW.w} ${SEALED_VIEW.h}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <MaroonFace id={`${uid}-body`} x1={0.1} y1={0} x2={0.8} y2={1} lift={6} fall={92} />
        <MaroonFace id={`${uid}-flap`} x1={0.15} y1={0} x2={0.75} y2={1} lift={118} fall={8} />
        <Grain id={`${uid}-grain`} frequency="0.022 0.014" seed={7} />
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${uid}-drop`} x="-15%" y="-15%" width="130%" height="145%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <clipPath id={`${uid}-clip`}>
          <rect x={x} y={y} width={w} height={h} rx={12} />
        </clipPath>
        <radialGradient id={`${uid}-key`} cx="0.32" cy="0.12" r="0.8">
          <stop offset="0" stopColor="var(--color-maroon-light)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--color-maroon-light)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-seat`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.7" stopColor="var(--color-maroon-deep)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--color-maroon-deep)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The sheet lies flat on the page, so the shadow is close, soft and mostly beneath. */}
      <g filter={`url(#${uid}-drop)`}>
        <rect
          x={x + 26}
          y={y + 24}
          width={w - 52}
          height={h - 6}
          rx={12}
          fill="var(--color-ink)"
          fillOpacity={0.34}
        />
      </g>

      <g clipPath={`url(#${uid}-clip)`}>
        <rect x={x} y={y} width={w} height={h} fill={`url(#${uid}-body)`} />
        <rect x={x} y={y} width={w} height={h} fill={`url(#${uid}-key)`} />

        {/* Folded paper never lies perfectly flat, so each crease is a dark line
            with a lit one just beside it rather than a single stroke. */}
        <path
          d={gussetEdges}
          fill="none"
          stroke="var(--color-maroon-deep)"
          strokeWidth={3.4}
          strokeOpacity={0.62}
        />
        <path
          d={gussetEdges}
          fill="none"
          stroke="var(--color-maroon-light)"
          strokeWidth={2.6}
          strokeOpacity={0.6}
          transform="translate(4 3)"
        />

        {/* The flap stands a paper's thickness proud, so it shades the body beneath it. */}
        <path
          d={flapEdges}
          fill="none"
          stroke="var(--color-maroon-deep)"
          strokeWidth={20}
          strokeOpacity={0.42}
          filter={`url(#${uid}-soft)`}
        />
        <path d={`${flapEdges} Z`} fill={`url(#${uid}-flap)`} />
        {/* A wash over the flap alone, so the two thicknesses of paper never
            resolve to the same tone however the gradients are tuned. */}
        <path d={`${flapEdges} Z`} fill="var(--color-maroon-light)" fillOpacity={0.2} />
        <path
          d={flapEdges}
          fill="none"
          stroke="var(--color-maroon-deep)"
          strokeWidth={3.4}
          strokeOpacity={0.85}
        />
        <path
          d={flapEdges}
          fill="none"
          stroke="var(--color-maroon-light)"
          strokeWidth={3}
          strokeOpacity={0.72}
          transform="translate(0 -4)"
        />

        <GrainWash
          filterId={`${uid}-grain`}
          clipId={`${uid}-clip`}
          width={SEALED_VIEW.w}
          height={SEALED_VIEW.h}
          opacity={0.19}
        />

        {/* The wax the page drops here is thick enough to cast a rim of shadow;
            drawn under the slot so the seal lands in a dent, not on a decal. */}
        <circle
          cx={SEALED_ENVELOPE_SEAL.cx}
          cy={SEALED_ENVELOPE_SEAL.cy + 10}
          r={SEALED_ENVELOPE_SEAL.r * 1.16}
          fill={`url(#${uid}-seat)`}
        />

        {/* The cut edge of the stock catches the light along the bottom. */}
        <rect
          x={x}
          y={bottom - 4}
          width={w}
          height={4}
          fill="var(--color-maroon-light)"
          fillOpacity={0.28}
        />
      </g>
    </svg>
  )
}

/* --------------------------------------------------------------------------
   Open envelope — pages 1 and 2
   -------------------------------------------------------------------------- */

const OPEN_VIEW = { w: 1000, h: 1120 } as const
const POCKET = { left: 40, right: 960, top: 470, bottom: 1088 } as const
/** The V of the pocket bites down two fifths of the front, as the reference does. */
const NOTCH: readonly [number, number] = [500, 745]
const FLAP_APEX: readonly [number, number] = [500, 62]

/** Where the wax seal belongs on `<OpenEnvelope />` — pressed over the notch. */
export const OPEN_ENVELOPE_SEAL = {
  viewBox: { width: OPEN_VIEW.w, height: OPEN_VIEW.h },
  cx: NOTCH[0],
  cy: 758,
  r: 102,
  left: NOTCH[0] / OPEN_VIEW.w,
  top: 758 / OPEN_VIEW.h,
  diameter: 204 / OPEN_VIEW.w,
} as const

/**
 * The slot a card occupies so that it rises out of the pocket.
 *
 * Inset from the flap on all three sides: the flap's tip has to clear the
 * card's top edge and its shoulders have to show past the card's sides, or the
 * envelope stops reading as open. The bottom runs well below the notch so no
 * card ever ends above the paper that should be covering it.
 */
const OPEN_ENVELOPE_CONTENT: CSSProperties = {
  position: 'absolute',
  display: 'block',
  left: '12%',
  top: '9.8%',
  width: '76%',
  height: '72%',
}

export function OpenEnvelope({
  className,
  children,
}: {
  className?: string | undefined
  children?: ReactNode | undefined
}) {
  const uid = useLocalId()
  const flapEdges =
    `M ${POCKET.left} ${POCKET.top} L ${FLAP_APEX[0] - 20} ${FLAP_APEX[1] + 18} ` +
    `Q ${FLAP_APEX[0]} ${FLAP_APEX[1] - 4} ${FLAP_APEX[0] + 20} ${FLAP_APEX[1] + 18} ` +
    `L ${POCKET.right} ${POCKET.top}`
  // The skirt below the fold line is hidden by the pocket; it exists only so no
  // white page shows through the sliver between the flap and the notch.
  const flap = `${flapEdges} L ${POCKET.right} ${POCKET.bottom} L ${POCKET.left} ${POCKET.bottom} Z`

  const notchEdges =
    `M ${POCKET.left} ${POCKET.top} L ${NOTCH[0] - 26} ${NOTCH[1] - 16} ` +
    `Q ${NOTCH[0]} ${NOTCH[1] + 10} ${NOTCH[0] + 26} ${NOTCH[1] - 16} ` +
    `L ${POCKET.right} ${POCKET.top}`
  const pocket =
    `${notchEdges} L ${POCKET.right} ${POCKET.bottom - 16} ` +
    `Q ${POCKET.right} ${POCKET.bottom} ${POCKET.right - 16} ${POCKET.bottom} ` +
    `L ${POCKET.left + 16} ${POCKET.bottom} ` +
    `Q ${POCKET.left} ${POCKET.bottom} ${POCKET.left} ${POCKET.bottom - 16} Z`
  const gusset =
    `M ${POCKET.left} ${POCKET.bottom} L ${NOTCH[0]} ${NOTCH[1]} L ${POCKET.right} ${POCKET.bottom}`

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'block',
        aspectRatio: `${OPEN_VIEW.w} / ${OPEN_VIEW.h}`,
      }}
    >
      <svg
        style={LAYER}
        viewBox={`0 0 ${OPEN_VIEW.w} ${OPEN_VIEW.h}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <MaroonFace id={`${uid}-flap`} x1={0.3} y1={0} x2={0.7} y2={1} lift={16} fall={52} />
          <Grain id={`${uid}-grain`} frequency="0.026 0.016" seed={13} />
          <clipPath id={`${uid}-flapclip`}>
            <path d={flap} />
          </clipPath>
          {/* The shade along the crease. A blurred stroke laid over the fold
              gave it two edges of its own and read as a band painted across
              the paper; a gradient only ever has one darkest line, the fold
              itself, and nothing to catch the eye above or below it. */}
          <linearGradient
            id={`${uid}-crease`}
            x1={0}
            y1={POCKET.top - 260}
            x2={0}
            y2={POCKET.top + 320}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="var(--color-maroon-deep)" stopOpacity="0" />
            <stop offset="0.448" stopColor="var(--color-maroon-deep)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--color-maroon-deep)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${uid}-flapclip)`}>
          <path d={flap} fill={`url(#${uid}-flap)`} />
          {/* Thrown back behind the card, the flap darkens towards its own crease. */}
          <rect
            x={0}
            y={0}
            width={OPEN_VIEW.w}
            height={OPEN_VIEW.h}
            fill={`url(#${uid}-crease)`}
          />
          <GrainWash
            filterId={`${uid}-grain`}
            clipId={`${uid}-flapclip`}
            width={OPEN_VIEW.w}
            height={OPEN_VIEW.h}
            opacity={0.17}
          />
        </g>
        {/* The folded edge of the flap is the brightest line on the whole object. */}
        <path
          d={flapEdges}
          fill="none"
          stroke="var(--color-maroon-light)"
          strokeWidth={4}
          strokeOpacity={0.55}
          strokeLinejoin="round"
        />
      </svg>

      <span style={OPEN_ENVELOPE_CONTENT}>{children}</span>

      <svg
        style={LAYER}
        viewBox={`0 0 ${OPEN_VIEW.w} ${OPEN_VIEW.h}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <MaroonFace id={`${uid}-side`} x1={0.05} y1={0} x2={0.95} y2={1} lift={30} fall={48} />
          <MaroonFace id={`${uid}-front`} x1={0.2} y1={0} x2={0.8} y2={1} lift={54} fall={26} />
          <Grain id={`${uid}-grain2`} frequency="0.024 0.015" seed={21} />
          <filter id={`${uid}-drop`} x="-15%" y="-15%" width="130%" height="140%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <clipPath id={`${uid}-pocketclip`}>
            <path d={pocket} />
          </clipPath>
        </defs>

        <g filter={`url(#${uid}-drop)`}>
          <path d={pocket} fill="var(--color-ink)" fillOpacity={0.34} transform="translate(0 20)" />
        </g>

        <g clipPath={`url(#${uid}-pocketclip)`}>
          <path d={pocket} fill={`url(#${uid}-side)`} />
          {/* The bottom gusset folds up over both side flaps, so it catches more light. */}
          <path d={`${gusset} Z`} fill={`url(#${uid}-front)`} />
          <path
            d={gusset}
            fill="none"
            stroke="var(--color-maroon-deep)"
            strokeWidth={3}
            strokeOpacity={0.36}
          />
          <path
            d={gusset}
            fill="none"
            stroke="var(--color-maroon-light)"
            strokeWidth={2}
            strokeOpacity={0.22}
            transform="translate(0 -4)"
          />
          {/* Contact shadow where the card disappears behind the notch. */}
          <path
            d={notchEdges}
            fill="none"
            stroke="var(--color-maroon-deep)"
            strokeWidth={30}
            strokeOpacity={0.5}
            style={{ filter: 'blur(7px)' }}
          />
          <GrainWash
            filterId={`${uid}-grain2`}
            clipId={`${uid}-pocketclip`}
            width={OPEN_VIEW.w}
            height={OPEN_VIEW.h}
            opacity={0.19}
          />
          <rect
            x={POCKET.left}
            y={POCKET.bottom - 4}
            width={POCKET.right - POCKET.left}
            height={4}
            fill="var(--color-maroon-light)"
            fillOpacity={0.26}
          />
        </g>
        {/* The cut edge of the notch reads as a hairline of lit paper. */}
        <path
          d={notchEdges}
          fill="none"
          stroke="var(--color-maroon-light)"
          strokeWidth={3}
          strokeOpacity={0.45}
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

/* --------------------------------------------------------------------------
   Instant photo — pages 1 and 3
   -------------------------------------------------------------------------- */

const POLAROID_VIEW = { w: 600, h: 718 } as const
const CARD = { x: 14, y: 8, w: 572, h: 690 } as const
/** Narrow margins on three sides, a deep one below — the instant-film proportion. */
const WELL = { x: 53, y: 63, w: 492, h: 501 } as const
const CAPTION_BASELINE = CARD.y + CARD.h * 0.93

/**
 * Caption size from caption length.
 *
 * Which script face actually loads is not knowable here, and the wide-digit
 * fallbacks run a date clean off the card at a fixed size. Budgeting a
 * generous em per character costs a little size on short captions and keeps
 * every caption inside the border.
 */
function captionSize(caption: string): number {
  const budget = CARD.w * 0.64
  return Math.min(56, budget / (Math.max(4, caption.length) * 1.15))
}

export function Polaroid({
  caption,
  tilt,
  className,
  children,
}: {
  caption?: string | undefined
  tilt?: number | undefined
  className?: string | undefined
  children?: ReactNode | undefined
}) {
  const uid = useLocalId()
  const angle = tilt ?? 0

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'block',
        aspectRatio: `${POLAROID_VIEW.w} / ${POLAROID_VIEW.h}`,
        transform: angle === 0 ? undefined : `rotate(${angle}deg)`,
      }}
    >
      <svg
        style={LAYER}
        viewBox={`0 0 ${POLAROID_VIEW.w} ${POLAROID_VIEW.h}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* The mount is a greyer, browner burgundy than the envelopes — the
              same ink on a matte board rather than on sized envelope stock. */}
          <linearGradient id={`${uid}-card`} x1={0.08} y1={0} x2={0.92} y2={1}>
            <stop
              offset="0"
              stopColor="color-mix(in srgb, var(--color-maroon) 74%, var(--color-cream-shade))"
            />
            <stop
              offset="0.55"
              stopColor="color-mix(in srgb, var(--color-maroon) 82%, var(--color-cream-shade))"
            />
            <stop
              offset="1"
              stopColor="color-mix(in srgb, var(--color-maroon) 88%, var(--color-maroon-deep))"
            />
          </linearGradient>
          <Grain id={`${uid}-grain`} frequency="0.09 0.06" seed={31} />
          <filter id={`${uid}-drop`} x="-15%" y="-15%" width="130%" height="135%">
            <feGaussianBlur stdDeviation="5.5" />
          </filter>
          <clipPath id={`${uid}-clip`}>
            <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={2} />
          </clipPath>
        </defs>

        <g filter={`url(#${uid}-drop)`}>
          <rect
            x={CARD.x + 10}
            y={CARD.y + 12}
            width={CARD.w - 20}
            height={CARD.h}
            rx={2}
            fill="var(--color-ink)"
            fillOpacity={0.36}
          />
        </g>

        <g clipPath={`url(#${uid}-clip)`}>
          <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} fill={`url(#${uid}-card)`} />
          <GrainWash
            filterId={`${uid}-grain`}
            clipId={`${uid}-clip`}
            width={POLAROID_VIEW.w}
            height={POLAROID_VIEW.h}
            opacity={0.3}
          />
        </g>

        {/* The well is the mount's deepest shade, not a pale print. The photograph
            is laid over it as HTML, and where the two edges antialias, on a
            tilted print especially, whatever the well is painted shows through
            as a hairline. A pale well drew a white line round every
            photograph; a dark one reads as the shadow of the recess. */}
        <rect
          x={WELL.x}
          y={WELL.y}
          width={WELL.w}
          height={WELL.h}
          fill="var(--color-maroon-deep)"
        />
        {/* The print sits a fraction below the border, so its top and left are shaded. */}
        <path
          d={`M ${WELL.x} ${WELL.y + WELL.h} L ${WELL.x} ${WELL.y} L ${WELL.x + WELL.w} ${WELL.y}`}
          fill="none"
          stroke="var(--color-maroon-deep)"
          strokeWidth={6}
          strokeOpacity={0.16}
          style={{ filter: 'blur(3px)' }}
        />

        {caption === undefined ? null : (
          <text
            x={POLAROID_VIEW.w / 2}
            y={CAPTION_BASELINE}
            textAnchor="middle"
            fill="var(--color-paper)"
            fillOpacity={0.94}
            fontSize={captionSize(caption)}
            fontStyle="italic"
            fontFamily="'Pinyon Script', 'Snell Roundhand', 'Apple Chancery', cursive"
          >
            {caption}
          </text>
        )}
      </svg>

      <span
        style={{
          position: 'absolute',
          display: 'block',
          left: `${(WELL.x / POLAROID_VIEW.w) * 100}%`,
          top: `${(WELL.y / POLAROID_VIEW.h) * 100}%`,
          width: `${(WELL.w / POLAROID_VIEW.w) * 100}%`,
          height: `${(WELL.h / POLAROID_VIEW.h) * 100}%`,
          overflow: 'hidden',
        }}
      >
        {children}
      </span>
    </span>
  )
}

/* --------------------------------------------------------------------------
   Filigree frame — page 2
   -------------------------------------------------------------------------- */

const OPENING_W = 1000
/** The worked band, how far a lobe reaches past it, and the centre crests. */
const BAND = 150
const REACH = 46
const CREST = 86
const MARGIN = BAND + CREST
const DEFAULT_RATIO = 1.4

/**
 * Width-to-height of the opening, accepted either as a number or as the CSS
 * shorthand a caller would hand `aspect-ratio` ("4 / 3"), so the frame and the
 * thing it frames can be described the same way.
 */
function parseRatio(ratio: number | string | undefined): number {
  if (typeof ratio === 'number') return ratio > 0 ? ratio : DEFAULT_RATIO
  if (typeof ratio === 'string') {
    const parts = ratio.split('/')
    const w = Number(parts[0])
    const h = parts.length > 1 ? Number(parts[1]) : 1
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return w / h
  }
  return DEFAULT_RATIO
}

/**
 * A loop of cord, rooted at the origin and reaching one unit upwards.
 *
 * Every shape in this frame is this one loop at some size and angle. Needle
 * lace is built the same way — the pattern is not drawn, it is one stitch
 * repeated — and following that is what stops the frame reading as a printed
 * silhouette with a texture on it.
 *
 * `k` shrinks the loop about its own centre, which gives the eye cut out of a
 * larger one. Cutwork is a cord of roughly even width around a hole, and a
 * concentric copy is near enough that at this size.
 */
function loopPath(k: number): string {
  const p = (x: number, y: number): string =>
    `${(x * k).toFixed(3)} ${(-0.5 + (y + 0.5) * k).toFixed(3)}`
  return (
    `M ${p(0, 0)} C ${p(-0.34, -0.22)} ${p(-0.5, -0.6)} ${p(-0.3, -0.85)} ` +
    `C ${p(-0.13, -1.04)} ${p(0.13, -1.04)} ${p(0.3, -0.85)} ` +
    `C ${p(0.5, -0.6)} ${p(0.34, -0.22)} ${p(0, 0)} Z`
  )
}

const LOOP = loopPath(1)
/** The loop with its eye cut out; evenodd makes the second subpath a hole. */
const CUTWORK = `${LOOP} ${loopPath(0.46)}`

type Loop = { x: number; y: number; rot: number; scale: number; wide: number; sunk: boolean }
type Dot = { cx: number; cy: number; r: number }

/**
 * Map a point on one edge of the frame into absolute coordinates.
 *
 * Edge-local `u` runs along the edge and `v` runs inward from the outer
 * boundary of the band, so one description of the ornament serves all four
 * sides and the corners stay consistent. Edges are numbered clockwise from the
 * top, and that number times ninety degrees points a motif outward.
 */
function onEdge(
  edge: number,
  u: number,
  v: number,
  x0: number,
  y0: number,
  w: number,
  h: number,
): [number, number] {
  if (edge === 0) return [x0 + u, y0 + v]
  if (edge === 1) return [x0 + w - v, y0 + u]
  if (edge === 2) return [x0 + w - u, y0 + h - v]
  return [x0 + v, y0 + h - u]
}

/**
 * Every loop and bead in the frame.
 *
 * Two ranks do the work. The outer rank is cut clean through, so the page shows
 * between the loops and the outline comes out ragged rather than scalloped; the
 * sunk rank is worked over the solid part of the band and reads as relief. Three
 * accents break the repeat — a taller crest at the middle of each side, a
 * rosette at each corner, and a filling in every bay — because a plain repeat,
 * however fine, comes back looking like a paper doily.
 */
function frameLace(
  x0: number,
  y0: number,
  w: number,
  h: number,
): { loops: Loop[]; beads: Dot[] } {
  const loops: Loop[] = []
  const beads: Dot[] = []

  /** A loop rooted `v` deep in the band, aimed `deg` off the outward normal. */
  const loop = (
    edge: number,
    u: number,
    v: number,
    deg: number,
    scale: number,
    wide: number,
    sunk: boolean,
  ): void => {
    const p = onEdge(edge, u, v, x0, y0, w, h)
    loops.push({ x: p[0], y: p[1], rot: edge * 90 + deg, scale, wide, sunk })
  }

  for (let edge = 0; edge < 4; edge += 1) {
    const length = edge % 2 === 0 ? w : h
    let count = Math.max(5, Math.round(length / (BAND * 0.86)))
    // An odd count leaves one unit exactly on the midpoint to carry the crest.
    if (count % 2 === 0) count += 1
    const step = length / count
    const middle = (count - 1) / 2

    for (let i = 0; i < count; i += 1) {
      const u = step * (i + 0.5)
      const crest = i === middle
      // Hand-worked lace is never metronomic; a degree or two reads warm.
      const wobble = (jitter(edge * 17 + i) - 0.5) * 4
      // The rim lobes are short and fat, and the filigree that threads between
      // them is long and thin. That difference in proportion, more than any
      // amount of detail, is what reads as lace rather than as a scallop.
      const root = BAND * 0.34
      const tall = (crest ? CREST : REACH) + root

      loop(edge, u, root, wobble, tall, crest ? 0.6 : 0.8, false)
      loop(edge, u, root, wobble - 40, tall * (crest ? 0.74 : 0.62), 0.86, false)
      loop(edge, u, root, wobble + 40, tall * (crest ? 0.74 : 0.62), 0.86, false)
      if (crest) {
        // The crest is a fan, not one tall loop: a single lobe this size comes
        // out reading as a keyhole punched in the rim.
        loop(edge, u, root, wobble - 19, tall * 0.86, 0.5, false)
        loop(edge, u, root, wobble + 19, tall * 0.86, 0.5, false)
      }

      // The bay between two fleurs gets its own filling, which is what keeps
      // the outline ragged instead of scalloped.
      loop(edge, u + step * 0.5, BAND * 0.26, 0, BAND * 0.26 + REACH * 0.62, 0.88, false)
      loop(edge, u + step * 0.5, BAND * 0.4, -56, BAND * 0.32, 1, false)
      loop(edge, u + step * 0.5, BAND * 0.4, 56, BAND * 0.32, 1, false)

      // Threaded from the picture edge out between the rim lobes; whatever of
      // it falls on the solid core is covered by it, which is how the two ranks
      // join without a seam.
      loop(edge, u, BAND * 0.95, 0, BAND * 0.86, 0.4, false)
      loop(edge, u, BAND * 0.95, -27, BAND * 0.68, 0.46, false)
      loop(edge, u, BAND * 0.95, 27, BAND * 0.68, 0.46, false)
      loop(edge, u + step * 0.5, BAND * 0.95, 0, BAND * 0.6, 0.44, false)

      // Relief worked on the solid band: a fan rooted at the picture edge.
      loop(edge, u + step * 0.5, BAND * 0.99, -40, BAND * 0.44, 0.6, true)
      loop(edge, u + step * 0.5, BAND * 0.99, 40, BAND * 0.44, 0.6, true)
      loop(edge, u, BAND * 0.99, 0, BAND * 0.34, 0.75, true)

      beads.push(dot(onEdge(edge, u, root, x0, y0, w, h), BAND * 0.045))
      beads.push(dot(onEdge(edge, u + step * 0.5, BAND * 0.52, x0, y0, w, h), BAND * 0.03))
      beads.push(dot(onEdge(edge, u + step * 0.25, BAND * 0.97, x0, y0, w, h), BAND * 0.028))
      beads.push(dot(onEdge(edge, u - step * 0.25, BAND * 0.97, x0, y0, w, h), BAND * 0.028))
    }
  }

  // Corners carry a heavier rosette, as they do on the reference frame.
  const corners: [number, number, number][] = [
    [x0, y0, -45],
    [x0 + w, y0, 45],
    [x0 + w, y0 + h, 135],
    [x0, y0 + h, 225],
  ]
  for (const [cx, cy, rot] of corners) {
    const a = (rot * Math.PI) / 180
    const inward: [number, number] = [-Math.sin(a), Math.cos(a)]
    const rx = cx + inward[0] * (BAND * 0.72)
    const ry = cy + inward[1] * (BAND * 0.72)
    for (const [deg, scale, wide] of [
      [0, BAND * 0.96, 0.52],
      [-44, BAND * 0.72, 0.66],
      [44, BAND * 0.72, 0.66],
      [-84, BAND * 0.5, 0.8],
      [84, BAND * 0.5, 0.8],
    ] as const) {
      loops.push({ x: rx, y: ry, rot: rot + deg, scale, wide, sunk: false })
    }
    loops.push({ x: rx, y: ry, rot: rot + 180, scale: BAND * 0.46, wide: 0.66, sunk: true })
    beads.push({ cx: rx, cy: ry, r: BAND * 0.06 })
  }

  return { loops, beads }
}

function dot(p: [number, number], r: number): Dot {
  return { cx: p[0], cy: p[1], r }
}

/**
 * One cut loop.
 *
 * Filled from a gradient laid over the whole frame rather than over the loop,
 * so a hundred loops read as one piece of worked material catching one light
 * instead of a hundred separately shaded beads.
 */
function CutLoop({ loop, fill }: { loop: Loop; fill: string }) {
  const t =
    `translate(${loop.x.toFixed(1)} ${loop.y.toFixed(1)}) ` +
    `rotate(${loop.rot.toFixed(1)}) scale(${(loop.scale * loop.wide).toFixed(1)} ${loop.scale.toFixed(1)})`
  const cord = 3.4 / loop.scale
  return (
    <g transform={t}>
      <path d={CUTWORK} fillRule="evenodd" fill={fill} />
      <path
        d={LOOP}
        fill="none"
        stroke="var(--color-maroon-deep)"
        strokeWidth={cord}
        strokeOpacity={0.55}
      />
      <path
        d={loopPath(0.46)}
        fill="none"
        stroke="var(--color-maroon-deep)"
        strokeWidth={cord}
        strokeOpacity={0.4}
      />
      {/* The light comes from the upper left, so the cord is lit on that side. */}
      <path
        d={loopPath(0.78)}
        fill="none"
        stroke="var(--color-maroon-light)"
        strokeWidth={cord * 0.8}
        strokeOpacity={0.5}
      />
    </g>
  )
}

/** The same loop worked in relief on the solid band: no hole, only shading. */
function SunkLoop({ loop }: { loop: Loop }) {
  const t =
    `translate(${loop.x.toFixed(1)} ${loop.y.toFixed(1)}) ` +
    `rotate(${loop.rot.toFixed(1)}) scale(${(loop.scale * loop.wide).toFixed(1)} ${loop.scale.toFixed(1)})`
  const cord = 3.4 / loop.scale
  return (
    <g transform={t}>
      <path
        d={LOOP}
        fill="var(--color-maroon-deep)"
        fillOpacity={0.3}
        stroke="var(--color-maroon-deep)"
        strokeWidth={cord}
        strokeOpacity={0.7}
      />
      <path
        d={LOOP}
        transform="translate(-0.015 -0.02)"
        fill="none"
        stroke="var(--color-maroon-light)"
        strokeWidth={cord * 0.7}
        strokeOpacity={0.55}
      />
      <path
        d={loopPath(0.44)}
        fill="var(--color-maroon-light)"
        fillOpacity={0.22}
        stroke="var(--color-maroon-deep)"
        strokeWidth={cord * 0.7}
        strokeOpacity={0.5}
      />
    </g>
  )
}

export function OrnateFrame({
  className,
  children,
  ratio,
}: {
  className?: string | undefined
  children?: ReactNode | undefined
  ratio?: number | string | undefined
}) {
  const uid = useLocalId()
  const openingH = Math.round(OPENING_W / parseRatio(ratio))
  const viewW = OPENING_W + MARGIN * 2
  const viewH = openingH + MARGIN * 2
  const baseX = CREST
  const baseY = CREST
  const baseW = OPENING_W + BAND * 2
  const baseH = openingH + BAND * 2

  const { loops, beads } = frameLace(baseX, baseY, baseW, baseH)

  // The solid core of the band. Clockwise outside, anticlockwise inside, so the
  // opening stays a hole under the nonzero rule.
  const core = BAND * 0.6
  const ring =
    `${scallopedRect(baseX + core, baseY + core, baseW - core * 2, baseH - core * 2, BAND * 0.42)} ` +
    `M ${MARGIN} ${MARGIN} V ${MARGIN + openingH} H ${MARGIN + OPENING_W} V ${MARGIN} Z`
  // Nothing may stray over the picture, so the whole worked piece is clipped to
  // the page outside the opening.
  const outside =
    `M 0 0 H ${viewW} V ${viewH} H 0 Z ` +
    `M ${MARGIN} ${MARGIN} V ${MARGIN + openingH} H ${MARGIN + OPENING_W} V ${MARGIN} Z`

  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'block', aspectRatio: `${viewW} / ${viewH}` }}
    >
      <span
        style={{
          position: 'absolute',
          display: 'block',
          left: `${(MARGIN / viewW) * 100}%`,
          top: `${(MARGIN / viewH) * 100}%`,
          width: `${(OPENING_W / viewW) * 100}%`,
          height: `${(openingH / viewH) * 100}%`,
          overflow: 'hidden',
        }}
      >
        {children}
      </span>

      <svg
        style={{ ...LAYER, pointerEvents: 'none' }}
        viewBox={`0 0 ${viewW} ${viewH}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={`${uid}-band`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={viewW * 0.85}
            y2={viewH}
          >
            <stop offset="0" stopColor="var(--color-maroon-light)" />
            <stop
              offset="0.5"
              stopColor="color-mix(in srgb, var(--color-maroon-light) 66%, var(--color-maroon))"
            />
            <stop offset="1" stopColor="var(--color-maroon)" />
          </linearGradient>
          <Grain id={`${uid}-grain`} frequency="0.035 0.025" seed={41} />
          <clipPath id={`${uid}-ring`}>
            <path d={ring} />
          </clipPath>
          <clipPath id={`${uid}-outside`}>
            <path d={outside} />
          </clipPath>
        </defs>

        {/* One shadow for the whole worked piece. A filter on the ring alone
            would miss the openwork, which is most of what the eye sees here. */}
        <g
          style={{
            filter:
              'drop-shadow(0 8px 7px color-mix(in srgb, var(--color-ink) 40%, transparent))',
          }}
        >
          <g clipPath={`url(#${uid}-outside)`}>
            {loops
              .filter((l) => !l.sunk)
              .map((l, i) => (
                <CutLoop key={`l${i}`} loop={l} fill={`url(#${uid}-band)`} />
              ))}

            <g clipPath={`url(#${uid}-ring)`}>
              <path d={ring} fill={`url(#${uid}-band)`} />
              <GrainWash
                filterId={`${uid}-grain`}
                clipId={`${uid}-ring`}
                width={viewW}
                height={viewH}
                opacity={0.22}
              />
            </g>

            {loops
              .filter((l) => l.sunk)
              .map((l, i) => (
                <SunkLoop key={`s${i}`} loop={l} />
              ))}

            {beads.map((b, i) => (
              <circle
                key={`p${i}`}
                cx={b.cx}
                cy={b.cy}
                r={b.r}
                fill="var(--color-maroon)"
                stroke="var(--color-maroon-light)"
                strokeWidth={b.r * 0.32}
                strokeOpacity={0.6}
              />
            ))}
          </g>
        </g>

        {/* A fine gold line separates the lace from whatever it frames. */}
        <rect
          x={MARGIN - 3}
          y={MARGIN - 3}
          width={OPENING_W + 6}
          height={openingH + 6}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth={2.5}
          strokeOpacity={0.7}
        />
      </svg>
    </span>
  )
}
