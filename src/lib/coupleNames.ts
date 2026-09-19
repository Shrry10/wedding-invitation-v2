import type { Couple } from '../data/types'

/** The two names in the order they are shown, leading name first. */
export function coupleNames(couple: Couple): [string, string] {
  return couple.leadName === 'groom'
    ? [couple.groomName, couple.brideName]
    : [couple.brideName, couple.groomName]
}

/**
 * The two initials with nothing between them, for a struck cipher.
 *
 * Separate from `coupleMonogram`: a wax seal interleaves the two letters, and
 * feeding it the spaced "S & B" form sets the ampersand as a third glyph.
 */
export function coupleInitials(couple: Couple): string {
  const [first, second] = coupleNames(couple)
  return `${first.charAt(0)}${second.charAt(0)}`
}

/** Initials in the same order, for the monogram. */
export function coupleMonogram(couple: Couple): string {
  const [first, second] = coupleNames(couple)
  return `${first.charAt(0)} & ${second.charAt(0)}`
}
