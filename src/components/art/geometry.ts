/**
 * Shared geometry for the drawn architecture.
 *
 * Kept apart from the components so the shapes can be unit tested as numbers,
 * and so an arch used in two places is demonstrably the same arch.
 */

export type Point = readonly [number, number]

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
