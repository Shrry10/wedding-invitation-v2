/**
 * The drawn lines that route the eye down the page.
 *
 * Three marks share one vocabulary: a long black dash with a hairline gap, a
 * small solid heart wherever the line has something to say, and nothing else.
 * The reference is a photograph of a hand-drawn line, so every proportion here
 * was measured off it rather than guessed — the sag of the washing line, the
 * dash and gap lengths, the heart silhouette and the run-out doodle are all
 * traced, then expressed as a fraction of the drawing's own span so the marks
 * keep their weight at any rendered size.
 *
 * Every heart is placed by evaluating the same spline the browser strokes, so
 * a node can never drift off its line however the stop count changes.
 */

import { jitter } from './geometry'
import type { Point } from './geometry'

const INK = 'var(--color-ink)'

/**
 * A point inside a component's own box, as a fraction of its width and height.
 *
 * Fractions rather than user units because the page scales these SVGs freely:
 * multiply by 100 for a CSS percentage and the label lands on the node at any
 * rendered size.
 */
export interface PathAnchor {
  readonly x: number
  readonly y: number
}

// ---------------------------------------------------------------------------
// Curve machinery
// ---------------------------------------------------------------------------

/** A point on a curve together with its derivative with respect to the curve's parameter. */
interface Knot {
  readonly t: number
  readonly x: number
  readonly y: number
  readonly dx: number
  readonly dy: number
}

