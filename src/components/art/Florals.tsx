import { useId, type ReactElement } from 'react'
import { jitter, pointsAlongQuad, type Point } from './geometry'
import roseUrl from '../../assets/images/white-rose.png'

/**
 * The white florals: the corner spray on the sealed envelope, the hand-tied
 * bouquet on the silver tray, and the slim upright spray that flanks a label.
 *
 * These are the hardest objects in the set, because in the reference they are
 * white flowers photographed on a white page. Colour carries almost nothing, so
 * four devices do the separating and none may be dropped: every white shape
 * carries a faint --color-bloom-shade edge, every petal casts a small offset
 * shadow onto the petal behind it, every bloom is vignetted from the upper left
 * so it domes, and the blooms are ivory rather than page-white — in the
 * photograph they are visibly warmer than the paper they lie on.
 *
 * A bloom is built from rings of overlapping cupped petals, each one a rounded
 * scoop rather than a sector of a circle. Sectors tile into concentric rings
 * and read as a flat disc with a spiral; scoops overlap into a scalloped
 * rosette, which is what makes a ranunculus read as a ranunculus.
 *
 * Against the blooms the green has to hold its own share of the picture. In the
 * reference roughly a third of each spray is foliage, and an arrangement drawn
 * with a polite fringe of leaves reads as clip art however good the flowers are.
 */

export type FloralVariant = 'corner' | 'tied' | 'sprig'

export interface FloralSprayProps {
  variant: FloralVariant
  /** Rendered width in CSS pixels; height follows the variant's aspect ratio. */
  size?: number | undefined
  className?: string | undefined
  /** Mirror horizontally, for the spray that flanks a label on the other side. */
  flip?: boolean | undefined
}

interface Box {
  readonly w: number
  readonly h: number
}

const VIEW_BOX: Record<FloralVariant, Box> = {
  corner: { w: 150, h: 180 },
  tied: { w: 200, h: 230 },
  sprig: { w: 120, h: 220 },
}

export function FloralSpray({ variant, size, className, flip }: FloralSprayProps): ReactElement {
  // Gradient and filter ids must be unique per instance or a second spray on
  // the page would reference the first one's defs.
  const idp = `fl${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const box = VIEW_BOX[variant]
  const width = size ?? box.w
  const height = (width * box.h) / box.w

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${box.w} ${box.h}`}
      aria-hidden="true"
      focusable="false"
      style={{
        // Lifts the whole spray off a white page the way the photograph does.
        filter:
          'drop-shadow(2px 4px 4px color-mix(in srgb, var(--color-ink) 38%, transparent))',
        ...(flip === true ? { transform: 'scaleX(-1)' } : {}),
      }}
    >
      <Palette idp={idp} />
      {variant === 'corner' ? <CornerSpray idp={idp} /> : null}
      {variant === 'tied' ? <TiedBouquet idp={idp} /> : null}
      {variant === 'sprig' ? <UprightSprig idp={idp} /> : null}
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   Shared paint.
   --------------------------------------------------------------------------- */

function Palette({ idp }: { idp: string }): ReactElement {
  return (
    <defs>
                              {/* A eucalyptus leaf is a cupped disc, and a flat sage fill with a rib
          drawn on it reads as a paper cut-out. Radial rather than linear: one
          lit spot off centre and the rim falling away into shade is what makes
          a disc read as a dished leaf, and it is the same gradient for every
          leaf, so it costs nothing. */}
      <radialGradient id={`${idp}-euc`} cx="34%" cy="30%" r="78%">
        <stop
          offset="0%"
          stopColor="color-mix(in srgb, var(--color-leaf-light) 62%, var(--color-paper))"
        />
        <stop
          offset="48%"
          stopColor="color-mix(in srgb, var(--color-leaf-light) 58%, var(--color-silver-light))"
        />
        <stop offset="100%" stopColor="color-mix(in srgb, var(--color-leaf) 74%, var(--color-leaf-deep))" />
      </radialGradient>
      {/* Ruscus is glossy: lit hard along the upper half and dark under the
          fold. The old ramp ran from mid green to dark green, which is no light
          at all. */}
      <linearGradient id={`${idp}-leaf`} x1="0%" y1="0%" x2="38%" y2="100%">
        <stop offset="0%" stopColor="color-mix(in srgb, var(--color-leaf-light) 56%, var(--color-leaf))" />
        <stop offset="46%" stopColor="color-mix(in srgb, var(--color-leaf) 80%, var(--color-leaf-deep))" />
        <stop offset="100%" stopColor="color-mix(in srgb, var(--color-leaf-deep) 68%, var(--color-ink))" />
      </linearGradient>
      <linearGradient id={`${idp}-leaf-pale`} x1="0%" y1="0%" x2="38%" y2="100%">
        <stop offset="0%" stopColor="color-mix(in srgb, var(--color-leaf-light) 78%, var(--color-paper))" />
        <stop offset="100%" stopColor="color-mix(in srgb, var(--color-leaf) 84%, var(--color-leaf-deep))" />
      </linearGradient>
      <linearGradient id={`${idp}-satin`} x1="0%" y1="0%" x2="100%" y2="55%">
        <stop offset="0%" stopColor="color-mix(in srgb, var(--color-cream-shade) 78%, var(--color-silver-deep))" />
        <stop offset="32%" stopColor="var(--color-cream)" />
        <stop offset="62%" stopColor="var(--color-cream-deep)" />
        <stop offset="100%" stopColor="color-mix(in srgb, var(--color-cream-shade) 70%, var(--color-silver-deep))" />
      </linearGradient>
      <filter id={`${idp}-soft`} x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
    </defs>
  )
}

/* ---------------------------------------------------------------------------
   Maths kept local: these serve petals only, and the shared geometry module is
   for shapes that two different components have to agree on.
   --------------------------------------------------------------------------- */

const TAU = Math.PI * 2
const DEG = Math.PI / 180

