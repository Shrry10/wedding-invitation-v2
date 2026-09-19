import type { ReactElement, ReactNode } from 'react'
import { jitter, scallopedEllipse } from './geometry'

/**
 * The little pen drawings the reference uses as section and timeline markers.
 *
 * All seventeen are authored on one 48-unit box at one stroke weight, because
 * the reference's charm is that a calendar, a chandelier and a cherub plainly
 * came from the same sketchbook. A motif drawn larger or heavier than its
 * neighbours breaks that before anyone reads what it depicts.
 *
 * The governing constraint is separation, not detail. A 1.5-unit nib on a
 * 48-unit box leaves about 1 unit of paper between strokes laid 2.5 units
 * apart; anything closer floods and the drawing turns into a silhouette. Every
 * motif here was thinned until nothing ran closer than that, which is why they
 * carry fewer folds and fewer petals than the photographs do.
 */
export type LineIconName =
  | 'calendar'
  | 'ceremony'
  | 'reception'
  | 'travel'
  | 'stay'
  | 'hearts'
  | 'champagne-tower'
  | 'chandelier'
  | 'dinner'
  | 'cake'
  | 'shoes'
  | 'cupid'
  | 'first-date'
  | 'suitcase'
  | 'ring-hand'
  | 'car'
  | 'honeymoon'

export interface LineIconProps {
  name: LineIconName
  size?: number | undefined
  className?: string | undefined
}

/* ---------------------------------------------------------------------------
   Pen primitives.

   The reference was drawn freehand: no edge is truly straight and no corner is
   truly square. These reintroduce that by construction, so the looseness is
   even across all seventeen rather than sprinkled on whichever got attention.
   --------------------------------------------------------------------------- */

/** Two decimals is finer than a 1.5-unit nib resolves; more is noise in the file. */
function n(v: number): number {
  return Math.round(v * 100) / 100
}

/** A signed wobble of at most `amp` units, stable for a given seed. */
function bow(seed: number, amp: number): number {
  return (jitter(seed) - 0.5) * 2 * amp
}

/**
 * Interior detail at a lighter nib than the contour.
 *
 * The photographs are drawn with a pressure-sensitive pen: the silhouette is
 * inked heavily and window bars, cloth folds and gem facets are barely there.
 * Holding every line at 1.5 units instead welds mullions to their frames, so
 * inner detail drops to a 1.05 nib — the same drawing, not a lighter one.
 */
function Fine({ children }: { children: ReactNode }): ReactElement {
  return <g strokeWidth={1.05}>{children}</g>
}

/** A drawn straight line: a quadratic that sags off true by a fraction of a unit. */
function pen(x1: number, y1: number, x2: number, y2: number, seed: number, amp = 0.3): string {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const b = bow(seed, amp)
  return `M ${n(x1)} ${n(y1)} Q ${n((x1 + x2) / 2 - (dy / len) * b)} ${n((y1 + y2) / 2 + (dx / len) * b)} ${n(x2)} ${n(y2)}`
}

/** A drawn rectangle: rounded corners, each side bowed independently. */
function penRect(x: number, y: number, w: number, h: number, r: number, seed: number): string {
  const b = (s: number) => bow(seed + s, 0.32)
  return [
    `M ${n(x + r)} ${n(y)}`,
    `Q ${n(x + w / 2)} ${n(y + b(1))} ${n(x + w - r)} ${n(y)}`,
    `Q ${n(x + w)} ${n(y)} ${n(x + w)} ${n(y + r)}`,
    `Q ${n(x + w + b(2))} ${n(y + h / 2)} ${n(x + w)} ${n(y + h - r)}`,
    `Q ${n(x + w)} ${n(y + h)} ${n(x + w - r)} ${n(y + h)}`,
    `Q ${n(x + w / 2)} ${n(y + h + b(3))} ${n(x + r)} ${n(y + h)}`,
    `Q ${n(x)} ${n(y + h)} ${n(x)} ${n(y + h - r)}`,
    `Q ${n(x + b(4))} ${n(y + h / 2)} ${n(x)} ${n(y + r)}`,
    `Q ${n(x)} ${n(y)} ${n(x + r)} ${n(y)}`,
    'Z',
  ].join(' ')
}

/** A heart filling the box (cx ± w/2, topY .. topY + h). */
function heart(cx: number, topY: number, w: number, h: number): string {
  const hw = w / 2
  const cleft = topY + h * 0.2
  return [
    `M ${n(cx)} ${n(cleft)}`,
    `C ${n(cx - hw * 0.22)} ${n(topY - h * 0.08)} ${n(cx - hw)} ${n(topY + h * 0.02)} ${n(cx - hw)} ${n(topY + h * 0.33)}`,
    `C ${n(cx - hw)} ${n(topY + h * 0.58)} ${n(cx - hw * 0.46)} ${n(topY + h * 0.78)} ${n(cx)} ${n(topY + h)}`,
    `C ${n(cx + hw * 0.46)} ${n(topY + h * 0.78)} ${n(cx + hw)} ${n(topY + h * 0.58)} ${n(cx + hw)} ${n(topY + h * 0.33)}`,
    `C ${n(cx + hw)} ${n(topY + h * 0.02)} ${n(cx + hw * 0.22)} ${n(topY - h * 0.08)} ${n(cx)} ${n(cleft)}`,
    'Z',
  ].join(' ')
}

/** A candle flame: a teardrop leaning very slightly off vertical. */
function flame(cx: number, baseY: number, h: number): string {
  const w = h * 0.38
  return [
    `M ${n(cx)} ${n(baseY)}`,
    `C ${n(cx - w)} ${n(baseY - h * 0.32)} ${n(cx - w * 0.8)} ${n(baseY - h * 0.7)} ${n(cx + 0.15)} ${n(baseY - h)}`,
    `C ${n(cx + w * 0.8)} ${n(baseY - h * 0.7)} ${n(cx + w)} ${n(baseY - h * 0.32)} ${n(cx)} ${n(baseY)}`,
    'Z',
  ].join(' ')
}

/**
 * A bloom seen face-on.
 *
 * The reference draws its roses as tight open spirals, which at this nib fills
 * solid. A five-lobed scallop keeps the paper inside the flower and still reads
 * as the same garden rose at the size these are actually looked at.
 */
function bloom(cx: number, cy: number, r: number): string {
  return scallopedEllipse(cx, cy, r, r * 0.94, 5)
}

/** A pointed leaf growing from (x, y) along `angle`. */
function leaf(x: number, y: number, len: number, angleDeg: number, fat = 0.3): string {
  const a = (angleDeg * Math.PI) / 180
  const tx = x + len * Math.cos(a)
  const ty = y + len * Math.sin(a)
  const nx = -Math.sin(a) * len * fat
  const ny = Math.cos(a) * len * fat
  const mx = (x + tx) / 2
  const my = (y + ty) / 2
  return `M ${n(x)} ${n(y)} Q ${n(mx + nx)} ${n(my + ny)} ${n(tx)} ${n(ty)} Q ${n(mx - nx)} ${n(my - ny)} ${n(x)} ${n(y)} Z`
}

