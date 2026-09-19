import { useId, type CSSProperties, type ReactNode } from 'react'
import { jitter } from './geometry'

/**
 * The cream stationery.
 *
 * Every object here is a photograph in the reference: a lace-edged stamp, an
 * embossed oval label, a blind-stamped countdown panel, a portrait invitation
 * card. They are redrawn rather than traced, so the relief is built the way the
 * press builds it — a line struck three times, shade below and to the right,
 * highlight above and to the left, with the sheet's own tone between. No blur
 * filter is involved: a blurred shadow reads as a sticker floating over the
 * page, which is exactly what these are not.
 *
 * Ornament that the reference strikes from a symmetric die is drawn once as a
 * half and mirrored with a transform. Drawing both halves by hand always leaves
 * a small asymmetry, and on tone-on-tone relief that asymmetry is the first
 * thing that gives the drawing away.
 */

/* ---------------------------------------------------------------------------
   Palette. Only custom properties; the derived tones are mixes, because the
   stationery needs one step lighter than --color-cream and one step between
   cream and its shade, and neither exists as a token.
   --------------------------------------------------------------------------- */
const CREAM = 'var(--color-cream)'
const CREAM_DEEP = 'var(--color-cream-deep)'
const SHADE = 'var(--color-cream-shade)'
/** The lit face of an embossed ridge — cream carried most of the way to white. */
const HIGHLIGHT = 'color-mix(in srgb, var(--color-cream) 30%, var(--color-paper))'
/** The lace border of the stamp, which photographs greyer than its own panel. */
const LACE = 'color-mix(in srgb, var(--color-cream-deep) 55%, var(--color-paper))'
const INK = 'var(--color-ink)'
const PAPER = 'var(--color-paper)'

type Pt = readonly [number, number]

const round = (n: number): number => Math.round(n * 100) / 100

/* ---------------------------------------------------------------------------
   Path construction.
   --------------------------------------------------------------------------- */

/**
 * Joins points with circular arcs of a fixed sweep angle.
 *
 * Sweep is given in degrees rather than as a radius multiplier because the
 * stationery uses three quite different scallops: the sharp picot of a lace
 * edge (around 70°), the shallow lobe of an embossed label (around 80°) and the
 * near-closed bobble of the message frame (around 255°, which needs the
 * large-arc flag). Deriving the radius from the chord keeps all three even
 * however many lobes a side is given.
 */
function arcChain(points: readonly Pt[], sweepDeg: number, closed: boolean): string {
  const first = points[0]
  if (first === undefined) return ''
  let d = `M ${round(first[0])} ${round(first[1])}`
  const large = sweepDeg > 180 ? 1 : 0
  const halfAngle = (((sweepDeg > 180 ? 360 - sweepDeg : sweepDeg) / 2) * Math.PI) / 180
  const stop = closed ? points.length : points.length - 1
  for (let i = 1; i <= stop; i += 1) {
    const from = points[(i - 1) % points.length] as Pt
    const to = points[i % points.length] as Pt
    const chord = Math.hypot(to[0] - from[0], to[1] - from[1])
    const r = chord / (2 * Math.sin(halfAngle))
    d += ` A ${round(r)} ${round(r)} 0 ${large} 1 ${round(to[0])} ${round(to[1])}`
  }
  return closed ? `${d} Z` : d
}

/** Joins points with a smooth polyline, for a guide that carries no scallop. */
function polyline(points: readonly Pt[]): string {
  const first = points[0]
  if (first === undefined) return ''
  let d = `M ${round(first[0])} ${round(first[1])}`
  for (let i = 1; i < points.length; i += 1) {
    const p = points[i] as Pt
    d += ` L ${round(p[0])} ${round(p[1])}`
  }
  return d
}

/**
 * Resamples a polyline at equal arc length, so lobes stay evenly spaced.
 *
 * `multiple` forces the sample count to a multiple of itself, which a picot
 * fringe needs: its points alternate valley and tip, and an odd count would put
 * two tips side by side where the chain closes. An open run keeps its last
 * point, because the silhouettes are built from several runs joined end to end
 * and a dropped endpoint leaves a gap; a closed loop drops it, because it is
 * the first point again.
 */
function resample(polylinePts: readonly Pt[], step: number, closed = true, multiple = 1): Pt[] {
  const lengths: number[] = [0]
  for (let i = 1; i < polylinePts.length; i += 1) {
    const a = polylinePts[i - 1] as Pt
    const b = polylinePts[i] as Pt
    lengths.push((lengths[i - 1] as number) + Math.hypot(b[0] - a[0], b[1] - a[1]))
  }
  const total = lengths[lengths.length - 1] as number
  const raw = Math.round(total / step / multiple) * multiple
  const count = Math.max(closed ? 4 * multiple : 2, raw)
  const out: Pt[] = []
  let cursor = 1
  for (let i = 0; i < (closed ? count : count + 1); i += 1) {
    const target = (i / count) * total
    while (cursor < lengths.length - 1 && (lengths[cursor] as number) < target) cursor += 1
    const prev = lengths[cursor - 1] as number
    const next = lengths[cursor] as number
    const t = next === prev ? 0 : (target - prev) / (next - prev)
    const a = polylinePts[cursor - 1] as Pt
    const b = polylinePts[cursor] as Pt
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
  }
  return out
}

/**
 * Unit normals pointing away from the interior.
 *
 * Every outline here is wound clockwise in screen coordinates, so rotating the
 * tangent by -90° faces outward; ornament placed along a border needs that
 * direction to know which way to lean.
 */
