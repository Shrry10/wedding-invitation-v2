import { useId, type ReactNode } from 'react'

/**
 * The engraved and embossed ornament the reference's stationery carries: the
 * lobed cartouche its "click here" labels are struck on, the acanthus scroll in
 * each corner of the invitation card, and the pair of doves beneath the label.
 *
 * Relief is drawn, never faked with a shadow filter. Each stroke is laid three
 * times — a dark copy pushed down and right, a light copy up and left, and the
 * mid tone between them — which is what the eye reads as paper pressed by a
 * die lit from the upper left.
 */

const CREAM = 'var(--color-cream)'
const SHADE = 'color-mix(in srgb, var(--color-cream-shade) 78%, var(--color-ink-soft))'
const LIGHT = 'color-mix(in srgb, var(--color-paper) 88%, var(--color-cream))'

interface ReliefProps {
  d: string
  width?: number
  /** How deep the die was struck. Larger separates the two copies further. */
  depth?: number
}

/** One blind-embossed line. */
function Relief({ d, width = 2, depth = 1.1 }: ReliefProps) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={SHADE} strokeWidth={width} transform={`translate(${depth} ${depth})`} />
      <path d={d} stroke={LIGHT} strokeWidth={width} transform={`translate(${-depth} ${-depth})`} />
      <path d={d} stroke={CREAM} strokeWidth={width * 0.8} />
    </g>
  )
}

/**
 * A closed curve through the given points, smoothed.
 *
 * Catmull-Rom converted to cubic Béziers: sampling a lobed radius and joining
 * the samples with straight lines leaves visible facets, and the plaque has to
 * read as a soft pressed edge.
 */
