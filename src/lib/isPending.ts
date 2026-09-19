import { PENDING, type MaybePending, type Pending } from '../data/types'

/**
 * Whether a value is the not-yet-known sentinel.
 *
 * This is the only place outside the content file that knows what the sentinel
 * looks like. Centralising it is what stops a pending value being quietly
 * swallowed by a truthiness check somewhere in a card.
 */
export function isPending<T>(value: MaybePending<T> | undefined): value is Pending {
  return value === PENDING
}

/**
 * Narrows a value to its known form, or `undefined` when still pending.
 *
 * Useful where a caller needs the real value and has already decided what to
 * render in its absence.
 */
export function knownValue<T>(value: MaybePending<T> | undefined): T | undefined {
  return isPending(value) || value === undefined ? undefined : (value as T)
}
