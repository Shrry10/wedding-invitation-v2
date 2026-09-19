/**
 * How many panels may animate at once.
 *
 * Two, because at a seam exactly two panels are in motion — the one leaving and
 * the one arriving. A third would mean the journey had got ahead of the guest.
 */
export const MAX_CONCURRENT_PANELS = 2

type Waiter = () => void

let held = 0
const waiting: Waiter[] = []

/**
 * A page-wide counter, not React context.
 *
 * It changes on animation boundaries; putting it in context would re-render
 * every panel each time a slot moved.
 */
export const panelSlots = {
  /** Takes a slot if one is free. Returns whether it succeeded. */
  acquire(): boolean {
    if (held >= MAX_CONCURRENT_PANELS) return false
    held += 1
    return true
  },

  /** Returns a slot and wakes the longest-waiting panel, if any. */
  release(): void {
    if (held > 0) held -= 1
    const next = waiting.shift()
    if (next !== undefined) next()
  },

  /** Registers interest in the next free slot. Returns an unsubscribe. */
  waitForSlot(waiter: Waiter): () => void {
    waiting.push(waiter)
    return () => {
      const index = waiting.indexOf(waiter)
      if (index >= 0) waiting.splice(index, 1)
    }
  },

  /** Test seam only. */
  reset(): void {
    held = 0
    waiting.length = 0
  },

  get inUse(): number {
    return held
  },
}
