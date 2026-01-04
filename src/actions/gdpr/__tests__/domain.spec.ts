import { describe, expect, it } from 'vitest'

import {
  consentCreateSchema,
  consentDeleteSchema,
  consentListSchema,
  dsarRequestSchema,
} from '../domain'

describe('gdpr domain schemas', () => {
  it('consentListSchema requires DataSubjectId', () => {
    const result = consentListSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('consentListSchema accepts optional purpose', () => {
    const result = consentListSchema.safeParse({ DataSubjectId: 'abc', purpose: 'contact' })
    expect(result.success).toBe(true)
  })

  it('consentDeleteSchema requires DataSubjectId', () => {
    const result = consentDeleteSchema.safeParse({ DataSubjectId: '' })
    expect(result.success).toBe(false)
  })

  it('dsarRequestSchema enforces requestType enum', () => {
    expect(
      dsarRequestSchema.safeParse({ email: 'test@example.com', requestType: 'ACCESS' }).success
    ).toBe(true)

    expect(
      dsarRequestSchema.safeParse({ email: 'test@example.com', requestType: 'NOPE' }).success
    ).toBe(false)
  })

  it('consentCreateSchema passes through values (typed boundary)', () => {
    const input = {
      DataSubjectId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      purposes: ['contact'],
      source: 'contact_form',
      userAgent: 'UA',
      ipAddress: '127.0.0.1',
      consentText: null,
      verified: true,
    }

    expect(consentCreateSchema.parse(input)).toEqual(input)
  })
})
