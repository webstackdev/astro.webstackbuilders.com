// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  $consent,
  $theme,
  $hasAnalyticsConsent,
  $hasFunctionalConsent,
  updateConsent,
  setTheme,
  initConsentFromCookies,
  allowAllConsent,
  revokeAllConsent,
  saveMastodonInstance,
  $mastodonInstances,
  cacheEmbed,
  getCachedEmbed,
} from '../index'
import * as cookieUtils from '../cookies'

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

describe('State Management', () => {
  beforeEach(() => {
    // Reset stores to default state
    $consent.set({
      necessary: true,
      analytics: false,
      advertising: false,
      functional: false,
    })
    $theme.set('default')
    $mastodonInstances.set(new Set())

    // Clear mocks
    vi.clearAllMocks()

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Consent Management', () => {
    it('should initialize with default consent state', () => {
      const consent = $consent.get()

      expect(consent.necessary).toBe(true)
      expect(consent.analytics).toBe(false)
      expect(consent.advertising).toBe(false)
      expect(consent.functional).toBe(false)
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

  describe('Theme Management', () => {
    it('should set theme when functional consent is granted', () => {
      updateConsent('functional', true)

      setTheme('dark')

      expect($theme.get()).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('"dark"')
    })

    it('should not persist theme when functional consent is denied', () => {
      updateConsent('functional', false)

      setTheme('dark')

      // Theme not persisted to store or localStorage
      expect($theme.get()).toBe('default') // Still default
      expect(localStorage.getItem('theme')).toBeNull()

      // But DOM should be updated
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('should update DOM attribute when theme changes via store subscription', () => {
      updateConsent('functional', true)

      // Manually call the side effect since it's not auto-initialized in tests
      $theme.subscribe(themeId => {
        document.documentElement.setAttribute('data-theme', themeId)
      })

      setTheme('holiday')

      expect(document.documentElement.getAttribute('data-theme')).toBe('holiday')
    })
  })

  describe('Mastodon Instance Management', () => {
    it('should save instance when functional consent is granted', () => {
      updateConsent('functional', true)

      saveMastodonInstance('mastodon.social')

      const instances = $mastodonInstances.get()
      expect(instances.has('mastodon.social')).toBe(true)
    })

    it('should not save instance when functional consent is denied', () => {
      updateConsent('functional', false)

      saveMastodonInstance('mastodon.social')

      const instances = $mastodonInstances.get()
      expect(instances.size).toBe(0)
    })

    it('should maintain max 5 instances (FIFO)', () => {
      updateConsent('functional', true)

      // Add 6 instances
      saveMastodonInstance('instance1.com')
      saveMastodonInstance('instance2.com')
      saveMastodonInstance('instance3.com')
      saveMastodonInstance('instance4.com')
      saveMastodonInstance('instance5.com')
      saveMastodonInstance('instance6.com')

      const instances = $mastodonInstances.get()
      expect(instances.size).toBe(5)
      expect(instances.has('instance6.com')).toBe(true) // Most recent
      expect(instances.has('instance1.com')).toBe(false) // Oldest removed
    })

    it('should place most recent instance first', () => {
      updateConsent('functional', true)

      saveMastodonInstance('first.com')
      saveMastodonInstance('second.com')

      const instances = [...$mastodonInstances.get()]
      expect(instances[0]).toBe('second.com')
      expect(instances[1]).toBe('first.com')
    })
  })

  describe('Embed Cache Management', () => {
    it('should cache embed when functional consent is granted', () => {
      updateConsent('functional', true)

      const mockData = { html: '<iframe>...</iframe>' }
      cacheEmbed('twitter_123', mockData, 3600000)

      const cached = getCachedEmbed('twitter_123')
      expect(cached).toEqual(mockData)
    })

    it('should not cache embed when functional consent is denied', () => {
      updateConsent('functional', false)

      const mockData = { html: '<iframe>...</iframe>' }
      cacheEmbed('twitter_123', mockData, 3600000)

      const cached = getCachedEmbed('twitter_123')
      expect(cached).toBeNull()
    })

    it('should return null for expired cache entries', () => {
      updateConsent('functional', true)

      const mockData = { html: '<iframe>...</iframe>' }
      const ttl = -1000 // Already expired (negative TTL)

      cacheEmbed('twitter_123', mockData, ttl)

      const cached = getCachedEmbed('twitter_123')
      expect(cached).toBeNull()
    })

    it('should return null when no consent', () => {
      updateConsent('functional', true)

      const mockData = { html: '<iframe>...</iframe>' }
      cacheEmbed('twitter_123', mockData, 3600000)

      // Revoke consent
      updateConsent('functional', false)

      const cached = getCachedEmbed('twitter_123')
      expect(cached).toBeNull()
    })
  })
})