function polar(cx: number, cy: number, r: number, a: number): Point {
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function n(v: number): number {
  return Math.round(v * 10) / 10
}

function xy(p: Point): string {
  return `${n(p[0])} ${n(p[1])}`
}

/** Signed jitter in [-0.5, 0.5), which is how nearly every caller wants it. */
function wobble(seed: number): number {
  return jitter(seed) - 0.5
}

interface Dot {
  readonly x: number
  readonly y: number
  readonly r: number
}

/**
 * Hundreds of small circles as a single path.
 *
 * An astilbe plume needs well over a hundred florets before it stops looking
 * like a beaded wand, and a page carrying five sprays cannot afford that many
 * <circle> elements three times over. Drawn as two arcs each, they cost one
 * node for the whole plume and paint identically.
 */
function dotsPath(dots: readonly Dot[]): string {
  return dots
    .map(
      (d) =>
        `M ${n(d.x - d.r)} ${n(d.y)} a ${n(d.r)} ${n(d.r)} 0 1 0 ${n(d.r * 2)} 0 a ${n(d.r)} ${n(d.r)} 0 1 0 ${n(-d.r * 2)} 0`,
    )
    .join(' ')
}

/** How much of the photograph's square the rose itself fills, edge to edge. */
const ROSE_FILL = 0.74

interface BloomProps {
  idp: string
  cx: number
  cy: number
  r: number
  seed: number
  kind: 'ranunculus' | 'rose' | 'bud'
  /** Radians; turns the bloom so neighbouring ones differ. */
  tilt?: number
  /** Degrees of lean away from the camera, foreshortening the bloom's disc. */
  lean?: number
}

/**
 * A bloom is a photograph of a white rose, and nothing else.
 *
 * Four attempts were made to draw one — rings of cupped petals, then gradient
 * fills, then cast shadows between whorls — and the couple's verdict on the
 * last was "still looks fake". They were right: a hundred and fifty paths can
 * describe where a rose's petals are and cannot say what light does inside
 * one. So the rose is now the photograph they supplied, and this component
 * does only what a photograph cannot do for itself — sets it to the size the
 * spray was composed for, turns and mirrors it by seed so eight roses in one
 * bouquet are not one rose stamped eight times, grounds it with the same soft
 * shadow the drawing had, and leans it where the composition leans it.
 *
 * A bud is the same photograph drawn twice the size and clipped to the bud's
 * circle, which shows the rose's own heart: the tight spiral at the centre is
 * exactly what a bud looks like, and it costs no second image.
 *
 * Every spray on every page draws its blooms through here, so this is the one
 * place a flower is made. It is also why the page got lighter: one image
 * where there were a hundred and fifty paths.
 */
function Bloom({ idp, cx, cy, r, seed, kind, tilt = 0, lean = 0 }: BloomProps): ReactElement {
  const bud = kind === 'bud'
  const side = ((2 * r) / ROSE_FILL) * (bud ? 2 : 1)
  // The composed tilt, plus a turn of its own, so the same photograph never
  // presents the same petal at the top twice in one spray.
  const turn = tilt / DEG + (jitter(seed * 7) - 0.5) * 48
  const mirror = jitter(seed * 13) > 0.5
  const clipId = `${idp}-bud${seed}`
  return (
    <g
      transform={
        lean === 0
          ? undefined
          : `translate(${n(cx)} ${n(cy)}) rotate(${n(lean)}) scale(1 0.82) rotate(${n(-lean)}) translate(${n(-cx)} ${n(-cy)})`
      }
    >
      <ellipse
        cx={cx + r * 0.16}
        cy={cy + r * 0.74}
        rx={r * 0.74}
        ry={r * 0.26}
        fill="var(--color-bloom-shade)"
        opacity={0.45}
        filter={`url(#${idp}-soft)`}
      />
      {bud ? (
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={n(r * 0.94)} />
        </clipPath>
      ) : null}
      <image
        href={roseUrl}
        x={n(cx - side / 2)}
        y={n(cy - side / 2)}
        width={n(side)}
        height={n(side)}
        preserveAspectRatio="xMidYMid meet"
        transform={`rotate(${n(turn)} ${n(cx)} ${n(cy)})${mirror ? ` translate(${n(2 * cx)} 0) scale(-1 1)` : ''}`}
        {...(bud ? { clipPath: `url(#${clipId})` } : {})}
      />
    </g>
  )
}

/**
 * A half-open bud: the same rose, squeezed narrow and still holding its outer
 * petals closed, with a green calyx behind it.
 *
 * Reusing the bloom rather than authoring an egg matters — a hand-drawn shell
 * with a seam down it reads as an egg at any size, and the reference buds are
 * plainly small roses.
 */
function Bud({
  idp,
  cx,
  cy,
  r,
  angle,
  seed,
  calyx = true,
}: {
  idp: string
  cx: number
  cy: number
  r: number
  angle: number
  seed: number
  calyx?: boolean
}): ReactElement {
  return (
    <g transform={`translate(${n(cx)} ${n(cy)}) rotate(${n(angle)})`}>
      {calyx ? (
        <g fill={`url(#${idp}-leaf)`}>
          <path
            d={`M ${n(-r * 0.2)} ${n(r * 0.36)} C ${n(-r * 1)} ${n(r * 0.44)} ${n(-r * 1.12)} ${n(r * 0.94)} ${n(-r * 0.58)} ${n(r * 1.1)} C ${n(-r * 0.36)} ${n(r * 0.82)} ${n(-r * 0.2)} ${n(r * 0.62)} ${n(-r * 0.2)} ${n(r * 0.36)} Z`}
          />
          <path
            d={`M ${n(r * 0.2)} ${n(r * 0.36)} C ${n(r * 1)} ${n(r * 0.44)} ${n(r * 1.12)} ${n(r * 0.94)} ${n(r * 0.58)} ${n(r * 1.1)} C ${n(r * 0.36)} ${n(r * 0.82)} ${n(r * 0.2)} ${n(r * 0.62)} ${n(r * 0.2)} ${n(r * 0.36)} Z`}
          />
          <path d={`M 0 ${n(r * 0.44)} C ${n(-r * 0.22)} ${n(r * 0.98)} ${n(r * 0.22)} ${n(r * 0.98)} 0 ${n(r * 0.44)} Z`} />
        </g>
      ) : null}
      {/* Narrowed across the axis: a bud is taller than it is wide. */}
      <g transform="scale(0.84 1)">
        <Bloom idp={idp} cx={0} cy={0} r={r} seed={seed} kind="bud" tilt={jitter(seed) * 1.4} />
      </g>
    </g>
  )
}

/* ---------------------------------------------------------------------------
   Foliage.
   --------------------------------------------------------------------------- */

interface SprigProps {
  idp: string
  seed: number
  from: Point
  ctrl: Point
  to: Point
  count: number
  leaf: number
}

/**
 * A eucalyptus stem: rounded leaves alternating along a fine curve, smaller
 * toward the tip. Leaf angle is jittered from a deterministic seed so that two
 * sprigs in the same spray never mirror each other.
 *
 * Leaves are set closer together than their own width and vary by a third in
 * size. Space them evenly at a constant size and the sprig reads as a string of
 * beads rather than a branch, which is the failure this spacing exists to avoid.
 * Every third leaf is squeezed across its short axis, standing for one that has
 * turned edge-on to the camera.
 */
/**
 * A silver-dollar eucalyptus leaf, in a frame with the stem at the left and
 * the tip at the right.
 *
 * It was an ellipse, and an ellipse with a rib on it is a coin. The real leaf
 * is round in the body but not at the ends: it sits on its stem with a rounded
 * base and closes to a small point, and that point is most of what makes it a
 * leaf. `rx` is the half-length, `ry` the half-width.
 */
function leafBlade(rx: number, ry: number): string {
  return [
    `M ${n(-rx)} 0`,
    `C ${n(-rx * 1.04)} ${n(-ry * 0.72)} ${n(-rx * 0.5)} ${n(-ry * 1.18)} ${n(rx * 0.2)} ${n(-ry * 1.02)}`,
    `C ${n(rx * 0.72)} ${n(-ry * 0.82)} ${n(rx * 0.98)} ${n(-ry * 0.24)} ${n(rx)} 0`,
    `C ${n(rx * 0.98)} ${n(ry * 0.24)} ${n(rx * 0.72)} ${n(ry * 0.82)} ${n(rx * 0.2)} ${n(ry * 1.02)}`,
    `C ${n(-rx * 0.5)} ${n(ry * 1.18)} ${n(-rx * 1.04)} ${n(ry * 0.72)} ${n(-rx)} 0 Z`,
  ].join(' ')
}

/**
 * The sliver of shade along the edge that turns away from the light.
 *
 * A leaf is cupped, and the fill's radial shading says so in the round; this
 * says which way. It rides the lower edge from the crest to the tip, so the
 * tip reads as curling under.
 */
function leafFold(rx: number, ry: number): string {
  return [
    `M ${n(rx * 0.2)} ${n(ry * 1.02)}`,
    `C ${n(rx * 0.72)} ${n(ry * 0.82)} ${n(rx * 0.98)} ${n(ry * 0.24)} ${n(rx)} 0`,
    `C ${n(rx * 0.9)} ${n(ry * 0.38)} ${n(rx * 0.64)} ${n(ry * 0.68)} ${n(rx * 0.2)} ${n(ry * 0.84)} Z`,
  ].join(' ')
}

/**
 * The midrib and three pairs of side veins, as one path.
 *
 * Seven strokes in one element, because every eucalyptus leaf on the page
 * draws this and there are some three hundred of them: as separate paths the
 * veins alone would have cost more nodes than the flowers.
 */
function leafVeins(rx: number, ry: number): string {
  const pair = (x0: number, x1: number, reach: number): string =>
    `M ${n(rx * x0)} 0 Q ${n(rx * ((x0 + x1) / 2))} ${n(-ry * reach * 0.6)} ${n(rx * x1)} ${n(-ry * reach)} ` +
    `M ${n(rx * x0)} 0 Q ${n(rx * ((x0 + x1) / 2))} ${n(ry * reach * 0.6)} ${n(rx * x1)} ${n(ry * reach)}`
  return [
    `M ${n(-rx * 0.9)} 0 Q 0 ${n(ry * 0.06)} ${n(rx * 0.9)} 0`,
    pair(-0.45, -0.05, 0.86),
    pair(-0.05, 0.38, 0.8),
    pair(0.35, 0.72, 0.58),
  ].join(' ')
}

function Eucalyptus({ idp, seed, from, ctrl, to, count, leaf }: SprigProps): ReactElement {
  const spine = pointsAlongQuad(from, ctrl, to, count + 1)
  const leaves: ReactElement[] = []

  spine.forEach((point, i) => {
    if (i === 0) return
    const prev = spine[i - 1] ?? point
    const along = Math.atan2(point[1] - prev[1], point[0] - prev[0])
    const side = i % 2 === 0 ? 1 : -1
    const a = along + side * (0.72 + jitter(seed + i) * 0.55)
    const t = i / count
    const size = leaf * (1 - t * 0.34) * (0.74 + jitter(seed + i * 7) * 0.58)
    // Turned edge-on, and so drawn as a narrow crescent of the same leaf.
    const edgeOn = jitter(seed + i * 31) > 0.76
    const ry = size * (edgeOn ? 0.3 : 0.86 + jitter(seed + i * 3) * 0.14)
    // Held at little more than half its own length from the stem, so successive
    // leaves overlap instead of hanging apart like beads on a wire.
    const [lx, ly] = polar(point[0], point[1], size * 0.62, a)
    leaves.push(
      <g key={i}>
        <path
          d={`M ${xy(point)} L ${n(lx - Math.cos(a) * size * 0.5)} ${n(ly - Math.sin(a) * size * 0.5)}`}
          fill="none"
          stroke="color-mix(in srgb, var(--color-leaf) 70%, var(--color-cream-shade))"
          strokeWidth={0.45}
          strokeLinecap="round"
        />
        <g transform={`translate(${n(lx)} ${n(ly)}) rotate(${n(a / DEG)})`}>
          <path
            d={leafBlade(size, ry)}
            transform={`translate(${n(size * 0.12)} ${n(size * 0.14)})`}
            fill="var(--color-leaf-deep)"
            opacity={0.36}
          />
          {/* The margin is drawn pale, not dark: a leaf's edge catches the
              light, and a light rim round a shaded blade is what lifts it off
              the leaf behind. A dark outline did the opposite. */}
          <path
            d={leafBlade(size, ry)}
            fill={`url(#${idp}-euc)`}
            stroke="color-mix(in srgb, var(--color-leaf-light) 70%, var(--color-paper))"
            strokeWidth={0.3}
            strokeOpacity={0.55}
          />
          <path d={leafFold(size, ry)} fill="var(--color-leaf-deep)" opacity={0.26} />
          <path
            d={leafVeins(size, ry)}
            fill="none"
            stroke="color-mix(in srgb, var(--color-leaf-light) 60%, var(--color-paper))"
            strokeWidth={0.26}
            strokeOpacity={0.5}
            strokeLinecap="round"
          />
        </g>
      </g>,
    )
  })

  return (
    <g>
      <path
        d={`M ${xy(from)} Q ${xy(ctrl)} ${xy(to)}`}
        fill="none"
        stroke="color-mix(in srgb, var(--color-leaf) 76%, var(--color-cream-shade))"
        strokeWidth={0.8}
        strokeLinecap="round"
      />
      {leaves}
    </g>
  )
}

/**
 * The dark lance leaves that back the blooms — ruscus, and the speckled aucuba
 * at the foot of the envelope spray.
 *
 * The blade is built around a curved spine rather than a straight one, so a
 * leaf droops away from its stem instead of sticking out like a blade of a fan.
 */
function LanceLeaf({
  idp,
  x,
  y,
  length,
  width,
  angle,
  seed,
  speckled = false,
  pale = false,
}: {
  idp: string
  x: number
  y: number
  length: number
  width: number
  angle: number
  seed: number
  speckled?: boolean
  pale?: boolean
}): ReactElement {
  const w = width * (0.9 + jitter(seed * 5) * 0.22)
  const len = length * (0.82 + jitter(seed * 7) * 0.36)
  const bend = w * (wobble(seed * 3) * 1.6)
  const blade = [
    'M 0 0',
    `C ${n(len * 0.16)} ${n(-w * 1.05)} ${n(len * 0.62)} ${n(-w * 0.92 + bend * 0.5)} ${n(len)} ${n(bend)}`,
    `C ${n(len * 0.62)} ${n(w * 0.92 + bend * 0.5)} ${n(len * 0.16)} ${n(w * 1.05)} 0 0`,
    'Z',
  ].join(' ')
  // The rib, and two pairs of side veins off it, all in one path.
  const rib = [
    `M 0 0 Q ${n(len * 0.52)} ${n(w * 0.1 + bend * 0.4)} ${n(len)} ${n(bend)}`,
    `M ${n(len * 0.22)} ${n(bend * 0.22)} Q ${n(len * 0.36)} ${n(-w * 0.5)} ${n(len * 0.5)} ${n(-w * 0.66)}`,
    `M ${n(len * 0.22)} ${n(bend * 0.22)} Q ${n(len * 0.36)} ${n(w * 0.5)} ${n(len * 0.5)} ${n(w * 0.66)}`,
    `M ${n(len * 0.5)} ${n(bend * 0.5)} Q ${n(len * 0.62)} ${n(-w * 0.4 + bend * 0.3)} ${n(len * 0.74)} ${n(-w * 0.5 + bend * 0.5)}`,
    `M ${n(len * 0.5)} ${n(bend * 0.5)} Q ${n(len * 0.62)} ${n(w * 0.4 + bend * 0.3)} ${n(len * 0.74)} ${n(w * 0.5 + bend * 0.5)}`,
  ].join(' ')
  const specks: ReactElement[] = []
  if (speckled) {
    // Nine, not twenty-two. A ruscus blade is about twenty pixels long where
    // these are used, so a speck is two pixels across and a third of them land
    // on the same pixel as a neighbour; the ones that survive still read as
    // mottling, and each one that does not is a node fewer to rasterise on
    // every scroll.
    for (let i = 0; i < 9; i += 1) {
      const t = 0.12 + jitter(seed + i * 3) * 0.76
      const off = wobble(seed + i * 11) * 1.7 * w * Math.sin(Math.PI * t) + bend * t * 0.5
      specks.push(
        <ellipse
          key={i}
          cx={n(len * t)}
          cy={n(off)}
          rx={n(w * 0.1 + jitter(seed + i) * w * 0.1)}
          ry={n(w * 0.07 + jitter(seed + i * 5) * w * 0.06)}
          fill="var(--color-leaf-light)"
          opacity={0.55}
        />,
      )
    }
  }
  return (
    <g transform={`translate(${n(x)} ${n(y)}) rotate(${n(angle)})`}>
      <path
        d={blade}
        fill={pale ? `url(#${idp}-leaf-pale)` : `url(#${idp}-leaf)`}
        stroke="var(--color-leaf-deep)"
        strokeWidth={0.3}
        strokeOpacity={0.6}
        opacity={0.78 + jitter(seed * 11) * 0.22}
      />
      {specks}
      <path
        d={rib}
        fill="none"
        stroke="var(--color-leaf-light)"
        strokeWidth={0.3}
        strokeOpacity={0.42}
        strokeLinecap="round"
      />
      {/* The sheen down the upper half: ruscus is a glossy leaf, and without a
          highlight a dark blade flattens into a silhouette. */}
      <path
        d={`M ${n(len * 0.08)} ${n(-w * 0.22)} C ${n(len * 0.28)} ${n(-w * 0.88)} ${n(len * 0.62)} ${n(-w * 0.78 + bend * 0.4)} ${n(len * 0.9)} ${n(-w * 0.12 + bend * 0.8)}`}
        fill="none"
        stroke="var(--color-leaf-light)"
        strokeWidth={0.36}
        strokeOpacity={0.42}
      />
    </g>
  )
}

/**
 * One cupped petal, seen from the front.
 *
 * A rounded blade from `inner` to `outer` along `angle`, `half` wide, with a
 * lip past the tip (`lip` > 1) where the edge rolls over, and a pinched base
 * that leaves a hollow for the whorl inside to sit in. The star florets are
 * built from it; it was recovered verbatim from the compiled bundle after it
 * was cut with the drawn rose it also used to serve.
 */
function petalPath(
  cx: number,
  cy: number,
  angle: number,
  inner: number,
  outer: number,
  half: number,
  lip: number,
): string {
  const p = (radius: number, offset: number): Point => polar(cx, cy, radius, angle + offset)
  return [
    `M ${xy(p(inner, -half * 0.5))}`,
    `C ${xy(p(inner * 1.7, -half * 0.98))} ${xy(p(outer * 0.6, -half * 1.12))} ${xy(p(outer * 0.8, -half))}`,
    `C ${xy(p(outer * lip, -half * 0.6))} ${xy(p(outer * lip, half * 0.6))} ${xy(p(outer * 0.8, half))}`,
    `C ${xy(p(outer * 0.6, half * 1.12))} ${xy(p(inner * 1.7, half * 0.98))} ${xy(p(inner, half * 0.5))}`,
    `C ${xy(p(inner * 1.25, half * 0.22))} ${xy(p(inner * 1.25, -half * 0.22))} ${xy(p(inner, -half * 0.5))}`,
    'Z',
  ].join(' ')
}

/* ---------------------------------------------------------------------------
   The small white flowers. Astilbe spikes and star florets are what keep a
   white spray from collapsing into one mass of petals.
   --------------------------------------------------------------------------- */

/**
 * An astilbe spike: a narrow feathered plume.
 *
 * Two earlier attempts failed in opposite directions. A filled silhouette with
 * dots scattered over it reads as a translucent cone with bubbles in it, because
 * a plume has no surface — it is only edge. A few long branchlets carrying three
 * beads each reads as lily-of-the-valley. What a plume actually is, is a great
 * many florets packed tight enough to be a mass and loose enough to be fuzzy, so
 * this draws a dense cloud whose boundary alone gives the taper, and the only
 * strokes are the short hairs that hold the outermost florets away from the axis.
 */
function Astilbe({
  idp,
  seed,
  base,
  ctrl,
  tip,
  width,
  steps = 38,
}: {
  idp: string
  seed: number
  base: Point
  ctrl: Point
  tip: Point
  width: number
  steps?: number
}): ReactElement {
  const spine = pointsAlongQuad(base, ctrl, tip, steps)
  const length = Math.hypot(tip[0] - base[0], tip[1] - base[1])
  const rise = length / steps
  const white: Dot[] = []
  const green: Dot[] = []
  const hairs: string[] = []

  spine.forEach((point, i) => {
    const t = i / (steps - 1)
    const prev = spine[i - 1] ?? point
    const next = spine[i + 1] ?? point
    const along = Math.atan2(next[1] - prev[1], next[0] - prev[0])
    const nx = Math.cos(along + Math.PI / 2)
    const ny = Math.sin(along + Math.PI / 2)
    const ax = Math.cos(along)
    const ay = Math.sin(along)
    // Widest a fifth of the way up and tapering to a point: a plume, not a cone.
    const w = width * Math.pow(1 - t, 0.55) * Math.min(1, 0.26 + t * 5)
    const perRow = w > width * 0.6 ? 15 : w > width * 0.3 ? 9 : 5

    for (let k = 0; k < perRow; k += 1) {
      const u = (k / (perRow - 1) - 0.5) * 2
      // Bias outward: the florets crowd the edge of the plume, which is what
      // makes the silhouette fringed rather than a solid lozenge.
      const off = Math.sign(u) * Math.pow(Math.abs(u), 0.86) * w * (0.52 + Math.pow(jitter(seed + i * 9 + k * 3), 0.8) * 0.9)
      // Slid along the axis as well, or the rows band into visible rungs.
      const slide = wobble(seed + i * 5 + k * 7) * rise * 1.9
      const r = width * (0.05 + Math.pow(jitter(seed + i * 13 + k), 1.5) * 0.075)
      const dot: Dot = {
        x: point[0] + nx * off + ax * slide,
        y: point[1] + ny * off + ay * slide,
        r,
      }
      // The tip of an astilbe is still in bud, and buds are green.
      if (t > 0.93) green.push(dot)
      else white.push(dot)
      if (Math.abs(u) > 0.72) {
        hairs.push(`M ${xy(point)} L ${n(dot.x)} ${n(dot.y)}`)
      }
    }
  })

  return (
    <g>
      <path
        d={`M ${xy(base)} Q ${xy(ctrl)} ${xy(tip)}`}
        fill="none"
        stroke="color-mix(in srgb, var(--color-leaf) 58%, var(--color-cream-shade))"
        strokeWidth={0.6}
        strokeLinecap="round"
        strokeOpacity={0.75}
      />
      <path
        d={hairs.join(' ')}
        fill="none"
        stroke="color-mix(in srgb, var(--color-leaf-light) 34%, var(--color-bloom-shade))"
        strokeWidth={0.22}
        strokeOpacity={0.6}
      />
      {/* The plume's own shading: the same cloud, larger and offset, so every
          floret sits on a shadow instead of floating on the white page. */}
      <path
        d={dotsPath([...white, ...green].map((d) => ({ x: d.x + 0.18, y: d.y + 0.24, r: d.r * 1.8 })))}
        fill="var(--color-bloom-shade)"
        opacity={0.26}
      />
      <path d={dotsPath(white)} fill="var(--color-bloom)" />
      <path
        d={dotsPath(green)}
        fill="color-mix(in srgb, var(--color-leaf-light) 42%, var(--color-bloom))"
      />
      <ellipse
        cx={n(base[0] + (tip[0] - base[0]) * 0.3)}
        cy={n(base[1] + (tip[1] - base[1]) * 0.3)}
        rx={n(width * 0.7)}
        ry={n(length * 0.2)}
        fill="var(--color-bloom-shade)"
        opacity={0.14}
        filter={`url(#${idp}-soft)`}
      />
    </g>
  )
}

/**
 * A stephanotis floret: five narrow pointed petals from a small pale throat.
 *
 * The petals are deliberately slim. Widen them and the flower turns into a
 * daisy, which is the wrong plant and reads as a sticker.
 */
function StarFloret({
  cx,
  cy,
  r,
  angle,
  seed,
  stalk,
}: {
  cx: number
  cy: number
  r: number
  angle: number
  seed: number
  /** Direction in degrees and length of the stem it hangs from, if any. */
  stalk?: readonly [number, number]
}): ReactElement {
  const petals: ReactElement[] = []
  const count = 5
  for (let i = 0; i < count; i += 1) {
    const a = angle * DEG + (i / count) * TAU + wobble(seed + i) * 0.22
    const d = petalPath(cx, cy, a, r * 0.2, r * (0.88 + jitter(seed + i * 3) * 0.26), 0.3, 0.98)
    petals.push(
      <g key={i}>
        <path
          d={d}
          transform={`translate(${n(r * 0.08)} ${n(r * 0.1)})`}
          fill="var(--color-bloom-shade)"
          opacity={0.45}
        />
        <path d={d} fill="var(--color-bloom)" stroke="var(--color-bloom-shade)" strokeWidth={0.2} strokeOpacity={0.65} />
      </g>,
    )
  }
  const [sx, sy] = stalk ? polar(cx, cy, stalk[1], stalk[0] * DEG) : [cx, cy]
  return (
    <g>
      {stalk ? (
        <path
          d={`M ${n(cx)} ${n(cy)} L ${n(sx)} ${n(sy)}`}
          fill="none"
          stroke="color-mix(in srgb, var(--color-leaf) 62%, var(--color-cream-shade))"
          strokeWidth={0.5}
          strokeLinecap="round"
        />
      ) : null}
      {petals}
      <circle cx={cx} cy={cy} r={n(r * 0.15)} fill="var(--color-bloom-shade)" opacity={0.5} />
      <circle
        cx={cx}
        cy={cy}
        r={n(r * 0.08)}
        fill="color-mix(in srgb, var(--color-leaf-light) 45%, var(--color-bloom-core))"
      />
    </g>
  )
}

/**
 * The trumpet-shaped bouvardia at the top left of the envelope spray: narrow
 * tubes radiating from one node, each opening into a small star. A few are left
 * closed, because in the photograph a third of the cluster has not opened yet.
 */
function TubeCluster({
  cx,
  cy,
  angle,
  len,
  count,
  seed,
}: {
  cx: number
  cy: number
  angle: number
  len: number
  count: number
  seed: number
}): ReactElement {
  const tubes: ReactElement[] = []
  for (let i = 0; i < count; i += 1) {
    const a = (angle + (i - (count - 1) / 2) * 13 + wobble(seed + i) * 12) * DEG
    const l = len * (0.5 + Math.pow(jitter(seed + i * 7), 1.4) * 0.58)
    const [tx, ty] = polar(cx, cy, l, a)
    const open = jitter(seed + i * 23) > 0.34
    tubes.push(
      <g key={i}>
        <path
          d={`M ${n(cx)} ${n(cy)} L ${n(tx)} ${n(ty)}`}
          fill="none"
          stroke="var(--color-bloom-shade)"
          strokeWidth={1.5}
          strokeOpacity={0.45}
          strokeLinecap="round"
        />
        <path
          d={`M ${n(cx)} ${n(cy)} L ${n(tx)} ${n(ty)}`}
          fill="none"
          stroke="var(--color-bloom)"
          strokeWidth={0.9}
          strokeLinecap="round"
        />
        {open ? (
          <StarFloret cx={tx} cy={ty} r={2.4 + jitter(seed + i * 11) * 1.4} angle={a / DEG} seed={seed + i * 5} />
        ) : (
          <ellipse
            cx={n(tx)}
            cy={n(ty)}
            rx={1.2}
            ry={0.8}
            transform={`rotate(${n(a / DEG)} ${n(tx)} ${n(ty)})`}
            fill="var(--color-bloom)"
            stroke="var(--color-bloom-shade)"
            strokeWidth={0.22}
            strokeOpacity={0.6}
          />
        )}
      </g>,
    )
  }
  return <g>{tubes}</g>
}

/* ---------------------------------------------------------------------------
   Stems, twine and ribbon.
   --------------------------------------------------------------------------- */

/**
 * The cut stems below a hand-tied spray, bound with twine.
 *
 * Ends are deliberately uneven and each is capped with a pale ellipse: a
 * florist's bundle is cut in one pass but the stems do not all start at the
 * same depth in the hand, and a cut stem shows its pale face.
 */
function StemBundle({
  seed,
  from,
  to,
  count,
  spread,
  bindAt,
}: {
  seed: number
  from: Point
  to: Point
  count: number
  spread: number
  bindAt: number
}): ReactElement {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const a = Math.atan2(dy, dx)
  const nx = Math.cos(a + Math.PI / 2)
  const ny = Math.sin(a + Math.PI / 2)
  const stems: ReactElement[] = []

  for (let i = 0; i < count; i += 1) {
    const u = count === 1 ? 0 : i / (count - 1) - 0.5
    const startOff = u * spread * 0.45
    const endOff = u * spread * (1.05 + jitter(seed + i) * 0.5)
    const shorten = 0.7 + jitter(seed + i * 3) * 0.38
    const sx = from[0] + nx * startOff
    const sy = from[1] + ny * startOff
    const ex = from[0] + dx * shorten + nx * endOff
    const ey = from[1] + dy * shorten + ny * endOff
    const d = `M ${n(sx)} ${n(sy)} Q ${n((sx + ex) / 2 + nx * 0.7)} ${n((sy + ey) / 2 + ny * 0.7)} ${n(ex)} ${n(ey)}`
    stems.push(
      <g key={i}>
        <path d={d} fill="none" stroke="var(--color-leaf-deep)" strokeWidth={3.2} strokeLinecap="round" />
        <path
          d={d}
          fill="none"
          stroke="color-mix(in srgb, var(--color-leaf) 72%, var(--color-leaf-light))"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.85}
        />
        {/* The pale cut face at the end of a snipped stalk. */}
        <ellipse
          cx={n(ex)}
          cy={n(ey)}
          rx={1.7}
          ry={1.1}
          transform={`rotate(${n(a / DEG)} ${n(ex)} ${n(ey)})`}
          fill="color-mix(in srgb, var(--color-bloom-core) 62%, var(--color-leaf-light))"
        />
      </g>,
    )
  }

  const bx = from[0] + dx * bindAt
  const by = from[1] + dy * bindAt
  const twine: ReactElement[] = []
  const tone = 'color-mix(in srgb, var(--color-gold-deep) 30%, var(--color-cream-shade))'
  for (let i = -2; i <= 2; i += 1) {
    const ox = Math.cos(a) * i * 1.5
    const oy = Math.sin(a) * i * 1.5
    const reach = spread * (0.72 - Math.abs(i) * 0.04)
    twine.push(
      <path
        key={i}
        d={`M ${n(bx + ox - nx * reach)} ${n(by + oy - ny * reach)} Q ${n(bx + ox * 1.3)} ${n(by + oy * 1.3)} ${n(bx + ox + nx * reach)} ${n(by + oy + ny * reach)}`}
        fill="none"
        stroke={tone}
        strokeWidth={0.95}
        strokeLinecap="round"
      />,
    )
  }
  // The loose ends of the knot. Without them the wrap reads as a printed band.
  twine.push(
    <path
      key="tail-a"
      d={`M ${n(bx + nx * spread * 0.6)} ${n(by + ny * spread * 0.6)} q ${n(nx * 4 + 1.5)} ${n(ny * 4 + 2)} ${n(nx * 6 + 4.5)} ${n(ny * 6 + 1)}`}
      fill="none"
      stroke={tone}
      strokeWidth={0.7}
      strokeLinecap="round"
    />,
  )
  twine.push(
    <path
      key="tail-b"
      d={`M ${n(bx + nx * spread * 0.5)} ${n(by + ny * spread * 0.5)} q ${n(nx * 3 + 2.5)} ${n(ny * 3 + 1)} ${n(nx * 5 + 5.5)} ${n(ny * 5 - 1)}`}
      fill="none"
      stroke={tone}
      strokeWidth={0.6}
      strokeLinecap="round"
    />,
  )

  return (
    <g>
      {stems}
      {twine}
    </g>
  )
}