function smoothClosed(points: Array<readonly [number, number]>): string {
  const n = points.length
  if (n < 3) return ''
  const at = (i: number) => points[((i % n) + n) % n] as readonly [number, number]
  const r = (v: number) => Math.round(v * 100) / 100
  let d = `M ${r(at(0)[0])} ${r(at(0)[1])}`
  for (let i = 0; i < n; i += 1) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${r(c1x)} ${r(c1y)}, ${r(c2x)} ${r(c2y)}, ${r(p2[0])} ${r(p2[1])}`
  }
  return `${d} Z`
}

/** The plaque outline: a circle modulated into soft lobes with cusps between. */
function lobedPlaque(cx: number, cy: number, radius: number, lobes: number, amp: number): string {
  const steps = lobes * 18
  const points = Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2
    const rr = radius * (1 + amp * Math.cos(lobes * t))
    return [cx + rr * Math.cos(t), cy + rr * Math.sin(t)] as const
  })
  return smoothClosed(points)
}

/** Two doves facing one another over a heart, with a sprig behind each. */
export function DoveEmblem({ className }: { className?: string | undefined }) {
  const bird = (flip: boolean) => (
    <g transform={flip ? 'translate(100 0) scale(-1 1)' : undefined}>
      <Relief
        d="M 44 40 C 34 40 26 34 26 26 C 26 19 32 14 40 14 C 46 14 50 17 50 22 C 50 26 47 28 44 28"
        width={3}
        depth={1.5}
      />
      {/* The raised wing. */}
      <Relief d="M 40 24 C 32 14 20 10 10 14 C 18 18 24 24 28 32" width={2.8} depth={1.4} />
      {/* Tail. */}
      <Relief d="M 26 28 C 18 32 12 38 8 46 C 16 44 22 42 28 38" width={2.8} depth={1.4} />
    </g>
  )
  return (
    <svg className={className} viewBox="0 0 100 56" aria-hidden="true" focusable="false">
      {bird(false)}
      {bird(true)}
      {/* The heart they meet over. */}
      <Relief d="M 50 16 C 46 10 40 11 40 16 C 40 21 46 25 50 29 C 54 25 60 21 60 16 C 60 11 54 10 50 16" width={2.4} depth={1.2} />
      {/* Laurel either side. */}
      <Relief d="M 12 48 C 22 50 32 50 40 47" width={2} depth={1} />
      <Relief d="M 88 48 C 78 50 68 50 60 47" width={2} depth={1} />
    </svg>
  )
}

/**
 * The lobed plaque the two "click here" labels are struck on.
 *
 * Square rather than a wide oval: on the reference this is a pressed medallion
 * roughly as tall as it is wide, and the scrollwork inside it is a cartouche,
 * not a plain rule.
 */
export function Cartouche({ children, className }: { children: ReactNode; className?: string | undefined }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const edge = lobedPlaque(200, 200, 176, 8, 0.055)
  const inner = lobedPlaque(200, 200, 150, 8, 0.05)

  // A cartouche frame: a C-scroll swept into each corner, mirrored four ways.
  const scroll =
    'M 96 150 C 78 150 66 138 66 122 C 66 108 78 98 92 100 C 82 104 78 112 80 120 ' +
    'C 82 130 92 136 104 134 M 66 122 C 58 104 66 84 86 76 C 104 68 124 74 132 88 ' +
    'C 120 80 106 80 96 88 C 86 96 82 110 86 120'

  return (
    <div className={className} style={{ position: 'relative' }}>
      <svg viewBox="0 0 400 400" aria-hidden="true" focusable="false" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <defs>
          <radialGradient id={`${uid}-pearl`} cx="38%" cy="30%" r="76%">
            <stop offset="0%" stopColor="var(--color-paper)" />
            <stop offset="58%" stopColor={CREAM} />
            <stop offset="100%" stopColor="var(--color-cream-deep)" />
          </radialGradient>
        </defs>
        <path d={edge} fill={`url(#${uid}-pearl)`} />
        <Relief d={edge} width={2.4} depth={1.3} />
        <Relief d={inner} width={1.3} depth={0.8} />
        {[0, 1, 2, 3].map((q) => (
          <g
            key={q}
            transform={
              q === 0
                ? undefined
                : q === 1
                  ? 'translate(400 0) scale(-1 1)'
                  : q === 2
                    ? 'translate(400 400) scale(-1 -1)'
                    : 'translate(0 400) scale(1 -1)'
            }
          >
            <Relief d={scroll} width={2} depth={1} />
          </g>
        ))}
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: '26% 18% 22%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** One embossed acanthus corner, for the invitation card. */
function CornerScroll() {
  const d =
    'M 8 62 C 8 40 20 24 42 18 C 34 26 30 36 32 46 C 34 56 42 62 52 60 ' +
    'C 44 58 40 52 41 45 C 42 37 50 32 58 34 C 50 30 40 32 34 40 ' +
    'M 42 18 C 58 12 76 14 88 22 C 76 20 64 22 56 28 ' +
    'M 20 70 C 24 58 34 50 46 48 C 38 54 34 62 36 70'
  return <Relief d={d} width={2.6} depth={1.4} />
}

/**
 * The invitation card: heavy cream stock, a fine stepped double rule, and an
 * acanthus scroll pressed into each corner.
 */
export function InviteCard({ children, className }: { children: ReactNode; className?: string | undefined }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const W = 400
  const H = 560
  const m = 26
  const step = 34
  // The rule cuts the corner off rather than turning square, as on the card.
  const rule = (o: number) =>
    `M ${m + o + step} ${m + o} L ${W - m - o - step} ${m + o} L ${W - m - o} ${m + o + step} ` +
    `L ${W - m - o} ${H - m - o - step} L ${W - m - o - step} ${H - m - o} ` +
    `L ${m + o + step} ${H - m - o} L ${m + o} ${H - m - o - step} L ${m + o} ${m + o + step} Z`

  return (
    <div className={className} style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id={`${uid}-stock`} x1="12%" y1="0%" x2="76%" y2="100%">
            <stop offset="0%" stopColor="var(--color-paper)" />
            <stop offset="52%" stopColor={CREAM} />
            <stop offset="100%" stopColor="var(--color-cream-deep)" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}-stock)`} />
        <Relief d={rule(0)} width={1.9} depth={1} />
        <Relief d={rule(7)} width={1.1} depth={0.7} />
        {[0, 1, 2, 3].map((q) => (
          <g
            key={q}
            transform={
              q === 0
                ? `translate(${m + 4} ${m + 4})`
                : q === 1
                  ? `translate(${W - m - 4} ${m + 4}) scale(-1 1)`
                  : q === 2
                    ? `translate(${W - m - 4} ${H - m - 4}) scale(-1 -1)`
                    : `translate(${m + 4} ${H - m - 4}) scale(1 -1)`
            }
          >
            <CornerScroll />
          </g>
        ))}
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: '13% 11%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
