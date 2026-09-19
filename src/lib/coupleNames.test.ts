import { describe, expect, it } from 'vitest'
import type { Couple } from '../data/types'
import { coupleInitials, coupleMonogram, coupleNames } from './coupleNames'

const couple: Couple = {
  brideName: 'Bhavna',
  groomName: 'Sreetam',
  leadName: 'groom',
  hashtag: '#x',
}

describe('coupleNames', () => {
  it('follows the content’s lead by default', () => {
    expect(coupleNames(couple)).toEqual(['Sreetam', 'Bhavna'])
    expect(coupleNames({ ...couple, leadName: 'bride' })).toEqual(['Bhavna', 'Sreetam'])
  })

  it('follows an explicit lead over the content’s', () => {
    expect(coupleNames(couple, 'bride')).toEqual(['Bhavna', 'Sreetam'])
  })
})

describe('initials', () => {
  it('keep the order of the names', () => {
    expect(coupleInitials(couple)).toBe('SB')
    expect(coupleInitials(couple, 'bride')).toBe('BS')
    expect(coupleMonogram(couple, 'bride')).toBe('B & S')
  })
})