function normals(points: readonly Pt[], closed: boolean): Pt[] {
  const out: Pt[] = []
  const n = points.length
  for (let i = 0; i < n; i += 1) {
    const prev = points[closed ? (i - 1 + n) % n : Math.max(0, i - 1)] as Pt
    const next = points[closed ? (i + 1) % n : Math.min(n - 1, i + 1)] as Pt
    const tx = next[0] - prev[0]
    const ty = next[1] - prev[1]
    const len = Math.hypot(tx, ty) || 1
    out.push([ty / len, -tx / len])
  }
  return out
}

/** The perimeter of a rounded rectangle, clockwise, as a dense polyline. */
function roundedRectPolyline(x: number, y: number, w: number, h: number, r: number): Pt[] {
  const pts: Pt[] = []
  const corners: readonly (readonly [number, number, number])[] = [
    [x + w - r, y + r, -90],
    [x + w - r, y + h - r, 0],
    [x + r, y + h - r, 90],
    [x + r, y + r, 180],
  ]
  for (const corner of corners) {
    const [cx, cy, start] = corner
    for (let i = 0; i <= 8; i += 1) {
      const a = ((start + (i / 8) * 90) * Math.PI) / 180
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
    }
  }
  const first = pts[0] as Pt
  pts.push(first)
  return pts
}

/**
 * A lace picot fringe around a rectangle.
 *
 * Alternate samples are pushed outward and the whole chain is joined with
 * shallow arcs, so each pushed sample becomes a sharp point with rounded
 * flanks. That corner at the tip is the whole difference between lace and a
 * row of bubbles: the reference stamp is cut with a pinking die, not punched.
 */
function picotRect(
  x: number,
  y: number,
  w: number,
  h: number,
  period: number,
  depth: number,
): string {
  const base = resample(roundedRectPolyline(x, y, w, h, period * 0.8), period / 2, true, 2)
  const norm = normals(base, true)
  const tips: Pt[] = base.map((p, i) => {
    if (i % 2 === 0) return p
    const nrm = norm[i] as Pt
    return [p[0] + nrm[0] * depth, p[1] + nrm[1] * depth]
  })
  return arcChain(tips, 58, true)
}

/** A rectangle whose whole perimeter is a chain of bobbles. */
function bobbledRect(
  x: number,
  y: number,
  w: number,
  h: number,
  period: number,
  sweepDeg: number,
): string {
  return arcChain(resample(roundedRectPolyline(x, y, w, h, period * 0.9), period), sweepDeg, true)
}

/**
 * A squircle — an ellipse pulled towards a rounded rectangle.
 *
 * The labels in the reference are not ellipses: they are cartouches, fat at the
 * four corners and nearly straight between, and a plain ellipse scalloped at
 * even angles comes out as a flower instead. Points are resampled by arc length
 * so the scallops stay the same size around the fat corners; starting the walk
 * at the top centre makes the result exactly symmetric left to right, which a
 * tone-on-tone emboss needs.
 */
function squirclePoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  power: number,
  count: number,
): Pt[] {
  const dense: Pt[] = []
  for (let i = 0; i <= 360; i += 1) {
    const a = -Math.PI / 2 + (i / 360) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    dense.push([
      cx + rx * Math.sign(c) * Math.abs(c) ** (2 / power),
      cy + ry * Math.sign(s) * Math.abs(s) ** (2 / power),
    ])
  }
  let perimeter = 0
  for (let i = 1; i < dense.length; i += 1) {
    const p = dense[i] as Pt
    const q = dense[i - 1] as Pt
    perimeter += Math.hypot(p[0] - q[0], p[1] - q[1])
  }
  return resample(dense, perimeter / count)
}

/**
 * A coiled scroll terminal.
 *
 * Drawn as a sampled polyline rather than as arcs: a scroll's radius falls
 * continuously, which no single arc can follow, and at the size these are
 * struck the samples are well under a pixel apart.
 */
function curl(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  turns: number,
  dir: 1 | -1,
): string {
  const steps = Math.max(20, Math.round(turns * 30))
  const pts: Pt[] = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const a = ((startAngle * Math.PI) / 180) + dir * t * turns * Math.PI * 2
    const r = radius * (1 - 0.72 * t)
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return polyline(pts)
}

/** A pointed leaf — two quadratics meeting at a tip, as the engraver cuts it. */
function leaf(x: number, y: number, len: number, wide: number, angleDeg: number): string {
  const a = (angleDeg * Math.PI) / 180
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const tipX = x + ux * len
  const tipY = y + uy * len
  const midX = x + ux * len * 0.45
  const midY = y + uy * len * 0.45
  const nx = -uy * wide
  const ny = ux * wide
  return (
    `M ${round(x)} ${round(y)} Q ${round(midX + nx)} ${round(midY + ny)} ${round(tipX)} ${round(tipY)}` +
    ` Q ${round(midX - nx)} ${round(midY - ny)} ${round(x)} ${round(y)}`
  )
}

/**
 * The fleuron struck at the head of a border: a fan of ribs held inside a lyre
 * of two sweeping curves, standing on a pair of volutes.
 *
 * Symmetric about x by construction and always drawn upright, so a caller that
 * needs it at the foot of a shape flips it with a transform rather than with
 * negative numbers. The reference uses this motif at the crown of the countdown
 * panel and, much smaller, at the head and foot of every oval label, so it is
 * written once and scaled.
 */
