import { describe, expect, it } from 'vitest'

import { contactFormInputSchema } from '../domain'

describe('contact domain validation', () => {
  it('accepts valid timeline values', () => {
    const result = contactFormInputSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'This is a valid message with enough detail.',
      budget: '5k-10k',
      timeline: '2-3-months',
      consent: false,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid timeline values', () => {
    const result = contactFormInputSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'This is a valid message with enough detail.',
      budget: '5k-10k',
      timeline: 'tomorrow',
      consent: false,
    })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected schema validation to fail')
    }
    expect(result.error.flatten().fieldErrors['timeline']).toContain('Invalid project timeline')
  })

  it('rejects messages that appear to contain spam', () => {
    const result = contactFormInputSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'This message mentions viagra and should be blocked.',
      budget: '5k-10k',
      consent: false,
    })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected schema validation to fail')
    }
    expect(result.error.flatten().fieldErrors['message']).toContain('Message appears to contain spam')
  })
})