/** A ribbon tail: a band whose width breathes along its length, as satin does. */
function bandPath(p0: Point, p1: Point, p2: Point, widths: readonly number[]): string {
  const spine = pointsAlongQuad(p0, p1, p2, widths.length)
  const left: Point[] = []
  const right: Point[] = []
  spine.forEach((point, i) => {
    const prev = spine[i - 1] ?? point
    const next = spine[i + 1] ?? point
    const a = Math.atan2(next[1] - prev[1], next[0] - prev[0]) + Math.PI / 2
    const w = (widths[i] ?? 0) / 2
    left.push([point[0] + Math.cos(a) * w, point[1] + Math.sin(a) * w])
    right.push([point[0] - Math.cos(a) * w, point[1] - Math.sin(a) * w])
  })
  return `M ${left.map(xy).join(' L ')} L ${[...right].reverse().map(xy).join(' L ')} Z`
}

/**
 * The pale satin ribbon of the tray bouquet: two soft loops pinched by a small
 * knot over the stems, with two tails falling away beneath.
 *
 * The knot is kept small on purpose. Drawn at the size the loops suggest it
 * turns into a pillow across the bottom of the bouquet, and the eye reads the
 * pillow before it reads the flowers. Tail width pinches partway down, which is
 * the only thing that says "satin turning over" rather than "a strip of paper",
 * and each tail carries a highlight, which is the only thing that says satin
 * rather than linen.
 */