/**
 * A palm frond: a blade that sags under its own length.
 *
 * A straight leaf radiating from the crown gives a rosette, which is a fern.
 * The sag is the whole difference between a palm and a houseplant.
 */
function frond(x: number, y: number, len: number, angleDeg: number, droop: number): string {
  const a = (angleDeg * Math.PI) / 180
  const tx = x + len * Math.cos(a)
  const ty = y + len * Math.sin(a) + droop
  const mx = (x + tx) / 2
  const my = (y + ty) / 2 - droop * 0.5
  const nx = -(ty - y) * 0.24
  const ny = (tx - x) * 0.24
  return `M ${n(x)} ${n(y)} Q ${n(mx + nx)} ${n(my + ny)} ${n(tx)} ${n(ty)} Q ${n(mx - nx)} ${n(my - ny)} ${n(x)} ${n(y)} Z`
}

/**
 * A feathered wing: one swept leading edge, then a chain of arcs back to the
 * root. The scallops are the feather tips, which is the whole reason the
 * cherub reads as a cherub and not as a paper aeroplane.
 */
function wing(
  x: number,
  y: number,
  len: number,
  angleDeg: number,
  feathers: number,
  width: number,
): string {
  const a = (angleDeg * Math.PI) / 180
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  const nx = -uy
  const ny = ux
  let d = `M ${n(x)} ${n(y)} Q ${n(x + len * 0.45 * ux + nx * width * 1.4)} ${n(y + len * 0.45 * uy + ny * width * 1.4)} ${n(x + len * ux)} ${n(y + len * uy)}`
  for (let i = 1; i <= feathers; i += 1) {
    const t = 1 - i / feathers
    const spread = width * (0.14 + 0.95 * t)
    const px = x + len * t * ux - nx * spread
    const py = y + len * t * uy - ny * spread
    const rad = (len / feathers) * 0.78
    d += ` A ${n(rad)} ${n(rad)} 0 0 1 ${n(px)} ${n(py)}`
  }
  return d
}

/**
 * Small lettering, at the size where letters stop being letters.
 *
 * The reference prints JUL 2028 and HOTEL at a size that survives only because
 * the artwork is a photograph. Drawn as glyphs they would flood; drawn as
 * uprights they read as a picket fence. A ruled word-length dash is what the
 * eye actually resolves at 48px, so that is what is drawn.
 */
function words(x: number, y: number, w: number, seed: number): string {
  const split = x + w * 0.52
  return `${pen(x, y, split - 1.2, y, seed, 0.12)} ${pen(split + 1.2, y, x + w, y, seed + 5, 0.12)}`
}

/** A hanging swag dropping `drop` units below the lower of its two anchors. */
function swag(x1: number, y1: number, x2: number, y2: number, drop: number): string {
  const base = Math.max(y1, y2)
  return `M ${n(x1)} ${n(y1)} C ${n(x1 + (x2 - x1) * 0.2)} ${n(base + drop)} ${n(x1 + (x2 - x1) * 0.8)} ${n(base + drop)} ${n(x2)} ${n(y2)}`
}

/**
 * A champagne coupe.
 *
 * The bowl is taken to a full radius below the rim rather than the half a
 * saucer would use: at a shallower depth the rim ellipse's own lower edge and
 * the bowl's curve converge, and six of them stacked read as a cake stand.
 */
function coupe(cx: number, rimY: number, r: number, stemH: number): ReactElement {
  const depth = r
  const ctrl = rimY + depth * (4 / 3)
  const footY = rimY + depth + stemH
  return (
    <>
      <path
        d={`M ${n(cx - r)} ${n(rimY)} C ${n(cx - r * 0.96)} ${n(ctrl)} ${n(cx + r * 0.96)} ${n(ctrl)} ${n(cx + r)} ${n(rimY)}`}
      />
      <ellipse cx={n(cx)} cy={n(rimY)} rx={n(r)} ry={n(r * 0.3)} />
      <path d={`M ${n(cx)} ${n(rimY + depth)} L ${n(cx)} ${n(footY)}`} />
      <ellipse cx={n(cx)} cy={n(footY)} rx={n(r * 0.5)} ry={n(r * 0.16)} />
    </>
  )
}

/** A narrow flute, for the tables that only have room for one. */
function flute(cx: number, rimY: number, w: number, bowlH: number, stem: number): ReactElement {
  return (
    <>
      <path
        d={`M ${n(cx - w / 2)} ${n(rimY)} L ${n(cx)} ${n(rimY + bowlH)} L ${n(cx + w / 2)} ${n(rimY)} M ${n(cx - w / 2)} ${n(rimY)} L ${n(cx + w / 2)} ${n(rimY)} M ${n(cx)} ${n(rimY + bowlH)} L ${n(cx)} ${n(rimY + bowlH + stem)}`}
      />
      <ellipse cx={n(cx)} cy={n(rimY + bowlH + stem)} rx={n(w * 0.55)} ry={0.45} />
    </>
  )
}

/**
 * A cake tier: the elliptical top and the walls dropping from it to `bottomY`.
 *
 * `bottomY` is an absolute coordinate, not a height — the tier below supplies
 * the closing edge, so a tier that guesses its own depth detaches from it.
 */
function tier(cx: number, topY: number, rx: number, ry: number, bottomY: number): ReactElement {
  return (
    <>
      <ellipse cx={n(cx)} cy={n(topY)} rx={n(rx)} ry={n(ry)} />
      <path d={`M ${n(cx - rx)} ${n(topY)} L ${n(cx - rx)} ${n(bottomY)}`} />
      <path d={`M ${n(cx + rx)} ${n(topY)} L ${n(cx + rx)} ${n(bottomY)}`} />
    </>
  )
}

/** A taper in a baluster holder — the dinner table and the first date share it. */
function candlestick(
  cx: number,
  footY: number,
  stemH: number,
  candleH: number,
  seed: number,
): ReactElement {
  const cupY = footY - stemH
  const wickY = cupY - candleH
  return (
    <>
      <ellipse cx={n(cx)} cy={n(footY)} rx={2.7} ry={0.95} />
      <path
        d={`M ${n(cx - 0.9)} ${n(footY - 0.8)} C ${n(cx - 1.7)} ${n(footY - stemH * 0.55)} ${n(cx - 0.7)} ${n(cupY + 1.1)} ${n(cx - 1.6)} ${n(cupY)}`}
      />
      <path
        d={`M ${n(cx + 0.9)} ${n(footY - 0.8)} C ${n(cx + 1.7)} ${n(footY - stemH * 0.55)} ${n(cx + 0.7)} ${n(cupY + 1.1)} ${n(cx + 1.6)} ${n(cupY)}`}
      />
      <path d={pen(cx - 1.6, cupY, cx + 1.6, cupY, seed, 0.15)} />
      <path
        d={`M ${n(cx - 1.15)} ${n(cupY)} L ${n(cx - 1.05)} ${n(wickY + 0.6)} Q ${n(cx)} ${n(wickY - 0.3)} ${n(cx + 1.05)} ${n(wickY + 0.6)} L ${n(cx + 1.15)} ${n(cupY)}`}
      />
      <path d={flame(cx, wickY - 0.9, candleH * 0.26)} />
    </>
  )
}

