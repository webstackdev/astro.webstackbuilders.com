// @vitest-environment happy-dom
/**
 * Unit tests for cookie consent state management
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  $consent,
  $hasAnalyticsConsent,
  $hasFunctionalConsent,
  updateConsent,
  initConsentFromCookies,
  allowAllConsent,
  revokeAllConsent,
} from '../cookieConsent'
import * as cookieUtils from '@components/Scripts/utils/cookies'

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

describe('Cookie Consent Management', () => {
  beforeEach(() => {
    // Reset stores to default state
    $consent.set({
      necessary: true,
      analytics: false,
      advertising: false,
      functional: false,
    })

    // Clear mocks
    vi.clearAllMocks()

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Consent State', () => {
    it('should initialize with default consent state', () => {
      const consent = $consent.get()

      expect(consent.necessary).toBe(true)
      expect(consent.analytics).toBe(false)
      expect(consent.advertising).toBe(false)
      expect(consent.functional).toBe(true) // Defaults to true for functional storage
    })

    it('should initialize consent from cookies', () => {
      const getCookieSpy = vi.spyOn(cookieUtils, 'getCookie')
      getCookieSpy.mockImplementation((name: string) => {
        if (name === 'consent_analytics') return 'true'
        if (name === 'consent_functional') return 'true'
        return undefined
      })

      initConsentFromCookies()

      const consent = $consent.get()
      expect(consent.analytics).toBe(true)
      expect(consent.functional).toBe(true)
      expect(consent.advertising).toBe(false)
    })

    it('should update consent and set cookie', () => {
      const setCookieSpy = vi.spyOn(cookieUtils, 'setCookie')

      updateConsent('analytics', true)

      const consent = $consent.get()
      expect(consent.analytics).toBe(true)
      expect(setCookieSpy).toHaveBeenCalledWith(
        'consent_analytics',
        'true',
        expect.objectContaining({ expires: 365, sameSite: 'strict' })
      )
    })

    it('should set timestamp when updating consent', () => {
      updateConsent('analytics', true)

      const consent = $consent.get()
      expect(consent.timestamp).toBeDefined()
      expect(consent.timestamp!).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should allow all consent categories', () => {
      const setCookieSpy = vi.spyOn(cookieUtils, 'setCookie')

      allowAllConsent()

      const consent = $consent.get()
      expect(consent.necessary).toBe(true)
      expect(consent.analytics).toBe(true)
      expect(consent.advertising).toBe(true)
      expect(consent.functional).toBe(true)
      expect(setCookieSpy).toHaveBeenCalledTimes(4) // All 4 categories
    })

    it('should revoke all non-necessary consent', () => {
      // First grant all
      allowAllConsent()

      // Then revoke
      revokeAllConsent()

      const consent = $consent.get()
      expect(consent.necessary).toBe(true) // Still true
      expect(consent.analytics).toBe(false)
      expect(consent.advertising).toBe(false)
      expect(consent.functional).toBe(false)
    })
  })

  describe('Computed Consent Stores', () => {
    it('should compute hasAnalyticsConsent', () => {
      expect($hasAnalyticsConsent.get()).toBe(false)

      updateConsent('analytics', true)

      expect($hasAnalyticsConsent.get()).toBe(true)
    })

    it('should compute hasFunctionalConsent', () => {
      expect($hasFunctionalConsent.get()).toBe(false)

      updateConsent('functional', true)

      expect($hasFunctionalConsent.get()).toBe(true)
    })

    it('should trigger subscription when consent changes', () => {
      const callback = vi.fn()

      // Subscribe BEFORE making changes
      const unsubscribe = $hasAnalyticsConsent.subscribe(callback)

      // Clear the initial subscription call
      callback.mockClear()

      // Now update consent
      updateConsent('analytics', true)

      // Should be called with true as first argument (nanostores passes additional args)
      expect(callback).toHaveBeenCalled()
      expect(callback.mock.calls[0]?.[0]).toBe(true)

      unsubscribe()
    })
  })
})
