import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FactValue } from './FactValue'
import { PENDING } from '../../data/types'

describe('FactValue', () => {
  it('renders a known value unchanged', () => {
    render(<FactValue value="Suraj Palace" />)
    expect(screen.getByText('Suraj Palace')).toBeInTheDocument()
  })

  it('renders a visible marker when the value is not yet known', () => {
    render(<FactValue value={PENDING} />)
    expect(screen.getByText('To be confirmed', { selector: '[aria-hidden="true"]' })).toBeVisible()
  })

  it('renders a visible marker when the value is absent', () => {
    render(<FactValue value={undefined} />)
    expect(screen.getByText('To be confirmed', { selector: '[aria-hidden="true"]' })).toBeVisible()
  })

  it('names the fact for assistive technology when a label is given', () => {
    render(<FactValue value={PENDING} label="Start time" />)
    expect(screen.getByText('Start time to be confirmed')).toBeInTheDocument()
  })

  it('renders an empty string as a real value rather than as pending', () => {
    const { container } = render(<FactValue value="" />)
    expect(container.textContent).toBe('')
  })

  it('never renders nothing at all for a pending value', () => {
    const { container } = render(<FactValue value={PENDING} />)
    expect(container.textContent?.length).toBeGreaterThan(0)
  })
})