/* ---------------------------------------------------------------------------
   The motifs.
   --------------------------------------------------------------------------- */

const calendar: ReactElement = (
  <>
    {/* Binders stop at the leaf's top edge; the reference never draws them through it. */}
    <path d="M 15.2 11 L 15.2 5.7 A 1.7 1.7 0 0 1 18.6 5.7 L 18.6 11" />
    <path d="M 29.4 11 L 29.4 5.7 A 1.7 1.7 0 0 1 32.8 5.7 L 32.8 11" />
    <path d={penRect(7.6, 11, 32.8, 30.6, 2.6, 3)} />
    <path d={pen(8.2, 21.4, 39.8, 21.4, 11, 0.25)} />
    <path d={heart(24, 23.8, 19.4, 15)} />
    <Fine>
      <path d={words(14.4, 16.6, 19.2, 21)} />
      <path d={pen(22.3, 32.4, 25.7, 32.4, 26, 0.1)} />
    </Fine>
  </>
)

const ceremony: ReactElement = (
  <>
    {/* Drapes first: the blooms sit on the fabric, so they are drawn over it. */}
    <path d="M 10.8 18.4 C 9.6 25 9.8 32.4 9.2 39.8" />
    <path d="M 16.8 19.8 C 17.2 26.4 16.8 33.2 17.2 39.8" />
    <path d="M 9.2 39.8 Q 13.2 41.8 17.2 39.8" />
    <path d="M 37.2 18.4 C 38.4 25 38.2 32.4 38.8 39.8" />
    <path d="M 31.2 19.8 C 30.8 26.4 31.2 33.2 30.8 39.8" />
    <path d="M 38.8 39.8 Q 34.8 41.8 30.8 39.8" />
    <Fine>
      <path d="M 13.2 23.6 C 12.9 29.8 13.1 35.2 13 40.7" />
      <path d="M 10.4 21 C 12.5 22.9 14.9 22.9 17 21.5" />
      <path d="M 34.8 23.6 C 35.1 29.8 34.9 35.2 35 40.7" />
      <path d="M 37.6 21 C 35.5 22.9 33.1 22.9 31 21.5" />
    </Fine>
    {/* The arch: an outer sweep and the inner edge of the same drapery. */}
    <path d="M 10.8 18.6 C 10.6 9.4 16.4 4.8 24 4.8 C 31.6 4.8 37.4 9.4 37.2 18.6" />
    <path d="M 16.8 19.8 C 16.7 12.4 19.9 9.6 24 9.6 C 28.1 9.6 31.3 12.4 31.2 19.8" />
    {/* Blooms at the springing points and the crown. */}
    <path d={bloom(13.6, 11.2, 2.7)} />
    <path d={bloom(17.4, 7.8, 2.1)} />
    <path d={leaf(11.6, 14.2, 3.4, 121)} />
    <path d={bloom(24, 4.4, 2.4)} />
    <path d={bloom(20.4, 5.6, 1.9)} />
    <path d={bloom(27.6, 5.6, 1.9)} />
    <path d={bloom(34.4, 11.2, 2.7)} />
    <path d={bloom(30.6, 7.8, 2.1)} />
    <path d={leaf(36.4, 14.2, 3.4, 59)} />
    {/* Rings: the right one is knocked out first so it threads in front. */}
    <ellipse cx={20.6} cy={27.4} rx={3.8} ry={4.6} transform="rotate(-14 20.6 27.4)" />
    <g stroke="var(--color-paper)" strokeWidth={3.6}>
      <ellipse cx={27.4} cy={28.6} rx={3.8} ry={4.6} transform="rotate(12 27.4 28.6)" />
    </g>
    <ellipse cx={27.4} cy={28.6} rx={3.8} ry={4.6} transform="rotate(12 27.4 28.6)" />
  </>
)

const reception: ReactElement = (
  <>
    {/* The head table, skirted — what the reference actually pictures. */}
    <path d={pen(5.4, 25.4, 42.6, 25.4, 41, 0.25)} />
    <path d="M 5.6 25.6 C 5.2 31 5.6 36 6 39.4" />
    <path d="M 42.4 25.6 C 42.8 31 42.4 36 42 39.4" />
    <path d={swag(6.2, 25.8, 18, 25.8, 6.2)} />
    <path d={swag(18, 25.8, 30, 25.8, 6.8)} />
    <path d={swag(30, 25.8, 41.8, 25.8, 6.2)} />
    <Fine>
      <path d="M 12 32 C 11.8 34.9 11.9 37.3 11.8 39.7" />
      <path d="M 24 32.7 C 24 35.3 24 37.5 24 39.9" />
      <path d="M 36 32 C 36.2 34.9 36.1 37.3 36.2 39.7" />
    </Fine>
    <path d="M 6 39.4 Q 9.4 41.2 12.8 39.6 Q 16.4 41.2 19.8 39.7 Q 23.4 41.3 26.8 39.7 Q 30.4 41.2 33.8 39.6 Q 37.6 41.2 42 39.4" />
    {/* Garland at the swag anchors. */}
    <path d={bloom(18, 24.9, 2.1)} />
    <path d={leaf(15.8, 25.9, 2.8, 172)} />
    <path d={leaf(20.2, 25.9, 2.8, 8)} />
    <path d={bloom(30, 24.9, 2.1)} />
    <path d={leaf(27.8, 25.9, 2.8, 172)} />
    <path d={leaf(32.2, 25.9, 2.8, 8)} />
    {/* Cake and glasses standing on the cloth. */}
    {tier(24, 19.6, 4.4, 1.3, 25.2)}
    {tier(24, 15, 3, 0.95, 19.6)}
    <path d={heart(24, 9.8, 3.2, 3)} />
    {flute(10.4, 16.6, 3, 5.2, 3.4)}
    {flute(14.4, 16.6, 3, 5.2, 3.4)}
    {flute(33.6, 16.6, 3, 5.2, 3.4)}
    {flute(37.6, 16.6, 3, 5.2, 3.4)}
  </>
)

