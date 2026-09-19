import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useFocusTrap } from './useFocusTrap'

function buildDialog() {
  const outside = document.createElement('button')
  outside.textContent = 'outside'
  document.body.append(outside)

  const container = document.createElement('div')
  for (const label of ['first', 'middle', 'last']) {
    const button = document.createElement('button')
    button.textContent = label
    container.append(button)
  }
  document.body.append(container)

  return {
    outside,
    container,
    buttons: [...container.querySelectorAll('button')],
  }
}

function pressTab(shiftKey = false) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true }))
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useFocusTrap', () => {
  it('moves focus into the container when it becomes active', () => {
    const { container, buttons, outside } = buildDialog()
    outside.focus()

    const hook = renderHook(({ active }) => useFocusTrap<HTMLDivElement>(active), {
      initialProps: { active: false },
    })
    hook.result.current.current = container
    hook.rerender({ active: true })

    expect(document.activeElement).toBe(buttons[0])
  })

  it('wraps forward from the last focusable to the first', () => {
    const { container, buttons } = buildDialog()
    const hook = renderHook(({ active }) => useFocusTrap<HTMLDivElement>(active), {
      initialProps: { active: false },
    })
    hook.result.current.current = container
    hook.rerender({ active: true })

    buttons[2]!.focus()
    act(() => pressTab())
    expect(document.activeElement).toBe(buttons[0])
  })

  it('wraps backward from the first focusable to the last', () => {
    const { container, buttons } = buildDialog()
    const hook = renderHook(({ active }) => useFocusTrap<HTMLDivElement>(active), {
      initialProps: { active: false },
    })
    hook.result.current.current = container
    hook.rerender({ active: true })

    buttons[0]!.focus()
    act(() => pressTab(true))
    expect(document.activeElement).toBe(buttons[2])
  })

  it('leaves focus alone in the middle of the container', () => {
    const { container, buttons } = buildDialog()
    const hook = renderHook(({ active }) => useFocusTrap<HTMLDivElement>(active), {
      initialProps: { active: false },
    })
    hook.result.current.current = container
    hook.rerender({ active: true })

    buttons[1]!.focus()
    act(() => pressTab())
    expect(document.activeElement).toBe(buttons[1])
  })

  it('returns focus to where it came from on release', () => {
    const { container, outside } = buildDialog()
    outside.focus()
    expect(document.activeElement).toBe(outside)

    const hook = renderHook(({ active }) => useFocusTrap<HTMLDivElement>(active), {
      initialProps: { active: false },
    })
    hook.result.current.current = container
    hook.rerender({ active: true })
    hook.rerender({ active: false })

    expect(document.activeElement).toBe(outside)
  })
})
