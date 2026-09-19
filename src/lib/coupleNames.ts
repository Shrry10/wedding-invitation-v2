import type { Couple, LeadName } from '../data/types'

/**
 * The two names in the order they are shown, leading name first.
 *
 * `lead` defaults to the content's own choice. The address can override it,
 * so each side of the family can send a link with their child's name first.
 */
export function coupleNames(couple: Couple, lead: LeadName = couple.leadName): [string, string] {
  return lead === 'groom'
    ? [couple.groomName, couple.brideName]
    : [couple.brideName, couple.groomName]
}

/**
 * The two initials with nothing between them, for a struck cipher.
 *
 * Separate from `coupleMonogram`: a wax seal interleaves the two letters, and
 * feeding it the spaced "S & B" form sets the ampersand as a third glyph.
 */
export function coupleInitials(couple: Couple, lead: LeadName = couple.leadName): string {
  const [first, second] = coupleNames(couple, lead)
  return `${first.charAt(0)}${second.charAt(0)}`
}

/** Initials in the same order, for the monogram. */
export function coupleMonogram(couple: Couple, lead: LeadName = couple.leadName): string {
  const [first, second] = coupleNames(couple, lead)
  return `${first.charAt(0)} & ${second.charAt(0)}`
}