function Ribbon({ idp }: { idp: string }): ReactElement {
  const edge = { stroke: 'var(--color-cream-shade)', strokeWidth: 0.32, strokeOpacity: 0.85 }
  const longTail = bandPath([105, 156], [115, 180], [124, 212], [4.6, 6, 6.6, 4.2, 2, 4.8, 6.4, 7, 7.2])
  const shortTail = bandPath([98, 157], [93, 180], [96, 208], [4, 5.4, 5.8, 3.4, 4.2, 5.6, 6])
  return (
    <g>
      {/* One loop, and it falls to the left rather than balancing the knot. A
          matched pair either side turns a florist's ribbon into a bow tie. */}
      <path
        d="M 100 149 C 90 141 78 146 79 154 C 80 161 91 160 101 154 Z"
        fill={`url(#${idp}-satin)`}
        {...edge}
        strokeLinejoin="round"
      />
      <path
        d="M 95 150 C 86 147 81 151 82 156"
        fill="none"
        stroke="var(--color-cream-shade)"
        strokeWidth={0.32}
        strokeOpacity={0.55}
      />
      {/* The fold where the loop doubles back on itself. */}
      <path
        d="M 86 143.6 C 84 148 84.6 153 88 157.8"
        fill="none"
        stroke="var(--color-cream-shade)"
        strokeWidth={0.4}
        strokeOpacity={0.7}
      />
      <path d={shortTail} {...edge} fill={`url(#${idp}-satin)`} strokeLinejoin="round" opacity={0.94} />
      <path d={longTail} {...edge} fill={`url(#${idp}-satin)`} strokeLinejoin="round" />
      <path d="M 105 160 Q 114 182 123 208" fill="none" stroke="var(--color-cream)" strokeWidth={0.9} strokeOpacity={0.8} />
      <path d="M 98 161 Q 94 181 97 204" fill="none" stroke="var(--color-cream)" strokeWidth={0.8} strokeOpacity={0.65} />
      <g transform="translate(102 153) rotate(14)">
        <path
          d="M -4.6 -3.4 C -2 -4.6 2.4 -4.6 4.8 -3.5 C 5.6 -1.3 5.6 1.4 4.8 3.6 C 2.4 4.7 -2 4.7 -4.6 3.5 C -5.4 1.3 -5.4 -1.2 -4.6 -3.4 Z"
          fill={`url(#${idp}-satin)`}
          {...edge}
        />
        <path d="M -4.2 -1 C -1.4 0.2 1.6 0.2 4.4 -0.9" fill="none" stroke="var(--color-cream)" strokeWidth={0.6} strokeOpacity={0.75} />
      </g>
    </g>
  )
}

