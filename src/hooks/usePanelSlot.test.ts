import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_CONCURRENT_PANELS, panelSlots } from './usePanelSlot'

beforeEach(() => panelSlots.reset())

describe('panel slots', () => {
  it('grants slots up to the cap', () => {
    expect(panelSlots.acquire()).toBe(true)
    expect(panelSlots.acquire()).toBe(true)
    expect(panelSlots.inUse).toBe(MAX_CONCURRENT_PANELS)
  })

  it('refuses a request beyond the cap', () => {
    panelSlots.acquire()
    panelSlots.acquire()
    expect(panelSlots.acquire()).toBe(false)
  })

  it('frees a slot on release', () => {
    panelSlots.acquire()
    panelSlots.acquire()
    panelSlots.release()
    expect(panelSlots.acquire()).toBe(true)
  })

  it('wakes a waiting panel when a slot frees', () => {
    panelSlots.acquire()
    panelSlots.acquire()
    const woken = vi.fn()
    panelSlots.waitForSlot(woken)
    expect(woken).not.toHaveBeenCalled()

    panelSlots.release()
    expect(woken).toHaveBeenCalledTimes(1)
  })

  it('wakes waiters in the order they arrived', () => {
    panelSlots.acquire()
    panelSlots.acquire()
    const order: string[] = []
    panelSlots.waitForSlot(() => order.push('first'))
    panelSlots.waitForSlot(() => order.push('second'))

    panelSlots.release()
    panelSlots.release()
    expect(order).toEqual(['first', 'second'])
  })

  it('forgets a waiter that unsubscribes', () => {
    panelSlots.acquire()
    panelSlots.acquire()
    const woken = vi.fn()
    const stopWaiting = panelSlots.waitForSlot(woken)
    stopWaiting()

    panelSlots.release()
    expect(woken).not.toHaveBeenCalled()
  })

  it('never drops below zero held', () => {
    panelSlots.release()
    panelSlots.release()
    expect(panelSlots.inUse).toBe(0)
  })
})
