import { describe, expect, it, vi } from 'vitest'

import { ActionsFunctionError } from '@actions/utils/errors/ActionsFunctionError'
import { generateConfirmationToken, validateEmail } from '../utils'

describe('newsletter utils', () => {
  describe('validateEmail', () => {
    it('throws when email is missing', () => {
      expect(() => validateEmail('')).toThrow(ActionsFunctionError)
    })

    it('throws when email is too long', () => {
      const tooLong = `${'a'.repeat(255)}@example.com`
      expect(() => validateEmail(tooLong)).toThrow(ActionsFunctionError)
    })

    it('throws when email is invalid', () => {
      expect(() => validateEmail('not-an-email')).toThrow(ActionsFunctionError)
    })

    it('rejects leading/trailing whitespace (validation happens before trimming)', () => {
      expect(() => validateEmail(' TEST@Example.com ')).toThrow(ActionsFunctionError)
    })

    it('normalizes a valid email (lowercase)', () => {
      expect(validateEmail('TEST@Example.com')).toBe('test@example.com')
    })
  })

  describe('generateConfirmationToken', () => {
    it('returns a URL-safe base64 token without padding', () => {
      const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto
      const existingCrypto = cryptoObj ?? ((globalThis as any).crypto = {} as Crypto)
      const originalGetRandomValues = existingCrypto.getRandomValues

      const getRandomValues = vi.fn(<T extends ArrayBufferView>(array: T): T => {
        const bytes = new Uint8Array(array.buffer)
        bytes.fill(0)
        return array
      })

      existingCrypto.getRandomValues = getRandomValues

      const token = generateConfirmationToken()

      expect(token.length).toBeGreaterThan(0)
      expect(token).not.toContain('=')
      expect(token).not.toContain('+')
      expect(token).not.toContain('/')
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/)

      // restore
      if (originalGetRandomValues) {
        existingCrypto.getRandomValues = originalGetRandomValues
      }
    })
  })
})