/* ---------------------------------------------------------------------------
   The three arrangements. Positions are authored constants, not generated, so
   that the compositions can be reviewed and regression-shot; only leaf angle
   and petal wobble come from jitter().
   --------------------------------------------------------------------------- */

function CornerSpray({ idp }: { idp: string }): ReactElement {
  return (
    <g>
      <Astilbe idp={idp} seed={11} base={[68, 116]} ctrl={[63, 94]} tip={[59, 68]} width={7.4} />
      <Astilbe idp={idp} seed={29} base={[76, 116]} ctrl={[84, 100]} tip={[90, 82]} width={5.4} />
      <Astilbe idp={idp} seed={47} base={[64, 118]} ctrl={[56, 104]} tip={[49, 90]} width={4.4} />

      <TubeCluster cx={56} cy={104} angle={-158} len={18} count={10} seed={31} />

      <Eucalyptus idp={idp} seed={7} from={[62, 124]} ctrl={[42, 116]} to={[22, 126]} count={11} leaf={7} />
      <Eucalyptus idp={idp} seed={19} from={[82, 114]} ctrl={[100, 104]} to={[116, 98]} count={10} leaf={5.8} />

      {/* The dark blades fan down and left from the tie, which is what tips the
          whole spray onto its diagonal instead of leaving it upright. */}
      <LanceLeaf idp={idp} x={70} y={132} length={44} width={9.5} angle={133} seed={3} speckled />
      <LanceLeaf idp={idp} x={66} y={138} length={39} width={8.6} angle={164} seed={13} speckled />
      <LanceLeaf idp={idp} x={76} y={142} length={36} width={8} angle={102} seed={23} speckled />
      <LanceLeaf idp={idp} x={62} y={146} length={34} width={8} angle={146} seed={73} speckled />
      <LanceLeaf idp={idp} x={86} y={120} length={35} width={7.8} angle={22} seed={33} />
      <LanceLeaf idp={idp} x={90} y={106} length={29} width={6.4} angle={-42} seed={43} />
      <LanceLeaf idp={idp} x={58} y={112} length={27} width={6.4} angle={-152} seed={53} />
      <LanceLeaf idp={idp} x={98} y={128} length={26} width={5.8} angle={56} seed={63} pale />
      <LanceLeaf idp={idp} x={84} y={146} length={30} width={7} angle={114} seed={77} />
      <LanceLeaf idp={idp} x={50} y={128} length={24} width={5.6} angle={176} seed={87} pale />

      <StemBundle seed={5} from={[84, 138]} to={[116, 160]} count={6} spread={8} bindAt={0.5} />

      <Bud idp={idp} cx={92} cy={130} r={13} angle={34} seed={81} calyx={false} />
      <Bud idp={idp} cx={76} cy={150} r={10.5} angle={-12} seed={91} />
      <Bloom idp={idp} cx={62} cy={128} r={22.5} seed={2} kind="ranunculus" tilt={0.3} />
      {/* A second, smaller head behind and right, as the reference has. */}
      <Bloom idp={idp} cx={90} cy={118} r={10} seed={12} kind="rose" tilt={-0.4} />

      {/* Dark blades brought in front of the heads: in the reference the green
          overlaps the flowers rather than fringing them. */}
      <LanceLeaf idp={idp} x={74} y={148} length={38} width={9} angle={118} seed={101} />
      <LanceLeaf idp={idp} x={54} y={140} length={33} width={8.2} angle={158} seed={103} speckled />
      <LanceLeaf idp={idp} x={84} y={134} length={30} width={7.4} angle={48} seed={107} />

      <StarFloret cx={90} cy={100} r={6} angle={12} seed={61} stalk={[128, 8]} />
      <StarFloret cx={108} cy={114} r={5} angle={40} seed={67} stalk={[152, 10]} />
      <StarFloret cx={84} cy={86} r={4.8} angle={-20} seed={71} stalk={[104, 11]} />
      <StarFloret cx={40} cy={108} r={4.4} angle={30} seed={73} />
      <StarFloret cx={99} cy={88} r={4.2} angle={64} seed={79} stalk={[122, 12]} />
    </g>
  )
}

