import { describe, expect, it } from 'vitest'

import { validateInput } from '../domain'

describe('contact domain validation', () => {
  it('accepts valid timeline values', () => {
    const errors = validateInput({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'This is a valid message with enough detail.',
      timeline: '2-3-months',
      consent: false,
    })

    expect(errors).toEqual([])
  })

  it('rejects invalid timeline values', () => {
    const errors = validateInput({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'This is a valid message with enough detail.',
      // @ts-expect-error testing invalid value
      timeline: 'tomorrow',
      consent: false,
    })

    expect(errors).toContain('Invalid project timeline')
  })
})