function r(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * The knot list as an SVG path.
 *
 * A cubic Hermite segment converts to a cubic Bézier exactly, so the curve the
 * browser strokes is the same curve the anchors are computed from. That identity
 * is what lets the hearts be computed rather than nudged into place.
 */
function curveThrough(knots: readonly Knot[]): string {
  const first = knots[0]
  if (!first) return ''
  let d = `M ${r(first.x)} ${r(first.y)}`
  for (let i = 1; i < knots.length; i += 1) {
    const a = knots[i - 1] as Knot
    const b = knots[i] as Knot
    const h = (b.t - a.t) / 3
    d +=
      ` C ${r(a.x + a.dx * h)} ${r(a.y + a.dy * h)}` +
      ` ${r(b.x - b.dx * h)} ${r(b.y - b.dy * h)}` +
      ` ${r(b.x)} ${r(b.y)}`
  }
  return d
}

/**
 * A smooth path through traced points, centripetal Catmull-Rom.
 *
 * Centripetal rather than uniform because a trace has points crowded at the
 * tight turns and spread along the easy runs; the uniform form loops on itself
 * exactly there, at the pinch of the doodle's cleft.
 */
function smoothThrough(points: readonly Point[]): string {
  const n = points.length
  if (n < 2) return ''
  const t: number[] = [0]
  for (let i = 1; i < n; i += 1) {
    const a = points[i - 1] as Point
    const b = points[i] as Point
    const chord = Math.hypot(b[0] - a[0], b[1] - a[1])
    t.push((t[i - 1] as number) + Math.max(Math.sqrt(chord), 0.001))
  }
  const knots: Knot[] = points.map((p, i) => {
    const prev = points[Math.max(0, i - 1)] as Point
    const next = points[Math.min(n - 1, i + 1)] as Point
    const span = (t[Math.min(n - 1, i + 1)] as number) - (t[Math.max(0, i - 1)] as number)
    return {
      t: t[i] as number,
      x: p[0],
      y: p[1],
      dx: (next[0] - prev[0]) / span,
      dy: (next[1] - prev[1]) / span,
    }
  })
  return curveThrough(knots)
}

/**
 * A chubby filled heart, centred on (cx, cy).
 *
 * Traced from the photograph pixel by pixel, because the stock heart — two
 * circles over a triangle — is not this shape. The real one is squat and
 * almost circular on top: it reaches full width a sixth of the way down and
 * holds it past the middle, then falls to a point over the last third. The
 * cleft is a nick barely a tenth of the height deep, not a valley.
 */
function heartPath(cx: number, cy: number, w: number, h: number): string {
  const x = (f: number) => r(cx + f * w)
  const y = (f: number) => r(cy + f * h)
  return (
    `M ${x(0)} ${y(0.5)}` +
    ` C ${x(-0.22)} ${y(0.36)} ${x(-0.42)} ${y(0.24)} ${x(-0.46)} ${y(0.05)}` +
    ` C ${x(-0.53)} ${y(-0.07)} ${x(-0.52)} ${y(-0.28)} ${x(-0.42)} ${y(-0.41)}` +
    ` C ${x(-0.34)} ${y(-0.51)} ${x(-0.17)} ${y(-0.54)} ${x(-0.09)} ${y(-0.46)}` +
    ` C ${x(-0.06)} ${y(-0.43)} ${x(-0.03)} ${y(-0.4)} ${x(0)} ${y(-0.38)}` +
    ` C ${x(0.03)} ${y(-0.4)} ${x(0.06)} ${y(-0.43)} ${x(0.09)} ${y(-0.46)}` +
    ` C ${x(0.17)} ${y(-0.54)} ${x(0.34)} ${y(-0.51)} ${x(0.42)} ${y(-0.41)}` +
    ` C ${x(0.52)} ${y(-0.28)} ${x(0.53)} ${y(-0.07)} ${x(0.46)} ${y(0.05)}` +
    ` C ${x(0.42)} ${y(0.24)} ${x(0.22)} ${y(0.36)} ${x(0)} ${y(0.5)} Z`
  )
}

/**
 * One heart, tipped a few degrees.
 *
 * No two hearts in the photograph are quite upright; drawn perfectly vertical
 * they line up like printer's marks and the hand goes out of the drawing.
 */
function Heart({ at, w, h, seed }: { at: Point; w: number; h: number; seed: number }) {
  const tilt = r((jitter(seed) - 0.5) * 10)
  return (
    <path
      d={heartPath(at[0], at[1], w, h)}
      fill={INK}
      transform={`rotate(${tilt} ${r(at[0])} ${r(at[1])})`}
    />
  )
}

/**
 * The open heart the line ties itself into, traced off the photograph in the
 * order the pen drew it: out of the last dash, up the right flank, round the
 * right lobe, down into a pinched tongue at the cleft and back up, over the
 * left lobe, down the left flank to the point, then away to the right across
 * its own lead-in.
 *
 * Coordinates are the photograph's own pixels, measured from the dash end, and
 * scaled below; keeping them raw is what let them be checked against it.
 */
const DOODLE_TRACE: readonly Point[] = [
  [0, 0],
  [6.5, -0.5],
  [12.5, -1.5],
  [18.5, -4],
  [23, -6.5],
  [27.5, -9],
  [31, -11.5],
  [34.5, -15],
  [38, -19],
  [40.5, -25],
  [41.5, -32.5],
  [40, -36],
  [34.5, -39.5],
  [29.5, -38],
  [27.5, -36.5],
  [26.5, -35],
  [26.7, -25.5],
  [25.2, -22.8],
  [23.9, -25.5],
  [24, -35],
  [24.5, -36.5],
  [21.5, -37],
  [16.5, -37],
  [11.5, -35.5],
  [8.5, -31.5],
  [7.5, -29],
  [8.5, -25],
  [10.5, -21.5],
  [14.5, -17],
  [19.5, -13],
  [24.5, -10],
  [27.5, -8.5],
  [32.5, -7.5],
  [41.5, -7.5],
  [49.5, -8],
  [59.5, -9.5],
]
const DOODLE = smoothThrough(DOODLE_TRACE)

// ---------------------------------------------------------------------------
// Winding routes — the story's photographs and the details page's schedule
// ---------------------------------------------------------------------------

/*
 * Both pages that thread stops down a dashed line draw it from this one
 * geometry, so there is one rule for what a turn looks like.
 *
 * Reach and drop are constant, and that is the whole design: with one reach
 * and one drop every lobe is the same lobe mirrored, so every turn on the line
 * is congruent to every other. An earlier version nudged each drop by a few
 * per cent "so the line is not a printed sine" — measured on the page that
 * came out as a 12% spread between the shortest lobe and the longest, and
 * seven turns of seven different shapes. The hand is in the dashes and in the
 * tipped hearts, not in the geometry.
 *
 * The line makes one turn more than there are stops. It arrives where the next
 * stop would stand, exactly as it arrives at every real one — stops alternate
 * sides, so that slot is the empty one in the opposite column — and the slot
 * holds the heart the pen ties instead of a photograph or a drawing.
 */

/** The box every route is drawn in; a spec's numbers are in these units. */
const ROUTE_W = 1000
const ROUTE_CX = ROUTE_W / 2

/** What makes one route different from another. */
interface RouteSpec {
  /** Half the swing: stops land this far either side of centre, at every turn. */
  readonly amp: number
  /** How wide one stop's card is, as a fraction of the box. */
  readonly card: number
  /** Air above the first node, and room under the last node for its content. */
  readonly top: number
  readonly bottom: number
  /** The drop between consecutive stops. */
  readonly dy: number
  /** Whether each stop's heart is tied to its card's edge with a short dash. */
  readonly ties: boolean
  /** Stroke, dash, gap and heart, in box units. */
  readonly stroke: number
  readonly dash: number
  readonly gap: number
  readonly heart: number
  /** How wide the closing heart is drawn, as a fraction of a card. */
  readonly doodle: number
  /** Air under the closing heart, before the page's next thing. */
  readonly endPad: number
}

/*
 * The photograph route.
 *
 * The card is an instant-film mount, and the drop between stops is set from
 * its height by what the *same* side needs: stops alternate, so two prints in
 * one column are two drops apart, and that is the only gap a reader ever sees
 * as crowding. At 0.66 the column read as two stacks of photographs with a
 * line behind them; 0.78 leaves about a third of a mount of air between one
 * caption and the next print.
 *
 * Dash, gap, stroke and heart were measured off the reference page, which is
 * a 2x capture of a 1664px viewport, so its pixels halve into the same units
 * this box is rendered at.
 */
const PHOTO_CARD = 0.28
const PHOTO_CARD_RATIO = 718 / 600
const PHOTO_H = ROUTE_W * PHOTO_CARD * PHOTO_CARD_RATIO
/**
 * Room under the last print for its two lines of type and its sentence.
 *
 * Measured, not guessed: label, place line and a three-line sentence come to
 * 206 units under the print at the width the page draws the route; this
 * leaves a little air before whatever follows the route. At 170 the last
 * sentence ended five pixels above the route's edge.
 */
const PHOTO_CAPTION = 220
const PHOTO_EXTENT = 340
const PHOTO: RouteSpec = {
  amp: PHOTO_EXTENT / 2,
  card: PHOTO_CARD,
  top: PHOTO_H / 2 + 6,
  bottom: PHOTO_H / 2 + PHOTO_CAPTION + 18,
  // A full mount. With a sentence under every print the same-column air was
  // 55px at 0.94; this gives about 80, which is where it sat before the
  // sentences and where a reader stops seeing the next print as crowding.
  dy: PHOTO_H * 1.0,
  ties: true,
  stroke: PHOTO_EXTENT * 0.019,
  dash: PHOTO_EXTENT * 0.076,
  gap: PHOTO_EXTENT * 0.0135,
  heart: PHOTO_EXTENT * 0.058,
  doodle: 0.5,
  endPad: 70,
}

/*
 * The schedule.
 *
 * Four functions rather than seven photographs, each a drawing over three
 * short lines, beside a line that barely swings: the reference's timeline is a
 * gently wavy vertical with its stops held off to either side, not the broad S
 * the story needs to keep its prints apart. No ties, as the reference has
 * none — the hearts sit on the line and the drawings sit beside it.
 *
 * A stop's content is set in pixels rather than as a fraction of the box, so
 * the drop is chosen for the width the page draws the route at — 680px, one
 * unit to 0.68px. A stop is about 130px of content, and the drop is more than
 * that, so consecutive stops never share a band of the page: at a drop of
 * 150 a stop on the left and the next on the right overlapped by twenty
 * pixels, and four stops read as one cramped cluster rather than as a
 * sequence. The marks are the reference timeline's own, halved from its 2x
 * capture into these units.
 */
const SCHEDULE: RouteSpec = {
  amp: 55,
  card: 0.4,
  top: 46,
  bottom: 170,
  dy: 250,
  ties: false,
  stroke: 3.8,
  dash: 15,
  gap: 6,
  heart: 15,
  doodle: 0.22,
  endPad: 60,
}

/*
 * The schedule on a phone.
 *
 * The same winding line, drawn for a box a third as wide: the route is scaled
 * to its width, so every mark that should stay the same size on the screen is
 * three times as large here in box units — at 350px one unit is 0.35px. The
 * cards take a little more of the width, because the type in them cannot
 * shrink as far as the line can, and the swing is held just wide enough that
 * the hearts keep clear of the cards' inner edges.
 *
 * The drop is longer than the wide route's for the same reason: a stop is
 * about 190px of content at 350px, with the date and time on two lines, so a
 * drop of 470 lets the next stop's drawing start under the previous stop's
 * venue — the two share a little of the page on opposite sides, which a zigzag
 * reads as sequence, never the whole band.
 */
const SCHEDULE_NARROW: RouteSpec = {
  amp: 62,
  card: 0.42,
  top: 110,
  bottom: 520,
  dy: 470,
  ties: false,
  stroke: 7.5,
  dash: 26,
  gap: 11,
  heart: 30,
  doodle: 0.3,
  endPad: 110,
}

/** Which of the schedule's two drawings: the wide one, or the one for a phone. */
export type ScheduleLayout = 'wide' | 'narrow'

const SCHEDULE_SPECS: Record<ScheduleLayout, RouteSpec> = {
  wide: SCHEDULE,
  narrow: SCHEDULE_NARROW,
}

/**
 * Where the drawn heart's own middle sits inside `DOODLE_TRACE`, and how far
 * the whole doodle runs — the two numbers needed to place and size it.
 *
 * The trace is not centred on its heart: it opens at the heart's bottom point,
 * climbs the right flank, and leaves along a tail past the left flank, so the
 * shape's middle is a little under half way along it.
 */
const DOODLE_HEART = { x: 24.5, y: -23.5, span: 59.5 } as const

interface RouteNode {
  readonly x: number
  readonly y: number
}

/** Every turn the line makes: one per stop, and the one after the last. */
function routeNodes(spec: RouteSpec, stops: number): RouteNode[] {
  const out: RouteNode[] = []
  for (let i = 0; i <= stops; i += 1) {
    out.push({
      x: ROUTE_CX + (i % 2 === 0 ? -spec.amp : spec.amp),
      y: spec.top + i * spec.dy,
    })
  }
  return out
}

/** The middle of a card slot: 1 for the right-hand column, -1 for the left. */
function cardCentre(spec: RouteSpec, side: 1 | -1): number {
  const half = (ROUTE_W * spec.card) / 2
  return side === 1 ? ROUTE_W - half : half
}

/** The inner edge of a card slot, where a tie lands. */
function cardEdge(spec: RouteSpec, side: 1 | -1): number {
  return side === 1 ? ROUTE_W * (1 - spec.card) : ROUTE_W * spec.card
}

/**
 * Where the closing heart is drawn from, and how large.
 *
 * Offset along the line by the heart's own middle, so what lands on the centre
 * of the empty slot is the heart rather than the doodle's arbitrary starting
 * corner. Its y is the node's own, not the heart's, because the pen ties this
 * heart above the line it is running along — which is what the reference does,
 * and what lets the last run stay level.
 */
function routeDoodle(
  spec: RouteSpec,
  stops: number,
): { x: number; y: number; facing: 1 | -1; scale: number } {
  const nodes = routeNodes(spec, stops)
  const end = nodes[nodes.length - 1] as RouteNode
  const facing: 1 | -1 = end.x < ROUTE_CX ? -1 : 1
  const scale = (ROUTE_W * spec.card * spec.doodle) / DOODLE_HEART.span
  return {
    x: cardCentre(spec, facing) - facing * DOODLE_HEART.x * scale,
    y: end.y,
    facing,
    scale,
  }
}

function routeHeight(spec: RouteSpec, stops: number): number {
  const nodes = routeNodes(spec, stops)
  const last = nodes[nodes.length - 2]
  const end = nodes[nodes.length - 1] as RouteNode
  // Whichever reaches lower: the last stop's content, or the closing heart.
  return Math.max((last?.y ?? spec.top) + spec.bottom, end.y + spec.endPad)
}

/**
 * Knots for the whole line: a node, and the crossing between two nodes.
 *
 * The tangent at a node is vertical because a node is a turn; at a crossing it
 * carries the same slope a sine would have there, which is what keeps the bends
 * full instead of slack. With a constant reach and drop these are the same two
 * numbers at every knot, so the curve repeats exactly.
 */
function routeKnots(spec: RouteSpec, stops: number): Knot[] {
  const nodes = routeNodes(spec, stops)
  const knots: Knot[] = []
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i] as RouteNode
    const after = nodes[i + 1]
    knots.push({ t: i, x: node.x, y: node.y, dx: 0, dy: spec.dy })
    if (after !== undefined) {
      knots.push({
        t: i + 0.5,
        x: ROUTE_CX,
        y: (node.y + after.y) / 2,
        dx: (Math.PI / 2) * (after.x - node.x),
        dy: after.y - node.y,
      })
    }
  }
  return knots
}

