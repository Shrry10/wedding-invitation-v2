import { describe, expect, it } from 'vitest'
import type { Couple } from './data/types'
import {
  allRoutes,
  orderSegment,
  pageFromHash,
  pathForRoute,
  routeFromPath,
  stripBase,
  withBase,
} from './routes'

const couple: Couple = {
  brideName: 'Bhavna',
  groomName: 'Sreetam',
  leadName: 'groom',
  hashtag: '#x',
}

describe('orderSegment', () => {
  it('joins both names, leading name first, in lower case', () => {
    expect(orderSegment(couple, 'groom')).toBe('sreetamandbhavna')
    expect(orderSegment(couple, 'bride')).toBe('bhavnaandsreetam')
  })

  it('drops anything that is not a letter or digit', () => {
    expect(orderSegment({ ...couple, brideName: 'Anne-Marie Ó' }, 'bride')).toBe(
      'annemarieandsreetam',
    )
  })
})

describe('routeFromPath', () => {
  it('reads the root as the envelope in the default order', () => {
    expect(routeFromPath('/', couple)).toEqual({ page: 'envelope', lead: undefined })
  })

  it('reads a page with no order', () => {
    expect(routeFromPath('/home/', couple)).toEqual({ page: 'home', lead: undefined })
  })

  it('reads the order segment and the page after it', () => {
    expect(routeFromPath('/bhavnaandsreetam/home', couple)).toEqual({ page: 'home', lead: 'bride' })
    expect(routeFromPath('/sreetamandbhavna/story/', couple)).toEqual({
      page: 'story',
      lead: 'groom',
    })
  })

  it('reads an order segment on its own as that order’s envelope', () => {
    expect(routeFromPath('/bhavnaandsreetam/', couple)).toEqual({
      page: 'envelope',
      lead: 'bride',
    })
  })

  it('ignores case', () => {
    expect(routeFromPath('/BhavnaAndSreetam/Details/', couple)).toEqual({
      page: 'details',
      lead: 'bride',
    })
  })

  it('falls back to the default for anything it does not understand', () => {
    expect(routeFromPath('/nobody/home/', couple)).toEqual({ page: 'envelope', lead: undefined })
    expect(routeFromPath('/bhavnaandsreetam/nowhere/', couple)).toEqual({
      page: 'envelope',
      lead: 'bride',
    })
  })
})

describe('pathForRoute', () => {
  it('puts the envelope at the root of its order', () => {
    expect(pathForRoute({ page: 'envelope', lead: undefined }, couple)).toBe('/')
    expect(pathForRoute({ page: 'envelope', lead: 'bride' }, couple)).toBe('/bhavnaandsreetam/')
  })

  it('ends every page in a slash', () => {
    expect(pathForRoute({ page: 'home', lead: undefined }, couple)).toBe('/home/')
    expect(pathForRoute({ page: 'story', lead: 'groom' }, couple)).toBe('/sreetamandbhavna/story/')
  })

  it('reads back every route it writes', () => {
    for (const route of allRoutes()) {
      expect(routeFromPath(pathForRoute(route, couple), couple)).toEqual(route)
    }
  })
})

describe('allRoutes', () => {
  it('has every page in every order, each at its own path', () => {
    const paths = allRoutes().map((route) => pathForRoute(route, couple))
    expect(paths).toHaveLength(12)
    expect(new Set(paths).size).toBe(12)
  })
})

describe('pageFromHash', () => {
  it('reads an old-style hash address', () => {
    expect(pageFromHash('#/details')).toBe('details')
  })

  it('returns nothing for an empty or unknown hash', () => {
    expect(pageFromHash('')).toBeUndefined()
    expect(pageFromHash('#main')).toBeUndefined()
  })
})

describe('stripBase / withBase', () => {
  it('leaves paths alone at the root base', () => {
    expect(stripBase('/home/', '/')).toBe('/home/')
    expect(withBase('/home/', '/')).toBe('/home/')
  })

  it('takes off and puts back a sub-path base', () => {
    expect(stripBase('/wedding/home/', '/wedding/')).toBe('/home/')
    expect(stripBase('/wedding', '/wedding/')).toBe('/')
    expect(withBase('/home/', '/wedding/')).toBe('/wedding/home/')
  })
})