const travel: ReactElement = (
  <>
    {/* Accordion fold: the silhouette zigzags top and bottom together. */}
    <path d="M 6 26.4 L 18 23.2 L 30 27.4 L 42 24.2 L 42 38 L 30 41.2 L 18 37 L 6 40.2 Z" />
    <Fine>
      <path d="M 18 23.2 L 18 37" />
      <path d="M 30 27.4 L 30 41.2" />
      {/* Roads are cased — two lines a whisker apart is what makes paper read as a map. */}
      <path d="M 6 33.4 C 11 31.8 13.6 34.6 17.6 34 C 21.6 33.4 22.4 29.8 26.4 30.2 C 30.4 30.6 31.4 34.4 35.2 34 C 38.2 33.7 40.2 31.8 42 30" />
      <path d="M 6 36 C 11 34.4 13.4 37.2 17.4 36.6 C 21.4 36 22.2 32.4 26.6 32.8 C 31 33.2 31.8 37 35.4 36.6 C 38.4 36.3 40.4 34.4 42 32.6" />
      <path d="M 21.8 24.4 C 22.8 26.6 23 28.8 22.6 30.6" />
      <path d="M 36.6 26.6 C 36 28.4 35.8 30.4 36 32.2" />
    </Fine>
    {/* The pin is the subject: heart-bellied, tip resting on the sheet. */}
    <path d="M 9.9 13.6 A 6.4 6.4 0 1 1 20.1 13.6 C 19 17.4 16.6 20.6 15 25.8 C 13.4 20.6 11 17.4 9.9 13.6 Z" />
    <path d={heart(15, 7.2, 7.4, 6.2)} />
    {/* Crosshair, its arms breaking the ring exactly as the reference draws it. */}
    <circle cx={34} cy={13.4} r={4.4} />
    <Fine>
      <circle cx={34} cy={13.4} r={1.8} />
      <path d="M 34 6.8 L 34 10.4 M 34 16.4 L 34 20 M 27.4 13.4 L 31 13.4 M 37 13.4 L 40.6 13.4" />
    </Fine>
    <path d="M 38.6 35 A 1.5 1.5 0 1 0 35.6 35 C 35.6 36.2 36.6 36.9 37.1 38 C 37.6 36.9 38.6 36.2 38.6 35 Z" />
  </>
)

const stay: ReactElement = (
  <>
    <path d={pen(4.6, 41.4, 43.4, 41.4, 51, 0.2)} />
    {/* Wings behind, centre block over them, exactly as the facade steps forward. */}
    <path d="M 6.2 41.2 L 6.2 19.2 L 17 19.2" />
    <path d="M 41.8 41.2 L 41.8 19.2 L 31 19.2" />
    <path d="M 17 41.2 L 17 11 L 31 11 L 31 41.2" />
    <Fine>
      <path d={penRect(9, 22.4, 3, 4.6, 0.3, 52)} />
      <path d={penRect(9, 29.2, 3, 4.6, 0.3, 53)} />
      <path d={penRect(9, 36, 3, 4.2, 0.3, 54)} />
      <path d={penRect(36, 22.4, 3, 4.6, 0.3, 55)} />
      <path d={penRect(36, 29.2, 3, 4.6, 0.3, 56)} />
      <path d={penRect(36, 36, 3, 4.2, 0.3, 57)} />
    </Fine>
    {/* Parapet: three hearts over a valance dipping to a point. */}
    <path d={pen(17.1, 16.6, 30.9, 16.6, 58, 0.18)} />
    <path d={heart(20.6, 12.6, 2.6, 2.4)} />
    <path d={heart(24, 12, 3.4, 3.2)} />
    <path d={heart(27.4, 12.6, 2.6, 2.4)} />
    <path d="M 17.1 16.8 C 19.6 19 21.6 20.2 24 20.8 C 26.4 20.2 28.4 19 30.9 16.8" />
    <Fine>
      <path d={penRect(18.5, 23.6, 2.3, 4.6, 0.3, 59)} />
      <path d={penRect(22.9, 23.6, 2.3, 4.6, 0.3, 60)} />
      <path d={penRect(27.3, 23.6, 2.3, 4.6, 0.3, 61)} />
    </Fine>
    {/* Signboard, portico and the door under it. */}
    <path d={penRect(18.2, 30.2, 11.6, 4.2, 0.4, 62)} />
    <Fine>
      <path d={words(20, 32.3, 8, 64)} />
      <path d="M 19.8 34.6 L 19.8 41.1 M 28.2 34.6 L 28.2 41.1" />
    </Fine>
    <path d="M 21.6 41.1 L 21.6 35.6 L 26.4 35.6 L 26.4 41.1" />
    <Fine>
      <path d="M 24 35.8 L 24 41.1" />
    </Fine>
  </>
)

const hearts: ReactElement = (
  <>
    {/* Each heart is a ribbon: an outer edge and an inner one, as in the photograph. */}
    <path d={heart(17.6, 15.4, 22.6, 20.6)} />
    <path d={heart(17.6, 18.8, 15.4, 13.8)} />
    {/* Knocked out, then inked: the right heart threads in front here. */}
    <g stroke="var(--color-paper)" strokeWidth={3.6}>
      <path d={heart(31.4, 18.6, 20.6, 19.2)} />
      <path d={heart(31.4, 22, 13.8, 12.6)} />
    </g>
    <path d={heart(31.4, 18.6, 20.6, 19.2)} />
    <path d={heart(31.4, 22, 13.8, 12.6)} />
    {/* And back out again lower down, which is what makes it a link, not a pile. */}
    <g stroke="var(--color-paper)" strokeWidth={3.6}>
      <path d="M 18.6 32.8 Q 21.6 30.4 24.6 27.6" />
      <path d="M 18.3 29.9 Q 20.4 28.4 22.6 26.5" />
    </g>
    <path d="M 18.6 32.8 Q 21.6 30.4 24.6 27.6" />
    <path d="M 18.3 29.9 Q 20.4 28.4 22.6 26.5" />
    {/* The solitaire perched on the right shoulder. */}
    <path d="M 35.6 12.6 L 37.1 9.6 L 40.9 9.6 L 42.4 12.6 L 39 16.8 Z" />
    <Fine>
      <path d="M 35.6 12.6 L 42.4 12.6" />
    </Fine>
  </>
)

