import { describe, expect, it } from 'vitest'
import { isPending, knownValue } from './isPending'
import { PENDING } from '../data/types'

describe('isPending', () => {
  it('recognises the sentinel', () => {
    expect(isPending(PENDING)).toBe(true)
  })

  it('treats an empty string as a real value', () => {
    expect(isPending('')).toBe(false)
  })

  it('treats zero as a real value', () => {
    expect(isPending(0)).toBe(false)
  })

  it('treats an ordinary string as a real value', () => {
    expect(isPending('Suraj Palace')).toBe(false)
  })

  it('treats null as a real value rather than pending', () => {
    expect(isPending(null as unknown as string)).toBe(false)
  })

  it('treats undefined as not pending', () => {
    expect(isPending(undefined)).toBe(false)
  })

  it('does not match a string that merely contains the sentinel', () => {
    expect(isPending('TBD soon')).toBe(false)
  })
})

describe('knownValue', () => {
  it('returns the value when it is known', () => {
    expect(knownValue('Aura Lawns')).toBe('Aura Lawns')
  })

  it('returns undefined for the sentinel', () => {
    expect(knownValue(PENDING)).toBeUndefined()
  })

  it('returns undefined for an absent value', () => {
    expect(knownValue(undefined)).toBeUndefined()
  })

  it('preserves an empty string rather than collapsing it', () => {
    expect(knownValue('')).toBe('')
  })
})
