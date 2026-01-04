import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SOURCE,
  DEFAULT_USER_AGENT,
  isConsentPurpose,
  isConsentSource,
  normalizeNullableString,
  normalizeUserAgent,
  sanitizePurposes,
  sanitizeSource,
} from '../utils'

describe('gdpr utils', () => {
  describe('isConsentPurpose', () => {
    it('returns true only for allowed purposes', () => {
      expect(isConsentPurpose('contact')).toBe(true)
      expect(isConsentPurpose('downloads')).toBe(true)
      expect(isConsentPurpose('nope')).toBe(false)
      expect(isConsentPurpose(null)).toBe(false)
    })
  })

  describe('isConsentSource', () => {
    it('returns true only for allowed sources', () => {
      expect(isConsentSource('cookies_modal')).toBe(true)
      expect(isConsentSource('contact_form')).toBe(true)
      expect(isConsentSource('nope')).toBe(false)
      expect(isConsentSource(undefined)).toBe(false)
    })
  })

  describe('sanitizePurposes', () => {
    it('filters unknown purposes and returns an empty array for non-arrays', () => {
      expect(sanitizePurposes(['contact', 'nope', 'analytics'])).toEqual(['contact', 'analytics'])
      expect(sanitizePurposes('contact')).toEqual([])
      expect(sanitizePurposes(null)).toEqual([])
    })
  })

  describe('sanitizeSource', () => {
    it('returns default when invalid', () => {
      expect(sanitizeSource('nope')).toBe(DEFAULT_SOURCE)
      expect(sanitizeSource(null)).toBe(DEFAULT_SOURCE)
    })

    it('returns the provided source when valid', () => {
      expect(sanitizeSource('cookies_modal')).toBe('cookies_modal')
    })
  })

  describe('normalizeNullableString', () => {
    it('returns null for non-strings and whitespace-only strings', () => {
      expect(normalizeNullableString(undefined)).toBeNull()
      expect(normalizeNullableString(null)).toBeNull()
      expect(normalizeNullableString('   ')).toBeNull()
    })

    it('trims and returns the string when non-empty', () => {
      expect(normalizeNullableString('  ok ')).toBe('ok')
    })
  })

  describe('normalizeUserAgent', () => {
    it('returns default for missing/empty user agents', () => {
      expect(normalizeUserAgent(undefined)).toBe(DEFAULT_USER_AGENT)
      expect(normalizeUserAgent('   ')).toBe(DEFAULT_USER_AGENT)
    })

    it('returns trimmed user agent for provided values', () => {
      expect(normalizeUserAgent('  UA ')).toBe('UA')
    })
  })
})