const champagneTower: ReactElement = (
  <>
    {/* Each upper glass stands in the valley between two below it, as a real tower must. */}
    {coupe(10.4, 29, 5.6, 4.4)}
    {coupe(24, 29, 5.6, 4.4)}
    {coupe(37.6, 29, 5.6, 4.4)}
    {coupe(17.2, 20, 5.2, 3)}
    {coupe(30.8, 20, 5.2, 3)}
    {coupe(24, 11.4, 4.8, 2.6)}
    {/* The bottle is authored upright at its own mouth, then tipped to pour. */}
    <g transform="translate(28.8 10.4) rotate(-112)">
      <path d="M -0.8 0 L 0.8 0 L 0.8 1.2 L -0.8 1.2 Z" />
      <path d="M -0.7 1.2 L 0.7 1.2 L 0.7 6.4 C 0.7 8.2 1.9 8.8 1.9 10.4 L 1.9 14.4 C 1.9 15.2 1.5 15.6 0.8 15.6 L -0.8 15.6 C -1.5 15.6 -1.9 15.2 -1.9 14.4 L -1.9 10.4 C -1.9 8.8 -0.7 8.2 -0.7 6.4 Z" />
    </g>
    <Fine>
      <path d="M 28.2 10.6 C 27.4 11 26.6 11.3 26 11.5" />
      <circle cx={19.8} cy={7.2} r={0.5} />
      <circle cx={16.6} cy={12.4} r={0.45} />
      <circle cx={12.2} cy={21.4} r={0.5} />
      <circle cx={35.4} cy={23.8} r={0.45} />
      <circle cx={7.4} cy={25.4} r={0.45} />
      <circle cx={41.2} cy={16.8} r={0.5} />
    </Fine>
  </>
)

const chandelier: ReactElement = (
  <>
    <circle cx={24} cy={3} r={1.5} />
    <path d="M 24 4.6 L 24 6.2 M 24 8.6 L 24 9.8" />
    <ellipse cx={24} cy={7.4} rx={1.1} ry={1.2} />
    <path d="M 21.4 9.8 L 26.6 9.8 L 25.4 12 L 22.6 12 Z" />
    {/* Arms fanning from the collar out to each candle's foot on the hoop. */}
    <path d="M 22.9 12 C 19 13.6 13 17.8 10 21.4" />
    <path d="M 23.4 12 C 20.6 13.8 16.4 16.4 14.6 18.6" />
    <path d="M 24 12 L 24 17.4" />
    <path d="M 24.6 12 C 27.4 13.8 31.6 16.4 33.4 18.6" />
    <path d="M 25.1 12 C 29 13.6 35 17.8 38 21.4" />
    <ellipse cx={24} cy={22} rx={14} ry={4.2} />
    {/* Candles stand round the rim, so the far ones ride higher on the ellipse. */}
    <path d="M 9 22 L 9.1 16.6 Q 10 16.1 10.9 16.6 L 11 22" />
    <path d={flame(10, 16.2, 3)} />
    <path d="M 13.6 18.9 L 13.7 13.8 Q 14.6 13.3 15.5 13.8 L 15.6 18.9" />
    <path d={flame(14.6, 13.4, 2.8)} />
    <path d="M 23 17.8 L 23.1 12.6 Q 24 12.1 24.9 12.6 L 25 17.8" />
    <path d={flame(24, 12.2, 2.8)} />
    <path d="M 32.4 18.9 L 32.5 13.8 Q 33.4 13.3 34.3 13.8 L 34.4 18.9" />
    <path d={flame(33.4, 13.4, 2.8)} />
    <path d="M 37 22 L 37.1 16.6 Q 38 16.1 38.9 16.6 L 39 22" />
    <path d={flame(38, 16.2, 3)} />
    {/* Crystal skirt: four deep loops between points on the hoop, and one drop. */}
    <path d={swag(11, 23.4, 18, 25.8, 4.4)} />
    <path d={swag(18, 25.8, 30, 25.8, 4.6)} />
    <path d={swag(30, 25.8, 37, 23.4, 4.4)} />
    <path d={swag(13.4, 24.8, 24, 26.6, 9.4)} />
    <path d={swag(24, 26.6, 34.6, 24.8, 9.4)} />
    <path d="M 24 29.6 L 24 35.2" />
    <path d="M 24 35 C 22.6 36.5 22.8 38.6 24 39.5 C 25.2 38.6 25.4 36.5 24 35 Z" />
  </>
)

const dinner: ReactElement = (
  <>
    {candlestick(12, 27.4, 4.6, 11.4, 71)}
    {candlestick(19.4, 30, 4, 9.2, 72)}
    {/* Setting: charger, bowl, and the cutlery laid either side of it. */}
    <ellipse cx={31.4} cy={38} rx={9} ry={3.7} />
    <Fine>
      <ellipse cx={31.4} cy={38} rx={5.2} ry={1.8} />
    </Fine>
    <ellipse cx={7.6} cy={35.8} rx={4.4} ry={1.7} />
    <path d="M 3.2 35.8 C 3.3 38.7 5.2 40.9 7.6 41 C 10 40.9 11.9 38.7 12 35.8" />
    <Fine>
      {/* Fork left of the charger, knife and spoon to its right. */}
      <path d="M 18.8 33.2 L 18.8 35.8 M 20.2 33.2 L 20.2 35.8 M 21.6 33.2 L 21.6 35.8" />
      <path d="M 18.8 35.8 C 18.8 37.2 19.5 37.8 20.2 38 L 20.2 43.6 M 21.6 35.8 C 21.6 37.2 20.9 37.8 20.2 38" />
      <path d="M 42.2 33 C 43.6 33 44 34.4 43.6 35.6 L 42.5 38.6 L 42.5 43.6" />
      <ellipse cx={45.6} cy={34.8} rx={1.2} ry={2} />
      <path d="M 45.6 36.8 L 45.6 43.6" />
    </Fine>
  </>
)

const cake: ReactElement = (
  <>
    {/* Stand first, then the tiers resting on its plate. */}
    <ellipse cx={24} cy={45} rx={6.8} ry={1.7} />
    <path d="M 21.6 44.4 C 22.6 42.6 23.2 41.2 23.2 40" />
    <path d="M 26.4 44.4 C 25.4 42.6 24.8 41.2 24.8 40" />
    <ellipse cx={24} cy={38.8} rx={12.6} ry={3} />
    {tier(24, 28.6, 9.6, 2.7, 38.6)}
    {tier(24, 19.6, 7.1, 2.1, 28.6)}
    {tier(24, 11.4, 4.9, 1.5, 19.6)}
    {/* The blooms cascade one shoulder, exactly as the reference stages them. */}
    <path d={bloom(31.4, 14.8, 2.8)} />
    <path d={leaf(33, 12, 3.6, -44)} />
    <path d={bloom(31, 21.6, 2.6)} />
    <path d={leaf(33.8, 22.6, 3.4, 14)} />
    <path d={bloom(27.6, 27, 2.8)} />
    <path d={leaf(29.2, 30.4, 3.4, 68)} />
    <path d={bloom(21.2, 29.6, 2.6)} />
    <path d={leaf(20.6, 33, 3.2, 102)} />
    <path d={bloom(15.6, 28.8, 2.2)} />
    <path d={leaf(13.2, 27.4, 3.4, 190)} />
  </>
)

