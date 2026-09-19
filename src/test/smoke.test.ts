import { describe, expect, it } from 'vitest'

describe('test runner', () => {
  it('executes a passing assertion', () => {
    expect(1 + 1).toBe(2)
  })
})