function TiedBouquet({ idp }: { idp: string }): ReactElement {
  return (
    <g>
      <Eucalyptus idp={idp} seed={7} from={[92, 140]} ctrl={[58, 122]} to={[28, 96]} count={12} leaf={7.6} />
      <Eucalyptus idp={idp} seed={17} from={[98, 140]} ctrl={[76, 96]} to={[62, 52]} count={12} leaf={6.6} />
      <Eucalyptus idp={idp} seed={23} from={[104, 140]} ctrl={[130, 100]} to={[148, 62]} count={12} leaf={6.8} />
      <Eucalyptus idp={idp} seed={37} from={[110, 142]} ctrl={[144, 130]} to={[172, 116]} count={11} leaf={7.6} />
      <Eucalyptus idp={idp} seed={41} from={[94, 146]} ctrl={[64, 156]} to={[34, 152]} count={11} leaf={7.2} />

      <Astilbe idp={idp} seed={13} base={[112, 104]} ctrl={[126, 72]} tip={[132, 38]} width={6.4} />
      <Astilbe idp={idp} seed={53} base={[86, 116]} ctrl={[60, 102]} tip={[34, 94]} width={5} />
      <Astilbe idp={idp} seed={59} base={[96, 104]} ctrl={[90, 76]} tip={[86, 48]} width={4.6} />

      {/* Green all the way round the posy, not only under it: in the photograph
          the foliage collar is what gives the mass its outline. */}
      <LanceLeaf idp={idp} x={94} y={142} length={54} width={10} angle={146} seed={3} />
      <LanceLeaf idp={idp} x={102} y={146} length={48} width={9} angle={78} seed={13} />
      <LanceLeaf idp={idp} x={92} y={138} length={50} width={9.4} angle={192} seed={23} />
      <LanceLeaf idp={idp} x={110} y={136} length={52} width={9.2} angle={28} seed={33} />
      <LanceLeaf idp={idp} x={90} y={124} length={50} width={9} angle={216} seed={43} />
      <LanceLeaf idp={idp} x={114} y={110} length={48} width={8.4} angle={-24} seed={83} />
      <LanceLeaf idp={idp} x={84} y={104} length={46} width={8.4} angle={-162} seed={93} />
      <LanceLeaf idp={idp} x={106} y={86} length={42} width={7.6} angle={-64} seed={97} />
      <LanceLeaf idp={idp} x={90} y={86} length={40} width={7.4} angle={-112} seed={101} />
      <LanceLeaf idp={idp} x={99} y={84} length={36} width={7} angle={-88} seed={107} />
      <LanceLeaf idp={idp} x={106} y={152} length={32} width={6.8} angle={104} seed={103} pale />
      <LanceLeaf idp={idp} x={92} y={152} length={30} width={6.4} angle={158} seed={113} pale />

      <StemBundle seed={5} from={[100, 142]} to={[108, 168]} count={6} spread={10} bindAt={0.42} />

      <Bud idp={idp} cx={142} cy={100} r={11} angle={24} seed={81} />
      <Bud idp={idp} cx={138} cy={124} r={10} angle={50} seed={85} />
      <Bud idp={idp} cx={54} cy={110} r={11} angle={-36} seed={89} />
      <Bud idp={idp} cx={95} cy={64} r={9.5} angle={-6} seed={95} calyx={false} />
      <Bud idp={idp} cx={126} cy={148} r={8.5} angle={86} seed={99} />

      <Bloom idp={idp} cx={77} cy={90} r={24} seed={2} kind="rose" tilt={0.2} lean={-28} />
      <Bloom idp={idp} cx={119} cy={84} r={19} seed={12} kind="rose" tilt={1.1} lean={34} />
      <Bloom idp={idp} cx={71} cy={127} r={22} seed={22} kind="rose" tilt={0.7} />
      <Bloom idp={idp} cx={117} cy={124} r={24} seed={32} kind="rose" tilt={1.6} lean={62} />
      <Bloom idp={idp} cx={97} cy={106} r={16} seed={42} kind="ranunculus" tilt={0.4} />

      <StarFloret cx={58} cy={148} r={5.2} angle={18} seed={61} />
      <StarFloret cx={72} cy={154} r={4.4} angle={44} seed={67} />
      <StarFloret cx={132} cy={150} r={4.8} angle={-12} seed={71} />
      <StarFloret cx={44} cy={132} r={4.4} angle={26} seed={73} stalk={[12, 11]} />
      <StarFloret cx={142} cy={76} r={4.4} angle={8} seed={79} stalk={[128, 11]} />
      <StarFloret cx={64} cy={70} r={4.2} angle={52} seed={89} stalk={[58, 12]} />

      <Ribbon idp={idp} />
    </g>
  )
}