function fleuron(cx: number, baseY: number, w: number, h: number): string[] {
  const out: string[] = []
  out.push(leaf(cx, baseY, h, w * 0.06, -90))
  for (const dir of [-1, 1] as const) {
    // The lyre: out of the base, up and back in towards the tip of the fan.
    out.push(
      `M ${round(cx)} ${round(baseY)}` +
        ` C ${round(cx + dir * w * 0.3)} ${round(baseY - h * 0.08)}` +
        ` ${round(cx + dir * w * 0.44)} ${round(baseY - h * 0.56)}` +
        ` ${round(cx + dir * w * 0.2)} ${round(baseY - h * 0.9)}`,
    )
    out.push(leaf(cx, baseY, h * 0.78, w * 0.05, -90 + dir * 24))
    out.push(leaf(cx, baseY, h * 0.5, w * 0.045, -90 + dir * 52))
    // The foot scroll, which is what seats the fleuron on the rule below it.
    out.push(
      `M ${round(cx + dir * w * 0.06)} ${round(baseY)}` +
        ` C ${round(cx + dir * w * 0.24)} ${round(baseY + h * 0.06)}` +
        ` ${round(cx + dir * w * 0.42)} ${round(baseY + h * 0.02)}` +
        ` ${round(cx + dir * w * 0.48)} ${round(baseY - h * 0.1)}`,
    )
    out.push(curl(cx + dir * w * 0.48, baseY - h * 0.14, h * 0.16, dir === 1 ? 90 : 90, 1.1, dir))
  }
  return out
}

/**
 * A running scroll: a chain of C-stems along a guide, an eye coiled at each
 * junction and a leaf springing from each bay.
 *
 * Built from the guide rather than from straight runs, so the same chain climbs
 * an arch and runs down a straight side without a seam where the two meet.
 */
function runningScroll(
  stations: readonly Pt[],
  amp: number,
  coil: number,
  taper: number,
): string[] {
  const out: string[] = []
  const nrm = normals(stations, false)
  const last = Math.max(1, stations.length - 1)
  for (let i = 0; i < stations.length - 1; i += 1) {
    const p = stations[i] as Pt
    const q = stations[i + 1] as Pt
    const np = nrm[i] as Pt
    const nq = nrm[i + 1] as Pt
    // The die is cut boldest where it is seen first and quietens as it runs
    // down the sides, which is what keeps a long border from reading as a
    // repeating tile.
    const k = 1 - taper * (i / last)
    out.push(
      `M ${round(p[0])} ${round(p[1])}` +
        ` C ${round(p[0] + np[0] * amp * k * 1.9)} ${round(p[1] + np[1] * amp * k * 1.9)}` +
        ` ${round(q[0] + nq[0] * amp * k * 1.9)} ${round(q[1] + nq[1] * amp * k * 1.9)}` +
        ` ${round(q[0])} ${round(q[1])}`,
    )
    const angle = (Math.atan2(np[1], np[0]) * 180) / Math.PI
    out.push(
      curl(p[0] - np[0] * coil * k * 0.5, p[1] - np[1] * coil * k * 0.5, coil * k, angle - 20, 1.3, 1),
    )
    const midX = (p[0] + q[0]) / 2
    const midY = (p[1] + q[1]) / 2
    out.push(leaf(midX, midY, coil * k * (i % 2 === 0 ? 1.7 : 1), coil * k * 0.4, angle + 180))
  }
  return out
}

/* ---------------------------------------------------------------------------
   Shared rendering.
   --------------------------------------------------------------------------- */

const SVG_LAYER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  display: 'block',
  /* An SVG clips to its viewport by default. Every scallop on these panels is
     an arc bulging outward from a point on the viewBox edge, so the outermost
     lobe of each one falls outside it — which sliced the shoulders off the top
     of the countdown card. The art is drawn correctly; it was being cut. */
  overflow: 'visible',
}

interface SheetProps {
  className?: string | undefined
  children?: ReactNode | undefined
  /** The proportion the object was drawn at; content longer than that grows it. */
  ratio: string
  /** Keeps the words clear of the drawn border. */
  inset: string
  viewBox: string
  art: ReactNode
}

/**
 * A drawn object with words laid into it.
 *
 * The art is an absolutely positioned layer and the children sit in normal
 * flow, so a page can pass a paragraph that outgrows the drawing's proportion
 * and get a taller object instead of clipped text.
 */
function Sheet({ className, children, ratio, inset, viewBox, art }: SheetProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        aspectRatio: ratio,
        padding: inset,
        boxSizing: 'border-box',
      }}
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        style={SVG_LAYER}
      >
        {art}
      </svg>
      <div style={{ position: 'relative', width: '100%' }}>{children}</div>
    </div>
  )
}

interface ReliefProps {
  href: string
  width: number
  /** Depth of the strike. Larger reads as a deeper die. */
  depth?: number | undefined
}

/**
 * One blind-embossed line, struck three times.
 *
 * Shade goes down-and-right, highlight up-and-left, and a soft mid-tone holds
 * the ridge itself. The eye reads the pair of offsets as a raised edge lit from
 * the top left, which is how every embossed sheet in the reference is lit.
 */
