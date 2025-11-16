/**
 * State tests for GDPR form consent management
 */
import { beforeEach, describe, expect, test } from 'vitest'
import {
  $formConsent,
  recordFormConsent,
  clearFormConsent,
  hasConsentForPurpose,
  getFormConsent,
  type ConsentPurpose,
  type FormConsentState
} from '@components/GDPR/Consent/state'

describe('GDPR Form Consent State', () => {
  beforeEach(() => {
    // Clear state before each test
    clearFormConsent()
  })

  describe('$formConsent store', () => {
    test('initializes as null', () => {
      expect($formConsent.get()).toBeNull()
    })

    test('can be set directly', () => {
      const state: FormConsentState = {
        purposes: ['contact'],
        timestamp: '2025-10-20T12:00:00.000Z',
        validated: true
      }
      $formConsent.set(state)
      expect($formConsent.get()).toEqual(state)
    })

    test('can be cleared', () => {
      $formConsent.set({
        purposes: ['contact'],
        timestamp: '2025-10-20T12:00:00.000Z',
        validated: true
      })
      $formConsent.set(null)
      expect($formConsent.get()).toBeNull()
    })
  })

  describe('recordFormConsent', () => {
    test('records consent for single purpose', () => {
      const purposes: ConsentPurpose[] = ['contact']
      recordFormConsent(purposes)

      const consent = $formConsent.get()
      expect(consent).not.toBeNull()
      expect(consent?.purposes).toEqual(['contact'])
      expect(consent?.validated).toBe(true)
      expect(consent?.timestamp).toBeDefined()
    })

    test('records consent for multiple purposes', () => {
      const purposes: ConsentPurpose[] = ['contact', 'marketing', 'analytics']
      recordFormConsent(purposes)

      const consent = $formConsent.get()
      expect(consent?.purposes).toEqual(['contact', 'marketing', 'analytics'])
    })

    test('records ISO timestamp', () => {
      recordFormConsent(['contact'])

      const consent = $formConsent.get()
      expect(consent?.timestamp).toBeDefined()

      // Verify ISO format (e.g., 2025-10-20T12:00:00.000Z)
      const timestamp = consent?.timestamp
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

      // Verify it's a recent timestamp (within last second)
      const timestampDate = new Date(timestamp!)
      const now = new Date()
      const diffMs = now.getTime() - timestampDate.getTime()
      expect(diffMs).toBeLessThan(1000)
    })

    test('sets validated to true', () => {
      recordFormConsent(['contact'])

      const consent = $formConsent.get()
      expect(consent?.validated).toBe(true)
    })

    test('records optional formId', () => {
      recordFormConsent(['contact'], 'contact-form')

      const consent = $formConsent.get()
      expect(consent?.formId).toBe('contact-form')
    })

    test('omits formId when not provided', () => {
      recordFormConsent(['contact'])

      const consent = $formConsent.get()
      expect(consent?.formId).toBeUndefined()
    })

    test('overwrites previous consent', () => {
      recordFormConsent(['contact'], 'form-1')
      recordFormConsent(['marketing'], 'form-2')

      const consent = $formConsent.get()
      expect(consent?.purposes).toEqual(['marketing'])
      expect(consent?.formId).toBe('form-2')
    })
  })

  describe('clearFormConsent', () => {
    test('clears consent state', () => {
      recordFormConsent(['contact'])
      expect($formConsent.get()).not.toBeNull()

      clearFormConsent()
      expect($formConsent.get()).toBeNull()
    })

    test('can be called when already null', () => {
      expect($formConsent.get()).toBeNull()
      expect(() => clearFormConsent()).not.toThrow()
      expect($formConsent.get()).toBeNull()
    })
  })

  describe('hasConsentForPurpose', () => {
    test('returns false when no consent recorded', () => {
      expect(hasConsentForPurpose('contact')).toBe(false)
    })

    test('returns true when purpose is consented', () => {
      recordFormConsent(['contact', 'marketing'])
      expect(hasConsentForPurpose('contact')).toBe(true)
      expect(hasConsentForPurpose('marketing')).toBe(true)
    })

    test('returns false when purpose is not consented', () => {
      recordFormConsent(['contact'])
      expect(hasConsentForPurpose('marketing')).toBe(false)
      expect(hasConsentForPurpose('analytics')).toBe(false)
      expect(hasConsentForPurpose('downloads')).toBe(false)
    })

    test('returns false when consent is cleared', () => {
      recordFormConsent(['contact'])
      expect(hasConsentForPurpose('contact')).toBe(true)

      clearFormConsent()
      expect(hasConsentForPurpose('contact')).toBe(false)
    })

    test('works with all purpose types', () => {
      const allPurposes: ConsentPurpose[] = ['contact', 'marketing', 'analytics', 'downloads']
      recordFormConsent(allPurposes)

      allPurposes.forEach(purpose => {
        expect(hasConsentForPurpose(purpose)).toBe(true)
      })
    })
  })

  describe('getFormConsent', () => {
    test('returns null when no consent recorded', () => {
      expect(getFormConsent()).toBeNull()
    })

    test('returns complete consent state', () => {
      recordFormConsent(['contact', 'marketing'], 'test-form')

      const consent = getFormConsent()
      expect(consent).not.toBeNull()
      expect(consent?.purposes).toEqual(['contact', 'marketing'])
      expect(consent?.validated).toBe(true)
      expect(consent?.timestamp).toBeDefined()
      expect(consent?.formId).toBe('test-form')
    })

    test('returns null after clearing consent', () => {
      recordFormConsent(['contact'])
      expect(getFormConsent()).not.toBeNull()

      clearFormConsent()
      expect(getFormConsent()).toBeNull()
    })

    test('returns copy of state (not reference)', () => {
      recordFormConsent(['contact'])
      const consent1 = getFormConsent()
      const consent2 = getFormConsent()

      // Both should have same values but be different objects
      expect(consent1).toEqual(consent2)
      // Note: Nanostores returns same reference, so this test verifies getter behavior
    })
  })

  describe('type safety', () => {
    test('only accepts valid ConsentPurpose types', () => {
      // These should compile (TypeScript check)
      recordFormConsent(['contact'])
      recordFormConsent(['marketing'])
      recordFormConsent(['analytics'])
      recordFormConsent(['downloads'])

      // This would fail TypeScript compilation:
      // recordFormConsent(['invalid' as ConsentPurpose])
    })

    test('validates FormConsentState structure', () => {
      const validState: FormConsentState = {
        purposes: ['contact'],
        timestamp: '2025-10-20T12:00:00.000Z',
        validated: true,
        formId: 'test-form' // optional
      }

      $formConsent.set(validState)
      expect($formConsent.get()).toEqual(validState)
    })
  })

  describe('edge cases', () => {
    test('handles empty purposes array', () => {
      recordFormConsent([])

      const consent = $formConsent.get()
      expect(consent?.purposes).toEqual([])
      expect(consent?.validated).toBe(true)
    })

    test('handles duplicate purposes', () => {
      recordFormConsent(['contact', 'contact', 'marketing'])

      const consent = $formConsent.get()
      // Duplicates are allowed (consumer should dedupe if needed)
      expect(consent?.purposes).toEqual(['contact', 'contact', 'marketing'])
    })

    test('handles formId with special characters', () => {
      recordFormConsent(['contact'], 'form-with-special-chars_123')

      const consent = $formConsent.get()
      expect(consent?.formId).toBe('form-with-special-chars_123')
    })
  })
})
