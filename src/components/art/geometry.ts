/**
 * Shared geometry for the drawn architecture.
 *
 * Kept apart from the components so the shapes can be unit tested as numbers,
 * and so an arch used in two places is demonstrably the same arch.
 */

export type Point = readonly [number, number]

/**
 * A cusped (multifoil) arch — the lobed opening of a temple gate.
 *
 * Lobe centres are sampled at equal angle along an ellipse, and consecutive
 * centres joined by an arc that bulges into the opening. Lobe radius is derived
 * from the chord rather than chosen, so changing the lobe count keeps the
 * scallops touching instead of overlapping or leaving gaps.
 */
export function cuspedArchPath(
  cx: number,
  baseY: number,
  rx: number,
  ry: number,
  lobes: number,
): string {
  const points: Point[] = []
  for (let i = 0; i <= lobes; i += 1) {
    const angle = Math.PI * (1 - i / lobes)
    points.push([cx + rx * Math.cos(angle), baseY - ry * Math.sin(angle)])
  }

  const first = points[0] as Point
  let d = `M ${round(first[0])} ${round(first[1])}`
  for (let i = 1; i <= lobes; i += 1) {
    const from = points[i - 1] as Point
    const to = points[i] as Point
    const chord = Math.hypot(to[0] - from[0], to[1] - from[1])
    // Above a half-chord the lobe becomes a bulge rather than a flat scallop.
    const r = (chord / 2) * 1.06
    // Sweep 1: the lobe bulges into the opening, which is what makes the arch
    // read as cusped rather than as a scalloped bowl.
    d += ` A ${round(r)} ${round(r)} 0 0 1 ${round(to[0])} ${round(to[1])}`
  }
  return d
}

/** Points spaced evenly in parameter along a quadratic curve — a garland swag. */
export function pointsAlongQuad(p0: Point, p1: Point, p2: Point, count: number): Point[] {
  const out: Point[] = []
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const u = 1 - t
    out.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ])
  }
  return out
}

/**
 * A deterministic value in [0,1) from an integer.
 *
 * Randomness would make every render different, which breaks both server
 * rendering and the screenshot comparisons. This gives the same scatter every
 * time while still looking unplanned.
 */
export function jitter(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * A closed scalloped ellipse — the cloud-edged label the reference uses for
 * every "click here" and every small caption.
 *
 * Lobes bulge outward, which is the opposite of the cusped arch above; the two
 * differ only in sweep, so they are kept together to stay comparable.
 */
export function scallopedEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  lobes: number,
): string {
  const points: Point[] = []
  for (let i = 0; i < lobes; i += 1) {
    const angle = (i / lobes) * Math.PI * 2
    points.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)])
  }
  const first = points[0] as Point
  let d = `M ${round(first[0])} ${round(first[1])}`
  for (let i = 1; i <= lobes; i += 1) {
    const from = points[(i - 1) % lobes] as Point
    const to = points[i % lobes] as Point
    const chord = Math.hypot(to[0] - from[0], to[1] - from[1])
    const r = (chord / 2) * 1.08
    d += ` A ${round(r)} ${round(r)} 0 0 1 ${round(to[0])} ${round(to[1])}`
  }
  return `${d} Z`
}

/**
 * A scalloped rectangle, for the ornate picture frames.
 *
 * Lobe count per side is derived from the side length so the scallops stay the
 * same size whatever shape the frame is, rather than stretching with it.
 */
export function scallopedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  lobe: number,
): string {
  const across = Math.max(2, Math.round(w / lobe))
  const down = Math.max(2, Math.round(h / lobe))
  const stepX = w / across
  const stepY = h / down
  const arc = (r: number, toX: number, toY: number) =>
    ` A ${round(r)} ${round(r)} 0 0 1 ${round(toX)} ${round(toY)}`

  let d = `M ${round(x)} ${round(y)}`
  for (let i = 1; i <= across; i += 1) d += arc(stepX * 0.56, x + stepX * i, y)
  for (let i = 1; i <= down; i += 1) d += arc(stepY * 0.56, x + w, y + stepY * i)
  for (let i = 1; i <= across; i += 1) d += arc(stepX * 0.56, x + w - stepX * i, y + h)
  for (let i = 1; i <= down; i += 1) d += arc(stepY * 0.56, x, y + h - stepY * i)
  return `${d} Z`
}
