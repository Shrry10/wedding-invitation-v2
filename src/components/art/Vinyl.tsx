import { useId, type CSSProperties, type ReactNode } from 'react'
import { ObjectPhoto } from './Objects'

/**
 * The record and its sleeve.
 *
 * A separate material from the paper and the maroon stock: this is the one
 * black object on a page of cream and wine, and it earns that by being the one
 * object that is not stationery. The record slides out to the right so the
 * sleeve reads as a sleeve rather than as another card — that overlap is the
 * whole drawing, and it is why the record is laid down first and the sleeve on
 * top of it.
 *
 * The record is now the couple's photograph of a pressing rather than a drawn
 * disc, and it turns: 36 seconds a revolution, on the same `.turning` rule as
 * the salver under the details badge, so the two things on this canvas with
 * any business turning turn together. The photograph is cut to its own disc,
 * tangent to all four sides of its box, so it spins about `50% 50%` with no
 * measured centre to drift.
 *
 * The sleeve stays drawn, and it is what carries the words. Type revolving
 * with the record is unreadable, and the pressing's own label is far too small
 * to hold a title standing still; the sleeve's printed panel is the right size
 * and it does not move.
 */

const VIEW = { w: 340, h: 250 } as const
/** The sleeve: square, as a seven-inch sleeve is. */
const SLEEVE = { x: 6, y: 12, size: 226 } as const
const DISC = { cx: 248, cy: 125, r: 104 } as const
/** The lace edge, and the printed panel inside it. */
const LACE_INSET = 13
const PANEL_INSET = 27

const LAYER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  display: 'block',
  overflow: 'visible',
}

const pct = (n: number, of: number): string => `${((n / of) * 100).toFixed(2)}%`

/**
 * The scalloped band that stands for the lace border.
 *
 * Drawn as overlapping discs around the sleeve's edge rather than as a traced
 * damask: at the size this is rendered a damask is mud, and a doily's scallop
 * is the part of it the eye actually reads.
 */
function laceDiscs(): { cx: number; cy: number }[] {
  const out: { cx: number; cy: number }[] = []
  const a = SLEEVE.x + LACE_INSET
  const b = SLEEVE.x + SLEEVE.size - LACE_INSET
  const c = SLEEVE.y + LACE_INSET
  const d = SLEEVE.y + SLEEVE.size - LACE_INSET
  const steps = 11
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    out.push({ cx: a + (b - a) * t, cy: c })
    out.push({ cx: a + (b - a) * t, cy: d })
    if (i > 0 && i < steps) {
      out.push({ cx: a, cy: c + (d - c) * t })
      out.push({ cx: b, cy: c + (d - c) * t })
    }
  }
  return out
}

const LACE = laceDiscs()

export function PlaylistSleeve({
  className,
  children,
}: {
  className?: string | undefined
  children?: ReactNode | undefined
}) {
  const uid = `pl${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'block', aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
    >
      {/* The record, laid down first so the sleeve covers its left half. Its
          shadow is a still disc under a turning one: a drop shadow on the
          record itself would sweep round the page with it, and a shadow that
          moves is what makes a spinning object read as a sticker. */}
      <span
        className="record-slot"
        style={{
          position: 'absolute',
          left: pct(DISC.cx - DISC.r, VIEW.w),
          top: pct(DISC.cy - DISC.r, VIEW.h),
          width: pct(DISC.r * 2, VIEW.w),
        }}
      >
        <span className="record-shadow" aria-hidden="true" />
        <span className="turning">
          <ObjectPhoto photo="record" eager className="record" />
        </span>
      </span>

      <svg style={LAYER} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${uid}-sleeve`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="var(--color-cream)" />
            <stop offset="62%" stopColor="color-mix(in srgb, var(--color-cream) 88%, var(--color-cream-deep))" />
            <stop offset="100%" stopColor="var(--color-cream-deep)" />
          </linearGradient>
          <filter id={`${uid}-drop`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <g filter={`url(#${uid}-drop)`}>
          <rect
            x={SLEEVE.x + 3}
            y={SLEEVE.y + 8}
            width={SLEEVE.size}
            height={SLEEVE.size}
            fill="var(--color-ink)"
            fillOpacity={0.3}
          />
        </g>
        <rect
          x={SLEEVE.x}
          y={SLEEVE.y}
          width={SLEEVE.size}
          height={SLEEVE.size}
          fill={`url(#${uid}-sleeve)`}
        />
        {LACE.map((disc) => (
          <circle
            key={`${disc.cx}-${disc.cy}`}
            cx={disc.cx}
            cy={disc.cy}
            r={7.5}
            fill="var(--color-paper)"
            fillOpacity={0.62}
          />
        ))}
        <rect
          x={SLEEVE.x + PANEL_INSET}
          y={SLEEVE.y + PANEL_INSET}
          width={SLEEVE.size - PANEL_INSET * 2}
          height={SLEEVE.size - PANEL_INSET * 2}
          fill="var(--color-paper)"
        />
        <rect
          x={SLEEVE.x + PANEL_INSET}
          y={SLEEVE.y + PANEL_INSET}
          width={SLEEVE.size - PANEL_INSET * 2}
          height={SLEEVE.size - PANEL_INSET * 2}
          fill="none"
          stroke="var(--color-cream-shade)"
          strokeWidth={0.8}
        />
        {/* The mouth the record comes out of. */}
        <path
          d={`M ${SLEEVE.x + SLEEVE.size} ${SLEEVE.y + 6} L ${SLEEVE.x + SLEEVE.size} ${SLEEVE.y + SLEEVE.size - 6}`}
          stroke="var(--color-cream-shade)"
          strokeWidth={2}
          strokeOpacity={0.8}
        />
      </svg>

      {/* The printed panel, which the page sets its own type into. */}
      <span
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          left: pct(SLEEVE.x + PANEL_INSET, VIEW.w),
          top: pct(SLEEVE.y + PANEL_INSET, VIEW.h),
          width: pct(SLEEVE.size - PANEL_INSET * 2, VIEW.w),
          height: pct(SLEEVE.size - PANEL_INSET * 2, VIEW.h),
          textAlign: 'center',
        }}
      >
        {children}
      </span>
    </span>
  )
}
