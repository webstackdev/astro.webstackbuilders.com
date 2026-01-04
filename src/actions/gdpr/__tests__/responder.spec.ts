import { describe, expect, it, vi } from 'vitest'

vi.mock('@actions/utils/environment/environmentActions', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
  return {
    ...actual,
    getPrivacyPolicyVersion: () => 'test-privacy-policy-version',
  }
})

import { ActionsFunctionError } from '@actions/utils/errors'
import { buildRateLimitError, mapConsentRecord } from '../responder'

describe('gdpr responder', () => {
  describe('buildRateLimitError', () => {
    it('throws an ActionsFunctionError with status 429', () => {
      const reset = Date.now() + 10_000

      expect(() => buildRateLimitError(reset)).toThrow(ActionsFunctionError)

      try {
        buildRateLimitError(reset)
      } catch (error) {
        const typed = error as ActionsFunctionError
        expect(typed.status).toBe(429)
        expect(typed.message).toMatch(/Try again in/i)
      }
    })

    it('respects a custom message', () => {
      const reset = Date.now() + 1

      try {
        buildRateLimitError(reset, 'Custom message')
      } catch (error) {
        const typed = error as ActionsFunctionError
        expect(typed.status).toBe(429)
        expect(typed.message).toBe('Custom message')
      }
    })
  })

  describe('mapConsentRecord', () => {
    it('normalizes optional fields and converts dates to ISO', () => {
      const record = {
        id: 'rec_1',
        dataSubjectId: 'sub_1',
        purposes: ['contact', 'nope', 'analytics'],
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        source: 'cookies_modal',
        userAgent: '  UA  ',
        ipAddress: '   ',
        consentText: null,
        privacyPolicyVersion: null,
        verified: true,
        email: '  test@example.com  ',
      }

      const mapped = mapConsentRecord(record as any)

      expect(mapped.id).toBe('rec_1')
      expect(mapped.DataSubjectId).toBe('sub_1')
      expect(mapped.purposes).toEqual(['contact', 'analytics'])
      expect(mapped.timestamp).toBe('2025-01-01T00:00:00.000Z')
      expect(mapped.source).toBe('cookies_modal')
      expect(mapped.userAgent).toBe('UA')
      expect(mapped.verified).toBe(true)
      expect(mapped.email).toBe('test@example.com')

      // Optional fields should be omitted when empty/null.
      expect('ipAddress' in mapped).toBe(false)
      expect('consentText' in mapped).toBe(false)

      // privacyPolicyVersion falls back when missing.
      expect(mapped.privacyPolicyVersion).toBe('test-privacy-policy-version')
    })

    it('accepts createdAt as a string timestamp', () => {
      const record = {
        id: 'rec_2',
        dataSubjectId: 'sub_2',
        purposes: ['downloads'],
        createdAt: '2025-01-02T00:00:00.000Z',
        source: 'preferences_page',
        userAgent: null,
        ipAddress: '127.0.0.1',
        consentText: 'Ok',
        privacyPolicyVersion: 'v1',
        verified: false,
        email: null,
      }

      const mapped = mapConsentRecord(record as any)

      expect(mapped.timestamp).toBe('2025-01-02T00:00:00.000Z')
      expect(mapped.source).toBe('preferences_page')
      expect(mapped.userAgent).toBe('unknown')
      expect(mapped.ipAddress).toBe('127.0.0.1')
      expect(mapped.consentText).toBe('Ok')
      expect(mapped.privacyPolicyVersion).toBe('v1')
      expect(mapped.verified).toBe(false)
      expect('email' in mapped).toBe(false)
    })
  })
})
