import type { ReactElement } from 'react'

/**
 * The drawings the reference had no need for: this couple's four functions,
 * and the places their story passes through.
 *
 * Kept apart from `LineIcons` — which reproduces the reference's own set — but
 * drawn on the same 48-unit grid at the same stroke weight, so the two sit
 * together without looking like two different hands.
 */
export type PlaceIconName =
  // The four functions.
  | 'mehndi'
  | 'haldi'
  | 'sangeet'
  | 'mandap'
  // Stops on the route.
  | 'college'
  | 'story'
  | 'flag'
  | 'hills'
  | 'skyline'
  | 'yacht'
  | 'market'
  | 'castle'
  | 'island'

export interface PlaceIconProps {
  name: PlaceIconName
  size?: number
  className?: string | undefined
}

const PATHS: Record<PlaceIconName, ReactElement> = {
  /* A hennaed palm: the fingers together, a paisley in the middle of the hand. */
  mehndi: (
    <>
      <path d="M16.5 42V27.5c0-2.2-2.8-2.6-2.8-5.4v-7.4c0-1.5 2.1-1.5 2.1 0v6.6" />
      <path d="M18.8 20.8V9.4c0-1.6 2.2-1.6 2.2 0v11" />
      <path d="M23.7 20.6V8.2c0-1.7 2.3-1.7 2.3 0v12.2" />
      <path d="M28.7 21.4V11.2c0-1.6 2.2-1.6 2.2 0v11.4c0 4.2-1.9 5.1-1.9 8.4V42" />
      <path d="M16.5 42h12.5" />
      <path d="M22.8 33.6c-2.6-1.6-2.4-5 .4-5.6 2.2-.5 3.6 1.4 3 3.4-.4 1.4-1.8 2.1-3.4 2.2z" />
      <path d="M19.4 37.4h7" />
    </>
  ),
  /* A brass pot of turmeric with a flower resting on the rim. */
  haldi: (
    <>
      <path d="M12.6 23.4h22.8l-2.4 14.2A4.2 4.2 0 0 1 28.9 41h-9.8a4.2 4.2 0 0 1-4.1-3.4z" />
      <path d="M10.4 23.4h27.2" />
      <path d="M17.6 30.2c3.4 1.8 9.4 1.8 12.8 0" />
      <circle cx="24" cy="14.6" r="3.4" />
      <path d="M24 11.2c0-2.6 2.6-3.8 4.2-2.4M24 18c-2.6.8-4.8-1-4.4-3.2M27.4 14.6c2.6-.6 4.4 1.4 3.6 3.4M20.6 14.6c-2.6-.6-4.4 1.4-3.6 3.4" />
      <path d="M24 18v5.4" />
    </>
  ),
  /* A dholak, slung and struck: the drum of every sangeet. */
  sangeet: (
    <>
      <path d="M13 19.6h22a2 2 0 0 1 2 2.2l-1.2 8a2 2 0 0 1-2 1.8H14.2a2 2 0 0 1-2-1.8l-1.2-8a2 2 0 0 1 2-2.2z" />
      <ellipse cx="11.6" cy="25.6" rx="2.4" ry="6" />
      <ellipse cx="36.4" cy="25.6" rx="2.4" ry="6" />
      <path d="M14 21.6l20 8M14 29.6l20-8" />
      <path d="M8 38c2.8-3 5-4.4 7.6-5M40 38c-2.8-3-5-4.4-7.6-5" />
    </>
  ),
  /* A mandap: four posts, a canopy, and a garland swagged across the front. */
  mandap: (
    <>
      <path d="M9 42V19M39 42V19M15 42V21M33 42V21" />
      <path d="M6 19h36" />
      <path d="M8 19c3.6-6.6 9.4-9.4 16-9.4S36.4 12.4 40 19" />
      <path d="M24 9.6V6" />
      <path d="M9 23c4 4.4 8.6 6.6 15 6.6S35 27.4 39 23" />
      <path d="M19 42V34a5 5 0 0 1 10 0v8" />
    </>
  ),
  /* A mortarboard, tassel hanging from the corner: the same college. */
  college: (
    <>
      <path d="M24 11.5L42 19.5 24 27.5 6 19.5z" />
      <path d="M13.4 22.8V30c0 3.2 4.8 5.6 10.6 5.6S34.6 33.2 34.6 30v-7.2" />
      <path d="M42 19.5v8.4" />
      <path d="M42 27.9c0 2.2-.8 3.8-2 5" />
    </>
  ),
  /* A message with a heart in it: the story, and the reply. */
  story: (
    <>
      <path d="M11 9.5h26a4 4 0 0 1 4 4v15a4 4 0 0 1-4 4H22.6l-7.2 5.8v-5.8H11a4 4 0 0 1-4-4v-15a4 4 0 0 1 4-4z" />
      <path d="M24 27.6c-3.6-2.5-6.2-4.7-6.2-7.6a3.2 3.2 0 0 1 6.2-1.4 3.2 3.2 0 0 1 6.2 1.4c0 2.9-2.6 5.1-6.2 7.6z" />
    </>
  ),
  /* The chequered flag: race weekends. */
  flag: (
    <>
      <path d="M10.5 42V7" />
      <path d="M10.5 9h27v18h-27" />
      <path d="M19.5 9v18M28.5 9v18M10.5 15h27M10.5 21h27" />
    </>
  ),
  /* Tea-terraced hills with the sun low behind them. */
  hills: (
    <>
      <circle cx="34" cy="14.6" r="4.2" />
      <path d="M4 35.4l11-13.6 7.6 9.4 6-7.6L44 35.4z" />
      <path d="M11 30c2.6-1.8 5-1.8 7.4 0M26 29c2.4-1.6 4.6-1.6 7 0" />
      <path d="M4 40h40" />
    </>
  ),
  /* A waterfront skyline — towers, a crown, and the water beneath. */
  skyline: (
    <>
      <path d="M6 36V23.4h6.4V36M15.4 36V15.6h7V36M25.6 36V20.4h6V36M34.4 36V26h6.4v10" />
      <path d="M15.4 15.6c2-3.4 5-3.4 7 0" />
      <path d="M9 27.6h.6M18.6 20h.6M18.6 26h.6M28 25h.6M37 30h.6" />
      <path d="M4 40c3.4 2 6.8 2 10.2 0s6.8-2 10.2 0 6.8 2 10.2 0 6-1.8 9.4-.4" />
    </>
  ),
  /* A yacht under sail, with the water broken beneath it. */
  yacht: (
    <>
      <path d="M9.4 33h29.2l-3.6 6.2H13z" />
      <path d="M24 31V7.4L35.4 31z" />
      <path d="M21.8 31V16.6L12.4 31z" />
      <path d="M24 7.4V5" />
      <path d="M4 42.4c3 1.8 6 1.8 9 0s6-1.8 9 0 6 1.8 9 0 5.4-1.6 8.6-.4" />
    </>
  ),
  /* A covered market arcade, strung with lights for Christmas. */
  market: (
    <>
      <path d="M9 42V23h30v19z" />
      <path d="M6.6 23L12 14h24l5.4 9z" />
      <path d="M16 42V32.6a3.6 3.6 0 0 1 7.2 0V42" />
      <path d="M28.4 31h6.2v7h-6.2z" />
      <path d="M12 14V9.6M24 14V7.6M36 14V9.6" />
      <path d="M9 19.4c4.4 2.2 8.6 2.2 13 0s8.6-2.2 13 0" />
    </>
  ),
  /* A castle on its crag, above the roofs. */
  castle: (
    <>
      <path d="M11 33V16.6h4.6V12h4.4v4.6h7.6V12h4.4v4.6H37V33z" />
      <path d="M20.4 33V25a3.6 3.6 0 0 1 7.2 0v8" />
      <path d="M15.6 22h3.2M29.2 22h3.2" />
      <path d="M4 42c4-7 8-9 12-9h16c4 0 8 2 12 9z" />
      <path d="M20.2 12V8.6l3.2 1.6-3.2 1.6" />
    </>
  ),
  /* A palm over two loungers, with the sun setting on the water. */
  island: (
    <>
      <circle cx="37" cy="12.8" r="4" />
      <path d="M21.4 36V19.6" />
      <path d="M21.4 19.6c-4.6-4.8-10.4-3.2-11.6.8 3.6-2.8 7.4-2 9.6 1M21.4 19.6c4.6-4.8 10.4-3.2 11.6.8-3.6-2.8-7.4-2-9.6 1M21.4 19.6c-.4-6 3.2-9.4 7.4-8.6-3.8 2-5.2 4.8-5.2 8.2" />
      <path d="M8 36h7.4l1.6-5.4M26 36h7.4l-1.6-5.4" />
      <path d="M4 41.4c3 1.8 6 1.8 9 0s6-1.8 9 0 6 1.8 9 0 5.4-1.6 8.6-.4" />
    </>
  ),
}

export function PlaceIcon({ name, size = 48, className }: PlaceIconProps): ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