const shoes: ReactElement = (
  <>
    {/*
      Her shoe is one closed profile — topline, counter, spike, sole — rather
      than a sole with parts laid on it. Drawn as separate pieces the heel
      floats and the whole thing reads as a bird.
    */}
    <path d="M 4.5 42.3 C 6.8 40.4 9.2 38.6 11.5 37.2 C 13.9 35.8 15.7 33.7 16.8 31.1 C 17.9 32.9 18.7 34.7 19.1 36.5 C 20 39.1 20.6 41.6 20.8 43.6 L 19.2 43.6 C 19 41.1 18.4 38.7 17.4 36.9 C 14.8 39.7 10 42.2 4.5 42.3 Z" />
    {/* Ankle strap, anchored at the counter and returning to the vamp. */}
    <path d="M 16.6 31.3 C 14.4 27 10.4 26 8.4 28.6 C 6.6 31 8 34.6 11.4 36.5" />
    <Fine>
      <path d="M 5.2 41.2 C 9.4 41 13.8 39.1 16.6 36.6" />
      <path d="M 11.6 36.8 C 13.2 36.1 14.8 34.7 15.9 32.9" />
    </Fine>
    {/*
      His oxford, toe to the right: one contour for sole and upper, then the
      throat and its lace ladder, which is the only part anyone actually reads.
    */}
    <path d="M 26.6 43.6 C 31 44.4 38 44.4 43.6 43.4 C 45.4 43 45.8 41.6 44.6 40.8 C 44.2 38.8 42.6 37 40.4 36.2 C 38 35.4 36.6 34.4 35.4 33.4 C 34 32.2 32.4 31.6 30.8 31.8 C 28.6 32.2 27.4 34.6 27 37.6 C 26.7 39.8 26.6 42 26.6 43.6 Z" />
    <Fine>
      <path d="M 26.8 41.4 C 31.4 42.2 38.6 42.2 44.4 41.2" />
      <path d="M 41.6 36.6 C 41 38.2 40.8 40 40.8 41.6" />
      <path d="M 30.4 33.4 C 31.8 34.8 33.4 36 35 36.8" />
      <path d="M 31.6 32.2 L 31.3 34.4 M 33 32.7 L 32.7 35.5 M 34.4 33.2 L 34.1 36.5" />
      <path d="M 30.8 31.8 C 29.8 31.4 28.8 31.8 28.2 32.8" />
      <path d="M 27.2 41.5 L 27.2 43.8" />
    </Fine>
  </>
)

const cupid: ReactElement = (
  <>
    {/* Wings behind, so the body outline stays unbroken over them. */}
    <path d={wing(31.2, 20.6, 14.4, -40, 4, 4.6)} />
    <path d={wing(31.8, 25, 11, -6, 3, 3.8)} />
    {/* Legs kicked back, then the torso drawn over their tops. */}
    <path d="M 28.4 33.6 C 31.6 35.4 34.6 35.8 37 34.8 C 38.6 34.3 39.4 35.6 38.4 36.5 C 37.4 37.3 35.8 36.8 35 36" />
    <path d="M 25 34 C 26.6 37.2 28.8 39.6 31.4 40.6 C 32.8 41.2 32.6 42.8 31.2 42.9 C 30 43 29 42 28.6 41" />
    <path d="M 22 24.2 C 19.4 26 19 29.6 21 31.8 C 23.2 34.2 27.8 34.6 30.8 32.8 C 33.4 31.2 33.8 27.4 31.8 25 C 30.6 23.6 28.6 23 26.8 23.6" />
    {/* Head: the hair is a cloud of lobes, which is most of the likeness. */}
    <path d="M 18.6 13.8 C 18 19.4 20.2 23.4 24.4 24.4 C 28.6 23.4 30.8 20.2 31 16.1" />
    <path d="M 18.7 14.2 C 16.8 10.8 17.8 6.6 20.8 5 C 21.8 2.6 25.4 2 27.2 4 C 30.2 3 33 5 32.8 8 C 34.8 9.6 34.4 13.2 32 14.6 C 31.6 15.2 31.2 15.8 31 16.2" />
    <Fine>
      <path d="M 20.6 12.4 C 22.8 9.6 26.8 9.2 29.2 11.4" />
      <path d="M 22.8 20.4 Q 24.8 22 26.8 19.9" />
    </Fine>
    <circle cx={21.8} cy={16.8} r={1} fill="var(--color-ink)" stroke="none" />
    <circle cx={27.4} cy={16.4} r={1} fill="var(--color-ink)" stroke="none" />
    {/* Arms: one out to the grip, one back to the string. */}
    <path d="M 22 27 C 19.8 26.4 17.6 26.6 16.2 27.4" />
    <path d="M 29.6 26.2 C 31.4 27.4 32 29.2 31.2 30.8" />
    {/* Bow and heart-tipped arrow. */}
    <path d="M 13.8 15.6 C 8.4 20.6 8.4 32.2 13.8 37.2" />
    <path d="M 13.8 15.6 C 15.2 14.6 16.2 15.4 15.6 16.6" />
    <path d="M 13.8 37.2 C 15.2 38.2 16.2 37.4 15.6 36.2" />
    <Fine>
      <path d="M 15.2 16.2 L 16.4 26.4 L 15.2 36.6" />
    </Fine>
    <path d="M 4.4 26.4 L 17.4 26.4" />
    <path d={heart(4.2, 24.2, 4.4, 4.2)} />
    <Fine>
      <path d="M 17.4 26.4 L 15.2 24.8 M 17.4 26.4 L 15.2 28" />
    </Fine>
  </>
)

const firstDate: ReactElement = (
  <>
    {/* Chairs go under: the cloth hides where their front legs meet the table. */}
    <path d="M 4.2 20.2 C 4.2 18.8 5.4 18.2 6.8 18.4 L 10 19 C 10.9 19.2 11.3 19.9 11.2 20.8" />
    <path d="M 4.4 31.2 L 12 32.4 L 11.4 34.2 L 4.8 33.1 Z" />
    <path d="M 5.2 33.8 L 5.2 42.8 M 11.6 34.2 L 11.6 42.6" />
    <Fine>
      <path d="M 5.2 20.6 L 5.4 31.4 M 7.8 20.9 L 7.9 31.7 M 10.4 21.4 L 10.2 32" />
    </Fine>
    <path d="M 43.8 20.2 C 43.8 18.8 42.6 18.2 41.2 18.4 L 38 19 C 37.1 19.2 36.7 19.9 36.8 20.8" />
    <path d="M 43.6 31.2 L 36 32.4 L 36.6 34.2 L 43.2 33.1 Z" />
    <path d="M 42.8 33.8 L 42.8 42.8 M 36.4 34.2 L 36.4 42.6" />
    <Fine>
      <path d="M 42.8 20.6 L 42.6 31.4 M 40.2 20.9 L 40.1 31.7 M 37.6 21.4 L 37.8 32" />
    </Fine>
    {/* Cloth to the floor, hem scalloped. */}
    <ellipse cx={24} cy={27} rx={12.6} ry={3.8} />
    <path d="M 11.4 27 C 10.6 32.4 11 38 11.8 42.6" />
    <path d="M 36.6 27 C 37.4 32.4 37 38 36.2 42.6" />
    <path d="M 11.8 42.6 Q 15.4 44.4 19 42.8 Q 22.6 44.4 26.2 42.8 Q 29.8 44.4 33.4 42.8 Q 34.8 43.8 36.2 42.6" />
    <Fine>
      <path d="M 17.6 31 C 17.4 35.4 17.6 39.4 18 43.1 M 24 31.8 C 24 36 24 40 24 43.4 M 30.4 31 C 30.6 35.4 30.4 39.4 30 43.1" />
    </Fine>
    {/* Laid for two: plates, a flute, roses in a vase, one candle. */}
    <Fine>
      <ellipse cx={17.8} cy={30.2} rx={3.2} ry={1.1} />
      <ellipse cx={29.4} cy={30.4} rx={3.2} ry={1.1} />
      <path d={heart(23.6, 30.6, 2.6, 2.4)} />
    </Fine>
    {candlestick(14.6, 26.6, 3.4, 7.2, 81)}
    {flute(35.2, 21.6, 3, 4.6, 3.4)}
    <path d="M 25.6 26.8 C 25 24.2 25.2 21.6 26.4 20 L 30.4 20 C 31.6 21.6 31.8 24.2 31.2 26.8" />
    <Fine>
      <path d="M 28.4 16.8 L 28.4 19.8 M 26 17.8 L 27.6 19.8 M 30.8 17.6 L 29.2 19.8" />
    </Fine>
    <path d={bloom(28.4, 13.4, 2.9)} />
    <path d={bloom(24.4, 15.4, 2.3)} />
    <path d={bloom(32.4, 15.2, 2.3)} />
  </>
)

