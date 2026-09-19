import { jitter } from './geometry'

/**
 * What sits in a photo frame until the real photographs arrive.
 *
 * The reference uses the same device: a flat illustrated sky over a green rise,
 * clearly a stand-in rather than a picture. Varying the seed shifts the cloud
 * and the horizon so a row of frames does not look cloned.
 */
export function PhotoStandIn({ seed = 1, className }: { seed?: number; className?: string | undefined }) {
  // Wide ranges on purpose. The story route stands seven of these in a column,
  // and a horizon that moves by a tenth of the frame reads as one tile repeated
  // rather than as seven pictures waiting to be replaced.
  const horizon = 44 + jitter(seed) * 34
  const cloudX = 20 + jitter(seed * 3) * 56
  const cloudY = 14 + jitter(seed * 7) * 24
  const cloudR = 7 + jitter(seed * 11) * 4

  return (
    <svg
      className={className}
      viewBox="0 0 100 120"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`sky${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-sky-deep)" />
          <stop offset="100%" stopColor="var(--color-sky)" />
        </linearGradient>
      </defs>
      <rect width="100" height="120" fill={`url(#sky${seed})`} />
      <g fill="var(--color-paper)" opacity="0.94">
        <circle cx={cloudX} cy={cloudY} r={cloudR} />
        <circle cx={cloudX + cloudR * 1.1} cy={cloudY + 2} r={cloudR * 0.78} />
        <circle cx={cloudX - cloudR} cy={cloudY + 3} r={cloudR * 0.67} />
        <rect
          x={cloudX - cloudR * 1.7}
          y={cloudY + 2}
          width={cloudR * 3.4}
          height={cloudR * 0.78}
          rx={cloudR * 0.39}
        />
      </g>
      <path
        d={`M 0 120 L 0 ${horizon + 16} Q ${20 + jitter(seed * 5) * 24} ${horizon - 8} 58 ${horizon + 8} Q 82 ${horizon + 18} 100 ${horizon + 4} L 100 120 Z`}
        fill="var(--color-meadow)"
      />
    </svg>
  )
}
