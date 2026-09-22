import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePress } from './usePress'

/**
 * The thing worth checking is that the action runs exactly once per press,
 * whichever way the press arrived. A pointer produces `pointerdown` and then
 * `click`; a keyboard produces the click alone.
 */
function Switch({ onPress }: { onPress: () => void }) {
  return (
    <button type="button" {...usePress(onPress)}>
      Play
    </button>
  )
}

/** One tap, as a browser delivers it: down, then the click on the way up. */
function tap(button: HTMLElement) {
  fireEvent.pointerDown(button, { button: 0 })
  fireEvent.click(button, { detail: 1 })
}

describe('usePress', () => {
  it('runs on the way down, not on the click that follows', () => {
    const onPress = vi.fn()
    render(<Switch onPress={onPress} />)
    const button = screen.getByRole('button')

    fireEvent.pointerDown(button, { button: 0 })
    expect(onPress).toHaveBeenCalledTimes(1)

    fireEvent.click(button, { detail: 1 })
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('runs once for a whole tap', () => {
    const onPress = vi.fn()
    render(<Switch onPress={onPress} />)

    tap(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('runs for a keyboard press, which has no pointer behind it', () => {
    const onPress = vi.fn()
    render(<Switch onPress={onPress} />)

    // Enter and Space on a button produce a click and nothing else.
    fireEvent.click(screen.getByRole('button'), { detail: 0 })
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('runs once even where a tap sends its click with no click count', () => {
    const onPress = vi.fn()
    render(<Switch onPress={onPress} />)
    const button = screen.getByRole('button')

    fireEvent.pointerDown(button, { button: 0 })
    fireEvent.click(button, { detail: 0 })
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('leaves the right mouse button alone, so a context menu is just a menu', () => {
    const onPress = vi.fn()
    render(<Switch onPress={onPress} />)

    fireEvent.pointerDown(screen.getByRole('button'), { button: 2 })
    expect(onPress).not.toHaveBeenCalled()
  })
})