const suitcase: ReactElement = (
  <>
    <path d={penRect(5, 18, 33, 24, 3, 91)} />
    <path d="M 15.6 18.1 C 15.4 13.2 17.8 11 21.4 11 C 25 11 27.4 13.2 27.2 18.1" />
    <Fine>
      <path d="M 17.8 18.1 C 17.6 14.8 19 13.4 21.4 13.4 C 23.8 13.4 25.2 14.8 25 18.1" />
      {/* Corner protectors. */}
      <path d="M 5.2 24.6 C 8.6 24.2 11.4 21.4 11.8 18.1" />
      <path d="M 37.8 24.6 C 34.4 24.2 31.6 21.4 31.2 18.1" />
      <path d="M 5.2 35.4 C 8.6 35.8 11.4 38.6 11.8 41.9" />
      <path d="M 37.8 35.4 C 34.4 35.8 31.6 38.6 31.2 41.9" />
    </Fine>
    {/* Two strapped bands with their buckles. */}
    <path d="M 12.2 18.2 L 12.2 41.8 M 16.2 18.2 L 16.2 41.8" />
    <path d="M 26.8 18.2 L 26.8 41.8 M 30.8 18.2 L 30.8 41.8" />
    <Fine>
      <path d={penRect(11, 23.2, 6.4, 4.4, 0.4, 93)} />
      <path d={penRect(25.6, 23.2, 6.4, 4.4, 0.4, 94)} />
      {/* Stickers, in the reference's own jumble of places been. */}
      <path d="M 8.4 31 L 11 29.2 L 9.9 31.6 L 11.6 32.4 L 9.6 33.4 L 9.9 35.4 L 8.4 34 L 6.4 34.8 L 7.4 32.8 L 6 31.6 Z" />
      <circle cx={21.6} cy={22.4} r={2.8} />
      <path d="M 19 21.6 C 20.6 22.6 22.6 22.4 24.2 21.2 M 21.6 19.6 C 20.5 21.3 20.5 23.5 21.6 25.2" />
      <path d="M 22.2 29.6 L 25.8 35.2 L 18.6 35.4 Z" />
      <path d="M 33.6 29 L 36.6 33.6 L 30.6 33.7 Z" />
      <circle cx={34.6} cy={38.4} r={2.6} />
      <ellipse cx={21.8} cy={39} rx={3} ry={1.6} transform="rotate(-16 21.8 39)" />
      <path d="M 9.6 37.2 L 8 39.6 M 7 36.6 L 11.4 38" />
    </Fine>
    {/* Its aeroplane, already gone. */}
    <path d="M 38.6 9.4 L 44.6 5.6 C 45.6 5 46.4 5.4 46 6.4 L 43.6 11.8 L 45.4 13.6 L 44.4 14.4 L 41.8 13.4 L 40.6 15.4 L 41.2 17 L 40.2 17.6 L 38.6 15.4 L 36.2 14.8 L 36.4 13.6 L 38.6 13.4 Z" />
    <Fine>
      <path d="M 31.4 16.4 L 32.8 15.6 M 34.2 14.7 L 35.4 14" />
    </Fine>
  </>
)

const ringHand: ReactElement = (
  <>
    {/*
      One unbroken contour: out along the top of each finger, round the tip and
      back into the web. Drawing the fingers as separate tubes puts eight long
      strokes a unit apart and the hand closes into a mitten. The webs return
      only a third of the way, or the fingers sink back into the palm.
    */}
    <path
      d="M 40 42
         C 38 34 32 28 25 24
         C 21 19 16 14 11.6 10.6
         A 1.6 1.6 0 0 0 9.6 12.6
         C 14 16 18 20 21 24.4
         C 17 20 12 16.6 7.4 14.6
         A 1.5 1.5 0 0 0 5.8 16.9
         C 10 19.6 15 24 19.2 27.6
         C 15 24.4 10 21.4 6 20
         A 1.4 1.4 0 0 0 5.2 22.6
         C 9.6 24.6 14.4 28.4 18.4 30.8
         C 15.4 29.4 11.4 27.8 8.6 27.4
         A 1.3 1.3 0 0 0 8.2 29.6
         C 12 31 16 33.6 20.6 35.6
         C 24 39 28 43 33 47"
    />
    {/* Band across the finger, then the stone standing proud of it. */}
    <ellipse cx={17.8} cy={18.1} rx={1.55} ry={0.8} transform="rotate(-26 17.8 18.1)" />
    <path d="M 17.4 14.8 L 18.3 12.8 L 20.9 12.8 L 21.8 14.8 L 19.6 17.6 Z" />
    <Fine>
      <path d="M 17.4 14.8 L 21.8 14.8" />
      <path d="M 19.6 11.4 L 19.6 8.2 M 22.4 12.2 L 25 10.2 M 23.2 15 L 26.4 14.4 M 16.8 12.4 L 14.4 10.6" />
    </Fine>
  </>
)