function UprightSprig({ idp }: { idp: string }): ReactElement {
  return (
    <g>
      <Astilbe idp={idp} seed={11} base={[56, 140]} ctrl={[52, 110]} tip={[49, 76]} width={6} />
      <Astilbe idp={idp} seed={29} base={[62, 142]} ctrl={[69, 120]} tip={[74, 98]} width={4.6} />
      <Astilbe idp={idp} seed={43} base={[58, 144]} ctrl={[58, 124]} tip={[57, 104]} width={3.8} />

      <TubeCluster cx={46} cy={138} angle={-112} len={12} count={9} seed={31} />

      <Eucalyptus idp={idp} seed={7} from={[64, 154]} ctrl={[86, 138]} to={[100, 114]} count={11} leaf={6.8} />
      <Eucalyptus idp={idp} seed={19} from={[52, 156]} ctrl={[34, 146]} to={[19, 130]} count={10} leaf={5.8} />

      <LanceLeaf idp={idp} x={64} y={158} length={40} width={8.4} angle={24} seed={3} speckled />
      <LanceLeaf idp={idp} x={62} y={168} length={35} width={7.6} angle={52} seed={13} speckled />
      <LanceLeaf idp={idp} x={52} y={160} length={34} width={7.6} angle={156} seed={23} />
      <LanceLeaf idp={idp} x={50} y={148} length={29} width={6.4} angle={196} seed={33} />
      <LanceLeaf idp={idp} x={66} y={146} length={27} width={6} angle={-16} seed={43} />
      <LanceLeaf idp={idp} x={54} y={178} length={30} width={6.8} angle={132} seed={53} speckled />
      <LanceLeaf idp={idp} x={63} y={178} length={26} width={6.2} angle={62} seed={57} />
      <LanceLeaf idp={idp} x={46} y={136} length={22} width={5.2} angle={214} seed={67} pale />

      <path d="M 58 210 Q 57 188 56 168" fill="none" stroke="var(--color-leaf-deep)" strokeWidth={2.6} strokeLinecap="round" opacity={0.8} />
      <path d="M 58 210 Q 57 188 56 168" fill="none" stroke="var(--color-leaf)" strokeWidth={1.4} strokeLinecap="round" />

      <Bud idp={idp} cx={72} cy={182} r={10.5} angle={20} seed={81} />
      <Bloom idp={idp} cx={54} cy={164} r={22} seed={2} kind="ranunculus" tilt={0.9} />

      <StarFloret cx={40} cy={130} r={5.2} angle={16} seed={61} stalk={[34, 9]} />
      <StarFloret cx={33} cy={143} r={4.4} angle={-24} seed={67} />
      <StarFloret cx={74} cy={128} r={4.8} angle={38} seed={71} stalk={[148, 9]} />
      <StarFloret cx={46} cy={120} r={4.2} angle={58} seed={77} stalk={[62, 9]} />
    </g>
  )
}