/** Where each stop's heart sits, as a fraction of the component's own box. */
function routeAnchors(spec: RouteSpec, stops: number): PathAnchor[] {
  const height = routeHeight(spec, stops)
  return routeNodes(spec, stops)
    .slice(0, stops)
    .map((node) => ({ x: node.x / ROUTE_W, y: node.y / height }))
}

/**
 * The dashed line the stops hang from, with a heart at every turn, a short tie
 * from each heart to its card where the route asks for one, and the closing
 * heart in the empty slot after the last stop.
 *
 * The tie is the whole reason the photograph route reads as one object rather
 * than as a line with pictures near it: without it the eye has to guess which
 * print each heart means, and at the crossings it guesses wrong.
 */
function Route({
  spec,
  stops,
  className,
}: {
  spec: RouteSpec
  stops: number
  className?: string | undefined
}) {
  const height = routeHeight(spec, stops)
  const nodes = routeNodes(spec, stops)
  const end = nodes[nodes.length - 1] as RouteNode
  const doodle = routeDoodle(spec, stops)
  return (
    <svg
      className={className}
      viewBox={`0 0 ${ROUTE_W} ${r(height)}`}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={curveThrough(routeKnots(spec, stops))}
        fill="none"
        stroke={INK}
        strokeWidth={r(spec.stroke)}
        strokeDasharray={`${r(spec.dash)} ${r(spec.gap)}`}
      />
      {/* The last run, into the heart. Drawn in the line's own weight and dash,
          because it is the line finishing rather than a label's leader — a thin
          dotted one here reads as the line having been cut off. */}
      <path
        d={`M ${r(end.x)} ${r(end.y)} H ${r(doodle.x)}`}
        fill="none"
        stroke={INK}
        strokeWidth={r(spec.stroke)}
        strokeDasharray={`${r(spec.dash)} ${r(spec.gap)}`}
      />
      {spec.ties &&
        nodes.slice(0, stops).map((node) => {
          const outward: 1 | -1 = node.x < ROUTE_CX ? -1 : 1
          return (
            <path
              key={`tie-${r(node.y)}`}
              d={`M ${r(node.x + outward * spec.heart * 0.62)} ${r(node.y)} H ${r(cardEdge(spec, outward))}`}
              fill="none"
              stroke={INK}
              strokeWidth={r(spec.stroke * 0.78)}
              strokeDasharray={`${r(spec.dash * 0.3)} ${r(spec.gap * 1.8)}`}
              strokeLinecap="round"
            />
          )
        })}
      <g
        transform={`translate(${r(doodle.x)} ${r(doodle.y)}) scale(${doodle.facing * doodle.scale} ${doodle.scale})`}
      >
        <path
          d={DOODLE}
          fill="none"
          stroke={INK}
          strokeWidth={r(spec.stroke / doodle.scale)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {nodes.map((node, i) => (
        <Heart
          key={r(node.y)}
          at={[node.x, node.y]}
          w={spec.heart}
          h={spec.heart}
          seed={i * 13 + 2}
        />
      ))}
    </svg>
  )
}

/**
 * What a page must know to place a photograph on the story's line.
 *
 * The curve is generated here and the prints are placed by CSS, so the two meet
 * only if both work from one set of numbers. These are those numbers, as
 * fractions of the route's own width: a stop that is `cardWidth` wide, pulled
 * up by `photoHalf` from its node, puts the middle of the print's outer edge on
 * the heart — at any rendered size, because a percentage margin resolves
 * against the same width the percentage width does.
 */
export const PHOTO_ROUTE_LAYOUT = {
  cardWidth: PHOTO_CARD,
  photoHalf: (PHOTO_CARD * PHOTO_CARD_RATIO) / 2,
} as const

export function photoRouteNodes(stops: number): PathAnchor[] {
  return routeAnchors(PHOTO, stops)
}

export function photoRouteViewBox(stops: number): { width: number; height: number } {
  return { width: ROUTE_W, height: routeHeight(PHOTO, stops) }
}

export function PhotoRoute({
  stops,
  className,
}: {
  stops: number
  className?: string | undefined
}) {
  return <Route spec={PHOTO} stops={stops} className={className} />
}

/** What a page must know to place a stop beside the schedule's line. */
export const SCHEDULE_ROUTE_LAYOUT: Record<ScheduleLayout, { cardWidth: number }> = {
  wide: { cardWidth: SCHEDULE.card },
  narrow: { cardWidth: SCHEDULE_NARROW.card },
}

export function scheduleRouteNodes(stops: number, layout: ScheduleLayout): PathAnchor[] {
  return routeAnchors(SCHEDULE_SPECS[layout], stops)
}

export function scheduleRouteViewBox(
  stops: number,
  layout: ScheduleLayout,
): { width: number; height: number } {
  return { width: ROUTE_W, height: routeHeight(SCHEDULE_SPECS[layout], stops) }
}

export function ScheduleRoute({
  stops,
  layout,
  className,
}: {
  stops: number
  layout: ScheduleLayout
  className?: string | undefined
}) {
  return <Route spec={SCHEDULE_SPECS[layout]} stops={stops} className={className} />
}

/**
 * One heart on its own, for a layout that places its stops in normal flow and
 * so cannot be given a computed line to hang them on.
 */
export function HeartMark({
  size = 16,
  className,
}: {
  size?: number
  className?: string | undefined
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <path d={heartPath(50, 49, 90, 90)} fill={INK} />
    </svg>
  )
}