const car: ReactElement = (
  <>
    {/* Roofline: radiator, bonnet, screen, roof, then the boot falling away. */}
    <path d="M 5.6 26.6 C 8.6 25.4 13 24.6 16.8 24.2 C 17.4 20.4 19.2 17.6 21.6 16.6 C 24.6 15.6 27.4 16 29.2 17.4 C 31.2 19 32.6 21.2 33.4 23.6 C 37 24.2 40 25.4 42 27 C 43.4 28.2 43.6 30.4 43.4 32.6" />
    <path d="M 4.6 32.6 C 4.6 29.8 4.9 27.6 5.6 26.6" />
    <path d="M 4.6 32.6 L 43.4 32.6" />
    {/* Radiator shell and the lamp on its stalk. */}
    <path d={penRect(4.6, 26.4, 3.2, 6, 0.8, 97)} />
    <circle cx={9.8} cy={24.4} r={1.7} />
    <Fine>
      <path d="M 9.8 26.1 L 10.2 27.4" />
      {/* Cabin: two side windows and the door shut between them. */}
      <path d="M 20.6 23.2 C 21 20.6 21.8 18.6 22.6 18.2 L 25.2 18.2 L 25.2 23.4 Z" />
      <path d="M 26.6 18.2 L 28.4 18.2 C 29.6 19.4 30.6 21.2 31.4 23.6 L 26.6 23.4 Z" />
      <path d="M 25.9 24.4 L 25.9 31.4" />
      <path d="M 24.4 27.2 L 22.8 27.2" />
    </Fine>
    {/* Fenders over each wheel and the running board between them. */}
    <path d="M 7.4 32.6 C 7.6 28.4 10 26.4 13.4 26.4 C 16.8 26.4 19.2 28.4 19.4 32.6" />
    <path d="M 31 32.6 C 31.2 28.4 33.6 26.4 37 26.4 C 40.4 26.4 42.8 28.4 43 32.6" />
    <Fine>
      <path d="M 19.6 32.8 L 30.8 32.8 L 30.8 34.4 L 19.6 34.4 Z" />
    </Fine>
    <circle cx={13.4} cy={34.8} r={4.8} />
    <circle cx={37} cy={34.8} r={4.8} />
    <Fine>
      <circle cx={13.4} cy={34.8} r={1.9} />
      <circle cx={37} cy={34.8} r={1.9} />
    </Fine>
    {/* JUST MARRIED, and the tins on their string. */}
    <path d="M 43 33 L 43.2 36.4" />
    <path d={penRect(36.6, 36.4, 10, 4.2, 0.4, 96)} />
    <Fine>
      <path d={words(37.8, 38.5, 7.6, 96)} />
      <path d="M 39.6 40.6 C 38.6 42.2 37.6 43.4 36.6 44" />
      <path d="M 43.8 40.6 C 43.8 42 43.6 43.2 43.2 44.2" />
    </Fine>
    <ellipse cx={35.6} cy={45} rx={1.4} ry={1.5} />
    <ellipse cx={42.8} cy={45.4} rx={1.4} ry={1.5} />
  </>
)

const honeymoon: ReactElement = (
  <>
    {/* Sea behind everything, so the furniture stands in front of it. */}
    <Fine>
      <path d={pen(20.4, 32.6, 39.6, 32.6, 101, 0.2)} />
      <path d="M 23.4 35.4 L 28 35.4 M 31 36.2 L 35.6 36.2" />
    </Fine>
    {/* Sun on the horizon, with its rays. */}
    <path d="M 24 32.6 A 5.5 5.5 0 0 1 35 32.6" />
    <Fine>
      <path d="M 29.5 25.4 L 29.5 22.6 M 24.6 26.8 L 23 24.8 M 34.4 26.8 L 36 24.8 M 21.8 30.6 L 19.4 29.8" />
    </Fine>
    {/* Parasol: a scalloped dome on a pole planted in the sand. */}
    <path d="M 3.4 17 C 3.6 10.6 7 6.6 11.4 6.4 C 15.8 6.6 19.2 10.6 19.4 17" />
    <path d="M 3.4 17 C 5.6 18.6 7.6 18.6 9.4 17 C 11.2 18.6 13.2 18.6 15 17 C 16.6 18.2 18.2 18.2 19.4 17" />
    <Fine>
      <path d="M 11.4 6.6 C 10 9.8 9.6 13.4 9.4 17.2" />
      <path d="M 11.4 6.6 C 13.2 9.8 14.2 13.4 15 17.2" />
    </Fine>
    <path d="M 11.4 6.4 L 11.4 4.4" />
    <path d="M 11.6 6.8 C 12.4 15 13.2 26 14 37.6" />
    {/* Two loungers, drawn as a tilted back on a flat bed. */}
    <path d="M 7.8 41.4 L 5 34.4 L 7.4 33.8 L 10.4 41.6 Z" />
    <path d="M 7.8 41.4 L 17.2 42.8 L 16.9 44.4 L 7.5 43 Z" />
    <Fine>
      <path d="M 5.9 36.6 L 8.4 36 M 6.7 38.8 L 9.2 38.2" />
      <path d="M 8.2 44.2 L 7.9 46.4 M 16.4 44.5 L 16.1 46.6" />
    </Fine>
    <path d="M 20.4 41 L 17.6 34 L 20 33.4 L 23 41.2 Z" />
    <path d="M 20.4 41 L 29.8 42.4 L 29.5 44 L 20.1 42.6 Z" />
    <Fine>
      <path d="M 18.5 36.2 L 21 35.6 M 19.3 38.4 L 21.8 37.8" />
      <path d="M 20.8 43.8 L 20.5 46 M 29 44.1 L 28.7 46.2" />
    </Fine>
    {/* Palm: fronds off a single crown, a rung-marked trunk. */}
    <path d="M 42.2 45.6 C 41 37.6 40.2 29.4 39.4 21.8" />
    <Fine>
      <path d="M 40 25 L 42.3 24.7 M 40.4 28.6 L 42.7 28.3 M 40.9 32.2 L 43.2 31.9 M 41.4 35.8 L 43.7 35.5 M 41.8 39.4 L 44.1 39.1" />
    </Fine>
    <path d={frond(39.4, 21.4, 8.2, 198, 2.6)} />
    <path d={frond(39.4, 21.4, 6.8, 240, 3)} />
    <path d={frond(39.4, 21.4, 6.2, 302, 2.4)} />
    <path d={frond(39.4, 21.4, 7, 346, 2.8)} />
    <Fine>
      <circle cx={38} cy={23.4} r={1} />
      <circle cx={41.2} cy={23.2} r={1} />
    </Fine>
    <path d={heart(25.4, 12.4, 4.8, 4.4)} />
  </>
)

const GLYPHS: Record<LineIconName, ReactElement> = {
  calendar,
  ceremony,
  reception,
  travel,
  stay,
  hearts,
  'champagne-tower': champagneTower,
  chandelier,
  dinner,
  cake,
  shoes,
  cupid,
  'first-date': firstDate,
  suitcase,
  'ring-hand': ringHand,
  car,
  honeymoon,
}

export function LineIcon({ name, size = 48, className }: LineIconProps): ReactElement {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="var(--color-ink)"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[name]}
    </svg>
  )
}
