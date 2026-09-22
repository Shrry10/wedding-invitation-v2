import { act, fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

/** Every place a name is set, in document order. */
function namesIn(markup: string): string[] {
  return [...markup.matchAll(/Sreetam|Bhavna/g)].map((match) => match[0])
}

describe('the order of the names', () => {
  it.each([
    ['/', 'Sreetam'],
    ['/sreetamandbhavna/', 'Sreetam'],
    ['/bhavnaandsreetam/', 'Bhavna'],
  ])('%s leads with %s on every page', (prefix, leader) => {
    for (const page of ['', 'home/', 'details/', 'story/']) {
      const markup = renderToString(<App path={`${prefix}${page}`} />)
      const found = namesIn(markup)
      // The details page names no one; every page that does leads with the chosen name.
      if (found.length === 0) continue
      expect(found.length % 2, `${prefix}${page}`).toBe(0)
      for (let i = 0; i < found.length; i += 2) {
        expect(found[i], `${prefix}${page}, name ${i}`).toBe(leader)
      }
    }
  })

  it('strikes the seal’s initials in the same order', () => {
    // The seal strikes the pair as outlines, and strikes the pair twice over:
    // a shadow copy and a lit one. So the letters come out of the markup in
    // repeating pairs, and it is the pair that carries the order.
    const seal = (markup: string) => {
      const letters = [...markup.matchAll(/data-letter="([BS])"/g)].map((match) => match[1])
      expect(letters.length % 2).toBe(0)
      const pairs = new Set<string>()
      for (let i = 0; i < letters.length; i += 2) pairs.add(`${letters[i]}${letters[i + 1]}`)
      return [...pairs]
    }
    expect(seal(renderToString(<App path="/bhavnaandsreetam/" />))).toEqual(['BS'])
    expect(seal(renderToString(<App path="/" />))).toEqual(['SB'])
  })

  it('shows the pair on the home page’s invitation card in the chosen order', () => {
    const markup = renderToString(<App path="/bhavnaandsreetam/home/" />)
    expect(markup).toMatch(/card__name">Bhavna<.*card__name">Sreetam</s)
  })
})

describe('navigation', () => {
  afterEach(() => {
    vi.useRealTimers()
    window.history.replaceState(null, '', '/')
  })

  it('keeps the order in the address when the envelope is opened', () => {
    vi.useFakeTimers()
    window.history.replaceState(null, '', '/bhavnaandsreetam/')
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /open the invitation from bhavna/i }))
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(window.location.pathname).toBe('/bhavnaandsreetam/home/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Bhavna.*Sreetam$/)
  })

  it('follows the back button', () => {
    window.history.replaceState(null, '', '/bhavnaandsreetam/story/')
    render(<App />)
    expect(screen.getByText('Bhavna & Sreetam')).toBeInTheDocument()

    act(() => {
      window.history.pushState(null, '', '/home/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Sreetam.*Bhavna$/)
  })

  it('still opens an old #/home address', () => {
    window.history.replaceState(null, '', '/#/home')
    render(<App />)
    expect(screen.getByText('Countdown')).toBeInTheDocument()
  })
})