function Relief({ href, width, depth = 1 }: ReliefProps) {
  return (
    <>
      <use
        href={`#${href}`}
        transform={`translate(${round(0.9 * depth)} ${round(1.1 * depth)})`}
        fill="none"
        stroke={SHADE}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      <use
        href={`#${href}`}
        transform={`translate(${round(-0.8 * depth)} ${round(-1 * depth)})`}
        fill="none"
        stroke={HIGHLIGHT}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <use
        href={`#${href}`}
        fill="none"
        stroke={CREAM_DEEP}
        strokeWidth={width * 0.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
    </>
  )
}

/**
 * The tooth of cotton paper.
 *
 * Fibre is drawn, not filtered: a fixed scatter of short flecks from jitter(),
 * so the same sheet comes back on every render and the prerendered HTML and the
 * hydrated one agree.
 */
function Fibre({
  clip,
  count,
  width,
  height,
}: {
  clip: string
  count: number
  width: number
  height: number
}) {
  const flecks: ReactNode[] = []
  for (let i = 0; i < count; i += 1) {
    const x = jitter(i + 1) * width
    const y = jitter(i + 91) * height
    const len = 0.8 + jitter(i + 181) * 1.8
    const angle = jitter(i + 271) * 180
    flecks.push(
      <line
        key={i}
        x1={round(x)}
        y1={round(y)}
        x2={round(x + len * Math.cos((angle * Math.PI) / 180))}
        y2={round(y + len * Math.sin((angle * Math.PI) / 180))}
      />,
    )
  }
  return (
    <g
      clipPath={`url(#${clip})`}
      stroke={SHADE}
      strokeWidth={0.5}
      strokeLinecap="round"
      opacity={0.3}
    >
      {flecks}
    </g>
  )
}

/**
 * The cut edge of a sheet.
 *
 * The bevel is two copies of the silhouette clipped to itself — light shifted
 * up-left, shade shifted down-right — which gives the edge thickness without
 * casting anything onto the page behind it.
 */
function PaperEdge({ href, clip }: { href: string; clip: string }) {
  return (
    <g clipPath={`url(#${clip})`}>
      <use
        href={`#${href}`}
        transform="translate(-1 -1.2)"
        fill="none"
        stroke={HIGHLIGHT}
        strokeWidth={1.8}
        opacity={0.9}
      />
      <use
        href={`#${href}`}
        transform="translate(1 1.2)"
        fill="none"
        stroke={SHADE}
        strokeWidth={1.8}
        opacity={0.55}
      />
    </g>
  )
}

interface PaperProps {
  children?: ReactNode | undefined
  className?: string | undefined
}

/* ---------------------------------------------------------------------------
   Lace-edged stamp.
   --------------------------------------------------------------------------- */

const STAMP_W = 240
const STAMP_H = 108
/** Tip-to-tip spacing of the picots, and of the eyelets inside them. */
const PICOT = 5.6

const STAMP_EDGE = picotRect(6, 6, STAMP_W - 12, STAMP_H - 12, PICOT, 3.6)
/** The lace band is the paper between the fringe and the panel: on the stamp
    itself it is a woven ground, so it gets two rings of hairline scallop rather
    than an outline, which is what a perforated weave looks like from reading
    distance. */
const STAMP_WEAVE_OUT = arcChain(
  resample(roundedRectPolyline(9.5, 9.5, STAMP_W - 19, STAMP_H - 19, 6), PICOT),
  150,
  true,
)
const STAMP_WEAVE_IN = arcChain(
  resample(roundedRectPolyline(13, 13, STAMP_W - 26, STAMP_H - 26, 6), PICOT),
  150,
  true,
)
const STAMP_EYELETS = resample(
  roundedRectPolyline(11.4, 11.4, STAMP_W - 22.8, STAMP_H - 22.8, 6),
  PICOT,
)
const PANEL_INSET = 16

function StampArt({ uid }: { uid: string }) {
  const clip = `${uid}-clip`
  return (
    <>
      <defs>
        <path id={`${uid}-edge`} d={STAMP_EDGE} />
        <clipPath id={clip}>
          <use href={`#${uid}-edge`} />
        </clipPath>
      </defs>
      <use href={`#${uid}-edge`} fill={LACE} />
      <Fibre clip={clip} count={90} width={STAMP_W} height={STAMP_H} />
      <g
        clipPath={`url(#${clip})`}
        fill="none"
        stroke={SHADE}
        strokeWidth={0.38}
        strokeLinecap="round"
        opacity={0.6}
      >
        <path d={STAMP_WEAVE_OUT} />
        <path d={STAMP_WEAVE_IN} />
        {STAMP_EYELETS.map((p, i) => (
          <circle key={i} cx={round(p[0])} cy={round(p[1])} r={0.75} />
        ))}
      </g>
      <PaperEdge href={`${uid}-edge`} clip={clip} />
      {/* The panel is brighter than the lace around it and its edge is a clean
          cut, because on the stamp the lace is a separate, denser weave pressed
          around a plain centre. */}
      <rect
        x={PANEL_INSET}
        y={PANEL_INSET}
        width={STAMP_W - PANEL_INSET * 2}
        height={STAMP_H - PANEL_INSET * 2}
        fill={CREAM}
      />
      <rect
        x={PANEL_INSET}
        y={PANEL_INSET}
        width={STAMP_W - PANEL_INSET * 2}
        height={STAMP_H - PANEL_INSET * 2}
        fill="none"
        stroke={SHADE}
        strokeWidth={0.35}
        opacity={0.2}
      />
    </>
  )
}

/**
 * The small cream stamp with a lace-picot edge — "TAP TO OPEN" on the envelope,
 * and the same die used long and low for "GET DIRECTIONS".
 */
export function DeckleStamp({ children, className }: PaperProps) {
  const uid = useId().replace(/:/g, '')
  return (
    <Sheet
      className={className}
      ratio={`${STAMP_W} / ${STAMP_H}`}
      inset="14% 10%"
      viewBox={`0 0 ${STAMP_W} ${STAMP_H}`}
      art={<StampArt uid={uid} />}
    >
      {children}
    </Sheet>
  )
}

/* ---------------------------------------------------------------------------
   Scalloped oval label.
   --------------------------------------------------------------------------- */

const OVAL_W = 224
const OVAL_H = 152
const OVAL_CX = OVAL_W / 2
const OVAL_CY = OVAL_H / 2
const OVAL_EDGE = arcChain(squirclePoints(OVAL_CX, OVAL_CY, 107, 71, 2.9, 14), 78, true)
/** The engraved rule is smooth where the edge is scalloped: on the reference
    the die cuts one fine unbroken line inside a cloud-cut card. */
const OVAL_RULE_PTS = squirclePoints(OVAL_CX, OVAL_CY, 91, 56, 2.9, 60)
const OVAL_RULE = arcChain(OVAL_RULE_PTS, 7, true)
const OVAL_RULE_NORMALS = normals(OVAL_RULE_PTS, true)

/**
 * The top-right quarter of the engraved spray; mirroring it four ways gives the
 * head spray and the foot spray at once.
 *
 * The tendril is laid along the rule itself rather than drawn freehand, bowing
 * away from it through the middle of its run, because an engraver cuts cartouche
 * ornament off the frame it belongs to. It stops well short of the flank: the
 * reference leaves the sides of the label bare but for one small volute.
 */
function ovalQuarter(): string[] {
  const out: string[] = []
  const last = 7
  const run: Pt[] = []
  for (let i = 1; i <= last; i += 1) {
    const p = OVAL_RULE_PTS[i] as Pt
    const n = OVAL_RULE_NORMALS[i] as Pt
    const t = (i - 1) / (last - 1)
    const bow = 2 + 5.5 * Math.sin(t * Math.PI)
    run.push([p[0] - n[0] * bow, p[1] - n[1] * bow])
  }
  out.push(polyline(run))
  const tail = run[run.length - 1] as Pt
  const before = run[run.length - 2] as Pt
  const tailAngle = (Math.atan2(tail[1] - before[1], tail[0] - before[0]) * 180) / Math.PI
  out.push(curl(tail[0], tail[1], 4.2, tailAngle - 90, 1.1, 1))
  // Leaves break outward across the rule, the way a pressed spray overlaps the
  // frame it grows from. Kept broad: a narrow almond reads as a thorn.
  for (const i of [1, 4] as const) {
    const p = run[i] as Pt
    const n = OVAL_RULE_NORMALS[i + 1] as Pt
    const angle = (Math.atan2(n[1], n[0]) * 180) / Math.PI
    out.push(leaf(p[0], p[1], 13, 4.4, angle - 44))
    out.push(leaf(p[0], p[1], 8, 3, angle + 136))
  }
  // One volute at the flank, where the cartouche is widest; the four-way mirror
  // supplies the other three. A leaf off its back stops it floating.
  out.push(curl(OVAL_CX + 86, OVAL_CY + 11, 5, -150, 1.2, 1))
  out.push(leaf(OVAL_CX + 86, OVAL_CY + 13, 9, 3, 70))
  return out
}

const OVAL_QUARTER = ovalQuarter()
const OVAL_FLEURON = fleuron(OVAL_CX, OVAL_CY - 50, 40, 16)

function OvalArt({ uid }: { uid: string }) {
  const clip = `${uid}-clip`
  return (
    <>
      <defs>
        <path id={`${uid}-edge`} d={OVAL_EDGE} />
        <clipPath id={clip}>
          <use href={`#${uid}-edge`} />
        </clipPath>
        <g id={`${uid}-quarter`}>
          {OVAL_QUARTER.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g id={`${uid}-fleuron`}>
          {OVAL_FLEURON.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g id={`${uid}-engraving`}>
          <path d={OVAL_RULE} />
          <use href={`#${uid}-quarter`} />
          <use href={`#${uid}-quarter`} transform={`translate(${OVAL_W} 0) scale(-1 1)`} />
          <use href={`#${uid}-quarter`} transform={`translate(0 ${OVAL_H}) scale(1 -1)`} />
          <use
            href={`#${uid}-quarter`}
            transform={`translate(${OVAL_W} ${OVAL_H}) scale(-1 -1)`}
          />
          <use href={`#${uid}-fleuron`} />
          <use href={`#${uid}-fleuron`} transform={`translate(0 ${OVAL_H}) scale(1 -1)`} />
        </g>
      </defs>
      <use href={`#${uid}-edge`} fill={CREAM} />
      <Fibre clip={clip} count={110} width={OVAL_W} height={OVAL_H} />
      <PaperEdge href={`${uid}-edge`} clip={clip} />
      <use href={`#${uid}-edge`} fill="none" stroke={SHADE} strokeWidth={0.55} opacity={0.8} />
      <g clipPath={`url(#${clip})`}>
        <Relief href={`${uid}-engraving`} width={0.8} depth={0.7} />
      </g>
    </>
  )
}

/**
 * The ornate embossed oval — "The Details", "Our story", "Save the Date".
 *
 * A scalloped edge, a fine rule set in from it, and a foliate spray struck at
 * the head and the foot. Everything is cream on cream; the label is legible
 * because of the relief, not because of any colour difference.
 */
export function ScallopedOval({ children, className }: PaperProps) {
  const uid = useId().replace(/:/g, '')
  return (
    <Sheet
      className={className}
      ratio={`${OVAL_W} / ${OVAL_H}`}
      inset="20% 19%"
      viewBox={`0 0 ${OVAL_W} ${OVAL_H}`}
      art={<OvalArt uid={uid} />}
    >
      {children}
    </Sheet>
  )
}

/* ---------------------------------------------------------------------------
   Embossed countdown panel.
   --------------------------------------------------------------------------- */

const CARD_W = 260
const CARD_H = 320
/** Where the crown springs from the straight sides. */
const CARD_SPRING = 76
/** The panel silhouette: scalloped crown, straight sides, rounded foot. */
/**
 * A closed curve through the sampled points, smoothed.
 *
 * Catmull-Rom converted to cubic Béziers. Joining the samples with straight
 * lines leaves visible facets, and this edge has to read as soft pressed paper.
 */
function smoothClosed(points: readonly Pt[]): string {
  const n = points.length
  if (n < 3) return ''
  const at = (i: number) => points[((i % n) + n) % n] as Pt
  const r = (v: number) => Math.round(v * 100) / 100
  const first = at(0)
  let d = `M ${r(first[0])} ${r(first[1])}`
  for (let i = 0; i < n; i += 1) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    d +=
      ` C ${r(p1[0] + (p2[0] - p0[0]) / 6)} ${r(p1[1] + (p2[1] - p0[1]) / 6)},` +
      ` ${r(p2[0] - (p3[0] - p1[0]) / 6)} ${r(p2[1] - (p3[1] - p1[1]) / 6)},` +
      ` ${r(p2[0])} ${r(p2[1])}`
  }
  return `${d} Z`
}

/**
 * The panel silhouette: one continuous scalloped curve.
 *
 * The reference card is a lobed oval — the scallops run down the sides as well
 * as over the top, and there are no straight sides for a crown to spring from.
 * An earlier version built it as a rectangle with an arch bolted onto the top,
 * which left a hard shoulder where the two met; against a white page that
 * angular join read as the top of the card having been cut off.
 *
 * The base curve is a superellipse rather than an ellipse, because the card
 * carries its full width most of the way down before turning in.
 */
function cardOutline(inset: number): string {
  const cx = CARD_W / 2
  const cy = CARD_H / 2
  const a = CARD_W / 2 - 7 - inset
  const b = CARD_H / 2 - 7 - inset
  const squareness = 2.9
  const lobes = 16
  // Shallow enough to read as a deckled edge rather than as a flower.
  const amp = 0.03 - inset * 0.0005
  const steps = lobes * 10
  const points: Pt[] = []
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    const unitX = Math.sign(c) * Math.abs(c) ** (2 / squareness)
    const unitY = Math.sign(s) * Math.abs(s) ** (2 / squareness)
    const swell = 1 + amp * Math.cos(lobes * t)
    points.push([cx + a * unitX * swell, cy + b * unitY * swell])
  }
  return smoothClosed(points)
}

const CARD_EDGE = cardOutline(0)
const CARD_RULE = cardOutline(13)

/**
 * The guide the border ornament runs along: the crown from its apex down the
 * right shoulder, then straight down the right side. Half only, because the
 * band is mirrored.
 */
function cardScrollHalf(): string[] {
  const inset = 31
  const dense: Pt[] = []
  const left = 6 + inset
  const right = CARD_W - 6 - inset
  const rx = (right - left) / 2
  const ry = 60 - inset * 0.5
  const spring = CARD_SPRING + inset * 0.5
  for (let i = 0; i <= 40; i += 1) {
    const a = (Math.PI / 2) * (1 - i / 40)
    dense.push([CARD_W / 2 + rx * Math.cos(a), spring - ry * Math.sin(a)])
  }
  for (let i = 1; i <= 24; i += 1) dense.push([right, spring + ((CARD_H - 40 - spring) * i) / 24])
  // The chain starts a clear step away from the centre so the crown fleuron has
  // room to sit between the two halves.
  const stations = resample(dense, 33, false).slice(1)
  return runningScroll(stations, 6.4, 11, 0.42)
}

const CARD_SCROLL = cardScrollHalf()
const CARD_CROWN_FLEURON = fleuron(CARD_W / 2, 62, 84, 36)

function CardArt({ uid }: { uid: string }) {
  const clip = `${uid}-clip`
  return (
    <>
      <defs>
        <path id={`${uid}-edge`} d={CARD_EDGE} />
        <clipPath id={clip}>
          <use href={`#${uid}-edge`} />
        </clipPath>
        <g id={`${uid}-half`}>
          {CARD_SCROLL.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path id={`${uid}-rules`} d={CARD_RULE} />
        <g id={`${uid}-ornament`}>
          <use href={`#${uid}-half`} />
          <use href={`#${uid}-half`} transform={`translate(${CARD_W} 0) scale(-1 1)`} />
          {CARD_CROWN_FLEURON.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </defs>
      <use href={`#${uid}-edge`} fill={CREAM} />
      <Fibre clip={clip} count={260} width={CARD_W} height={CARD_H} />
      <PaperEdge href={`${uid}-edge`} clip={clip} />
      <use href={`#${uid}-edge`} fill="none" stroke={SHADE} strokeWidth={0.6} opacity={0.75} />
      <g clipPath={`url(#${clip})`}>
        <Relief href={`${uid}-rules`} width={0.9} depth={0.8} />
        <Relief href={`${uid}-ornament`} width={2} depth={1.2} />
      </g>
    </>
  )
}

/**
 * The large blind-stamped panel at the foot of the invitation.
 *
 * Its foot is straight because the panel runs off the bottom of the page in the
 * reference; only the crown and its shoulders are scalloped.
 */
export function EmbossedCard({ children, className }: PaperProps) {
  const uid = useId().replace(/:/g, '')
  return (
    <Sheet
      className={className}
      ratio={`${CARD_W} / ${CARD_H}`}
      inset="27% 20% 14%"
      viewBox={`0 0 ${CARD_W} ${CARD_H}`}
      art={<CardArt uid={uid} />}
    >
      {children}
    </Sheet>
  )
}

/* ---------------------------------------------------------------------------
   Scalloped message frame — line art, not paper.
   --------------------------------------------------------------------------- */

const BOX_W = 600
const BOX_H = 200
/** Bobble spacing, chosen so the chain closes evenly on all four sides. */
const BOBBLE = 22
/**
 * 205° puts each bobble's widest point above its neck, so the legs pinch in
 * where they meet and the loops just touch instead of overlapping. Measured off
 * the reference, a bobble stands about 0.62 of its own spacing tall; past 240°
 * neighbouring loops eat into each other and the chain reads as a spring.
 */
const BOX_EDGE = bobbledRect(20, 20, BOX_W - 40, BOX_H - 40, BOBBLE, 205)
const BOX_INNER = 26

function BoxArt() {
  return (
    <>
      <path d={BOX_EDGE} fill={PAPER} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      {/* The inner rule sits just inside the waists of the bobbles, so the two
          lines read as one frame rather than as a box inside a doily. */}
      <rect
        x={BOX_INNER}
        y={BOX_INNER}
        width={BOX_W - BOX_INNER * 2}
        height={BOX_H - BOX_INNER * 2}
        fill="none"
        stroke={INK}
        strokeWidth={2.6}
      />
    </>
  )
}

/**
 * The "Message for you" frame: a bobbled outline in ink with a plain rule set
 * just inside it. The only object here drawn as line art on white rather than
 * as paper, which is how the reference draws it too.
 */
export function ScallopedBox({ children, className }: PaperProps) {
  return (
    <Sheet
      className={className}
      ratio={`${BOX_W} / ${BOX_H}`}
      inset="11% 8%"
      viewBox={`0 0 ${BOX_W} ${BOX_H}`}
      art={<BoxArt />}
    >
      {children}
    </Sheet>
  )
}

/* ---------------------------------------------------------------------------
   Portrait invitation card.
   --------------------------------------------------------------------------- */

const INV_W = 300
const INV_H = 500
const INV_OUTER = 14
const INV_INNER = 29

/**
 * A rectangle whose corners are cut back into the frame.
 *
 * The reference's outer rule turns each corner with a concave quarter-circle,
 * the standard way a plate frame is engraved; a plain rounded corner reads as a
 * web card instead.
 */
function notchedRect(x: number, y: number, w: number, h: number, c: number): string {
  return (
    `M ${round(x + c)} ${round(y)} L ${round(x + w - c)} ${round(y)}` +
    ` A ${c} ${c} 0 0 0 ${round(x + w)} ${round(y + c)}` +
    ` L ${round(x + w)} ${round(y + h - c)} A ${c} ${c} 0 0 0 ${round(x + w - c)} ${round(y + h)}` +
    ` L ${round(x + c)} ${round(y + h)} A ${c} ${c} 0 0 0 ${round(x)} ${round(y + h - c)}` +
    ` L ${round(x)} ${round(y + c)} A ${c} ${c} 0 0 0 ${round(x + c)} ${round(y)} Z`
  )
}

/**
 * The filigree that turns the top-left corner; the other three are this one
 * mirrored.
 *
 * It straddles the pair of rules and runs a short way along both edges, which
 * is where the reference puts its weight. Carry the ornament along the full
 * edge instead and the card reads as a garland-bordered certificate.
 */
function cornerFiligree(): string[] {
  const x = INV_INNER
  const y = INV_INNER
  const out: string[] = []
  // A bracket inside the corner, ending in a curl at each edge: the ornament
  // has to meet the rules or it floats.
  out.push(`M ${x + 3} ${y + 44} C ${x + 3} ${y + 24} ${x + 16} ${y + 9} ${x + 38} ${y + 3}`)
  out.push(curl(x + 3.5, y + 48, 4.4, -90, 1.2, -1))
  out.push(curl(x + 48, y + 3.5, 4.4, 180, 1.2, 1))
  // A rolled rosette on the diagonal with acanthus breaking outward from it.
  out.push(curl(x + 18, y + 18, 9, 135, 2.1, 1))
  // A second, smaller roll tucked into the angle: the reference corner is dense
  // near the point and thins as it runs out along the edges.
  out.push(curl(x + 7, y + 7, 4.5, 135, 1.6, 1))
  out.push(leaf(x + 19, y + 19, 24, 5, -26))
  out.push(leaf(x + 19, y + 19, 24, 5, 64))
  out.push(leaf(x + 20, y + 11, 15, 3.2, -4))
  out.push(leaf(x + 11, y + 20, 15, 3.2, 86))
  // One short tendril hooks over the outer rule, the join that makes the frame
  // and the ornament one plate rather than two.
  out.push(`M ${x + 13} ${y + 6} C ${x + 6} ${y + 2} ${x - 2} ${y - 4} ${x - 7} ${y - 9}`)
  out.push(curl(x - 9, y - 11, 3.2, 40, 1.1, -1))
  return out
}

const INV_FILIGREE = cornerFiligree()
const INV_MIRRORS: readonly string[] = [
  'translate(0 0)',
  `translate(${INV_W} 0) scale(-1 1)`,
  `translate(0 ${INV_H}) scale(1 -1)`,
  `translate(${INV_W} ${INV_H}) scale(-1 -1)`,
]

function InvitationArt({ uid }: { uid: string }) {
  const clip = `${uid}-clip`
  return (
    <>
      <defs>
        <rect id={`${uid}-edge`} x={3} y={3} width={INV_W - 6} height={INV_H - 6} />
        <clipPath id={clip}>
          <use href={`#${uid}-edge`} />
        </clipPath>
        <g id={`${uid}-corner`}>
          {INV_FILIGREE.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g id={`${uid}-rules`}>
          <path d={notchedRect(INV_OUTER, INV_OUTER, INV_W - INV_OUTER * 2, INV_H - INV_OUTER * 2, 9)} />
          <rect
            x={INV_INNER}
            y={INV_INNER}
            width={INV_W - INV_INNER * 2}
            height={INV_H - INV_INNER * 2}
            rx={2}
          />
        </g>
        <g id={`${uid}-corners`}>
          {INV_MIRRORS.map((t) => (
            <use key={t} href={`#${uid}-corner`} transform={t} />
          ))}
        </g>
      </defs>
      <use href={`#${uid}-edge`} fill={CREAM} />
      <Fibre clip={clip} count={300} width={INV_W} height={INV_H} />
      <PaperEdge href={`${uid}-edge`} clip={clip} />
      <use href={`#${uid}-edge`} fill="none" stroke={SHADE} strokeWidth={0.6} opacity={0.6} />
      <g clipPath={`url(#${clip})`}>
        <Relief href={`${uid}-rules`} width={0.9} depth={0.85} />
        <Relief href={`${uid}-corners`} width={1.4} depth={0.95} />
      </g>
    </>
  )
}

/**
 * The portrait invitation card: an embossed double rule with filigree at every
 * corner, struck shallow so the names printed over it stay the loudest thing
 * on it.
 */
export function InvitationCard({ children, className }: PaperProps) {
  const uid = useId().replace(/:/g, '')
  return (
    <Sheet
      className={className}
      ratio={`${INV_W} / ${INV_H}`}
      inset="16% 13%"
      viewBox={`0 0 ${INV_W} ${INV_H}`}
      art={<InvitationArt uid={uid} />}
    >
      {children}
    </Sheet>
  )
}

/* ---------------------------------------------------------------------------
   Heart divider.
   --------------------------------------------------------------------------- */

const SWASH_W = 240
const SWASH_H = 44
/**
 * The right-hand swash: it leaves the heart almost level, sags through a long
 * shallow wave, rises into a small loop near the end and flicks out past it.
 * The loop is the signature of the reference's divider — without it the shape
 * is just a pair of ticks.
 */
const SWASH =
  'M 143 22.2 C 151 25.4 162 26 176 23.4' +
  ' C 190 20.8 199 18 206.5 14.4' +
  ' C 211 12.2 211.4 7 216.4 6.2 C 220.6 5.6 222.6 10 219.4 12.6' +
  ' C 216.6 14.8 211.6 13.6 209.6 11.4' +
  ' C 213.4 14.6 222.6 12.8 230.4 9.6 C 234 8.2 236.8 7.4 239.4 7'
/** The heavy middle of the same stroke: a brush is widest where it is slowest. */
const SWASH_BELLY = 'M 147 23.6 C 157 26.2 168 26 180 23.2 C 192 20.4 199 17.8 205 14.8'
const HEART =
  'M 120 37.5 C 112 29.5 99 21 99 13.5 C 99 6.8 105.5 3.4 111.5 6.4' +
  ' C 115 8.2 118.4 11.4 120 15.6 C 121.6 11.4 125 8.2 128.5 6.4' +
  ' C 134.5 3.4 141 6.8 141 13.5 C 141 21 128 29.5 120 37.5 Z'

/**
 * The pen divider: two mirrored swashes with a solid heart between them.
 */
function SwashArt() {
  return (
    <g fill="none" stroke={INK} strokeLinecap="round">
      {([1, -1] as const).map((dir) => (
        <g key={dir} transform={dir === 1 ? undefined : `translate(${SWASH_W} 0) scale(-1 1)`}>
          <path d={SWASH} strokeWidth={1.7} />
          <path d={SWASH_BELLY} strokeWidth={2.7} />
        </g>
      ))}
      <path d={HEART} fill={INK} stroke="none" />
    </g>
  )
}

/**
 * The small symmetrical swash-and-heart divider. Any children are set beneath
 * it, centred, so the divider can carry a caption where a page wants one.
 */
export function HeartFlourish({ children, className }: PaperProps) {
  return (
    // No width here: the flourish is sized by the page that places it, and an
    // inline width would beat the class that does the sizing.
    <div className={className} style={{ display: 'block', textAlign: 'center' }}>
      <svg
        viewBox={`0 0 ${SWASH_W} ${SWASH_H}`}
        aria-hidden="true"
        focusable="false"
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        <SwashArt />
      </svg>
      {children}
    </div>
  )
}
