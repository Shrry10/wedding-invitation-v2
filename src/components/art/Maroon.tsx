import type { CSSProperties, ReactNode } from 'react'
import { ObjectPhoto } from './Objects'

/**
 * The maroon stationery: two envelopes and the instant photo.
 *
 * All three were drawn, in SVG, with a gradient, a woven grain and a crease
 * wherever the sheet was folded; all three are now the couple's own
 * photographs of the real stationery, cut out (`Objects.tsx`). The drawings
 * could carry the fold but never the cloth, and the cloth is what says the
 * envelope is an envelope rather than a picture of one.
 *
 * What stays here is the geometry: where the wax seal belongs on each
 * envelope, where a card sits inside one, and where a photograph sits in the
 * mount. Those are fractions of each file's own box, measured off the file, so
 * a page can place something on an object without knowing the pixels.
 */

const LAYER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  display: 'block',
}

/* --------------------------------------------------------------------------
   Sealed envelope — page 0
   -------------------------------------------------------------------------- */

const SEALED_VIEW = { w: 950, h: 681 } as const
/**
 * The flap point sits at seven tenths of the height, not at the middle — in
 * the photograph as in the drawing before it. It is the single strongest cue
 * that the envelope is a real one: a flap that stops at the middle reads as an
 * icon of an envelope.
 */
const SEALED_FLAP_POINT: readonly [number, number] = [0.5, 0.696]

/**
 * Where the wax seal belongs on `<SealedEnvelope />`.
 *
 * The seal is a separate object pressed over the flap point, overlapping it
 * rather than balancing on it, and its centre sits a little above the point.
 * `left`, `top` and `diameter` are fractions of the rendered box, so a page can
 * place an absolutely positioned seal without knowing the file.
 */
export const SEALED_ENVELOPE_SEAL = {
  viewBox: { width: SEALED_VIEW.w, height: SEALED_VIEW.h },
  left: SEALED_FLAP_POINT[0],
  top: SEALED_FLAP_POINT[1] - 0.026,
  diameter: 0.193,
} as const

export function SealedEnvelope({ className }: { className?: string | undefined }) {
  return (
    <ObjectPhoto photo="envelope-sealed" eager className={className} />
  )
}

/* --------------------------------------------------------------------------
   Open envelope — pages 1 and 2
   -------------------------------------------------------------------------- */

const OPEN_VIEW = { w: 900, h: 1001 } as const
/**
 * Three heights, as fractions of the file, measured off it: the fold the flap
 * turns on (which is also where the pocket's shoulders are), the bottom of the
 * pocket's V, and the flap's apex. Everything laid in this envelope is placed
 * against these.
 */
export const OPEN_ENVELOPE = {
  fold: 0.392,
  notch: 0.651,
  apex: 0.003,
} as const

/** Where the wax seal belongs on `<OpenEnvelope />` — pressed over the notch. */
export const OPEN_ENVELOPE_SEAL = {
  viewBox: { width: OPEN_VIEW.w, height: OPEN_VIEW.h },
  left: 0.5,
  top: OPEN_ENVELOPE.notch + 0.012,
  diameter: 0.204,
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

/**
 * An open envelope with something in it.
 *
 * The two halves are one photograph published as two, already in register, so
 * they are laid at the same size on the same box with the children between
 * them: back panel and thrown-back flap, then whatever is being held, then the
 * front pocket over it. That sandwich is the whole component — it is what puts
 * a bouquet's stems *inside* the envelope rather than in front of it.
 */
export function OpenEnvelope({
  className,
  children,
}: {
  className?: string | undefined
  children?: ReactNode | undefined
}) {
  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'block',
        aspectRatio: `${OPEN_VIEW.w} / ${OPEN_VIEW.h}`,
      }}
    >
      <ObjectPhoto photo="envelope-open-back" eager style={LAYER} />
      <span style={OPEN_ENVELOPE_CONTENT}>{children}</span>
      <ObjectPhoto photo="envelope-open-front" eager style={LAYER} />
    </span>
  )
}

/* --------------------------------------------------------------------------
   Instant photo — pages 1 and 3
   -------------------------------------------------------------------------- */

const MOUNT_VIEW = { w: 592, h: 696 } as const
/**
 * The aperture cut in the mount, as fractions of the file. Narrow margins on
 * three sides and a deep band below — the instant-film proportion — and the
 * opening itself is square, so every photograph on the site is cropped to a
 * square whatever shape it arrived in.
 */
const WELL = { left: 6.8, top: 6.3, width: 86.4, height: 73.8 } as const
/** In the band below the aperture, optically centred rather than measured. */
const CAPTION_BASELINE = 92

/**
 * Caption size from caption length.
 *
 * Which script face actually loads is not knowable here, and the wide-digit
 * fallbacks run a date clean off the card at a fixed size. Budgeting a
 * generous em per character costs a little size on short captions and keeps
 * every caption inside the border.
 */
function captionSize(caption: string): number {
  const budget = MOUNT_VIEW.w * 0.64
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
  const angle = tilt ?? 0

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'block',
        aspectRatio: `${MOUNT_VIEW.w} / ${MOUNT_VIEW.h}`,
        transform: angle === 0 ? undefined : `rotate(${angle}deg)`,
      }}
    >
      {/* The photograph goes in first, under the mount rather than inside a
          hole in it: the mount's own edge then falls over the print, as a
          window mount does, and no hairline of table shows between the two
          where they antialias on a tilted print. */}
      <span
        style={{
          position: 'absolute',
          display: 'block',
          left: `${WELL.left}%`,
          top: `${WELL.top}%`,
          width: `${WELL.width}%`,
          height: `${WELL.height}%`,
          overflow: 'hidden',
          background: 'var(--color-maroon-deep)',
        }}
      >
        {children}
      </span>

      <ObjectPhoto photo="photo-mount" style={LAYER} className="photo-mount" />

      {caption === undefined ? null : (
        <svg
          style={LAYER}
          viewBox={`0 0 ${MOUNT_VIEW.w} ${MOUNT_VIEW.h}`}
          aria-hidden="true"
          focusable="false"
        >
          <text
            x={MOUNT_VIEW.w / 2}
            y={(MOUNT_VIEW.h * CAPTION_BASELINE) / 100}
            textAnchor="middle"
            fill="var(--color-paper)"
            fillOpacity={0.94}
            fontSize={captionSize(caption)}
            fontStyle="italic"
            fontFamily="'Pinyon Script', 'Snell Roundhand', 'Apple Chancery', cursive"
          >
            {caption}
          </text>
        </svg>
      )}
    </span>
  )
}
