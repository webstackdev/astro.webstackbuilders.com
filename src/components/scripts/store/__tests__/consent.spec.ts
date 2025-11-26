// @vitest-environment jsdom
/**
 * Unit tests for cookie consent state management
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { ConsentState } from '@components/scripts/store/consent'
import {
  $consent,
  $hasAnalyticsConsent,
  $hasFunctionalConsent,
  updateConsent,
  initConsentFromCookies,
  allowAllConsent,
  revokeAllConsent,
  ensureConsentCookiesInitialized,
  getFunctionalConsentPreference,
  subscribeToFunctionalConsent,
  initConsentCookies,
  allowAllConsentCookies,
  getConsentCookie,
  setConsentCookie,
  removeConsentCookies,
  getAnalyticsConsentPreference,
  initConsentSideEffects,
} from '@components/scripts/store/consent'
import { $isConsentBannerVisible } from '@components/scripts/store/visibility'

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

// Mock utils/cookies
vi.mock('@components/scripts/utils/cookies', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  removeCookie: vi.fn(),
  getAllCookies: vi.fn(),
}))

// Import mocked functions for spying
import { getCookie, removeCookie, setCookie } from '@components/scripts/utils/cookies'
import { deleteDataSubjectId } from '@components/scripts/utils/dataSubjectId'
import { updateConsentContext } from '@components/scripts/sentry/helpers'

vi.mock('@components/scripts/utils/dataSubjectId', () => ({
  getOrCreateDataSubjectId: vi.fn(() => 'data-subject-123'),
  deleteDataSubjectId: vi.fn(),
}))

vi.mock('@components/scripts/sentry/helpers', () => ({
  updateConsentContext: vi.fn(),
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  document.getElementById('consent-modal-id')?.remove()
})

describe('Cookie Consent Management', () => {
  beforeEach(() => {
    // Reset stores to default state
    $consent.set({
      analytics: false,
      marketing: false,
      functional: false,
      DataSubjectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Valid UUID format
    })

    // Clear mocks
    vi.clearAllMocks()

    // Clear localStorage
    localStorage.clear()
  })

  describe('Consent State', () => {
    it('should initialize with default consent state', () => {
      const consent = $consent.get()

      expect(consent.analytics).toBe(false)
      expect(consent.marketing).toBe(false)
      expect(consent.functional).toBe(false) // Defaults to false (opt-in for Mastodon instance storage)
    })

    it('should initialize consent from cookies', () => {
      vi.mocked(getCookie).mockImplementation((name: string) => {
        if (name === 'consent_analytics') return 'true'
        if (name === 'consent_functional') return 'true'
        return undefined
      })

      initConsentFromCookies()

      const consent = $consent.get()
      expect(consent.analytics).toBe(true)
      expect(consent.functional).toBe(true)
      expect(consent.marketing).toBe(false)
    })

    it('should update consent and set cookie', () => {
      updateConsent('analytics', true)

      const consent = $consent.get()
      expect(consent.analytics).toBe(true)
      expect(setCookie).toHaveBeenCalledWith(
        'consent_analytics',
        'true',
        expect.objectContaining({ expires: 365, sameSite: 'strict' })
      )
    })

    // @TODO: Add timestamp tracking when consent is updated (GDPR best practice)
    // This will be implemented during the consent system refactor

    it('should allow all consent categories', () => {
      allowAllConsent()

      const consent = $consent.get()
      expect(consent.analytics).toBe(true)
      expect(consent.marketing).toBe(true)
      expect(consent.functional).toBe(true)
      expect(setCookie).toHaveBeenCalledTimes(3) // 3 categories
    })

    it('should revoke all consent', () => {
      // First grant all
      allowAllConsent()

      // Then revoke
      revokeAllConsent()

      const consent = $consent.get()
      expect(consent.analytics).toBe(false)
      expect(consent.marketing).toBe(false)
      expect(consent.functional).toBe(false)
    })

    it('initializes consent cookies when missing', () => {
      vi.mocked(getCookie).mockReturnValue(undefined)

      const result = ensureConsentCookiesInitialized()

      expect(result).toBe(true)
      expect(setCookie).toHaveBeenCalledTimes(3)
      const expectedOptions = expect.objectContaining({ expires: 365, sameSite: 'strict' })

      expect(setCookie).toHaveBeenNthCalledWith(1, 'consent_analytics', 'false', expectedOptions)
      expect(setCookie).toHaveBeenNthCalledWith(2, 'consent_marketing', 'false', expectedOptions)
      expect(setCookie).toHaveBeenNthCalledWith(3, 'consent_functional', 'false', expectedOptions)
    })

    it('skips initialization when consent cookies already exist', () => {
      vi.mocked(getCookie).mockReturnValue('false')

      const result = ensureConsentCookiesInitialized()

      expect(result).toBe(false)
      expect(setCookie).not.toHaveBeenCalled()
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

  describe('Functional Consent Helpers', () => {
    it('reports the current functional consent preference', () => {
      expect(getFunctionalConsentPreference()).toBe(false)

      updateConsent('functional', true)

      expect(getFunctionalConsentPreference()).toBe(true)
    })

    it('subscribes to functional consent updates with immediate sync', () => {
      const listener = vi.fn()

      const unsubscribe = subscribeToFunctionalConsent(listener)

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener.mock.calls[0]?.[0]).toBe(false)

      listener.mockClear()
      updateConsent('functional', true)

      expect(listener.mock.calls[0]?.[0]).toBe(true)

      unsubscribe()
    })
  })

  describe('Analytics Consent Helpers', () => {
    it('reports the current analytics consent preference', () => {
      expect(getAnalyticsConsentPreference()).toBe(false)

      updateConsent('analytics', true)

      expect(getAnalyticsConsentPreference()).toBe(true)
    })
  })

  describe('Consent Cookie Helpers', () => {
    it('initializes consent cookies when analytics cookie is missing via initConsentCookies', () => {
      vi.mocked(getCookie).mockReturnValue(undefined)

      const result = initConsentCookies()

      expect(result).toBe(true)
      expect(setCookie).toHaveBeenCalledTimes(3)
    })

    it('grants all consent categories through allowAllConsentCookies', () => {
      allowAllConsentCookies()

      const consent = $consent.get()
      expect(consent.analytics).toBe(true)
      expect(consent.marketing).toBe(true)
      expect(consent.functional).toBe(true)
    })

    it('reads stored consent preferences with getConsentCookie', () => {
      vi.mocked(getCookie).mockImplementation((name: string) => {
        if (name === 'consent_analytics') return 'true'
        if (name === 'consent_functional') return 'false'
        return undefined
      })

      expect(getConsentCookie('functional')).toBe('false')
    })

    it('updates consent via setConsentCookie helper', () => {
      setConsentCookie('marketing', 'granted')

      const consent = $consent.get()
      expect(consent.marketing).toBe(true)
    })

    it('removes persisted consent cookies through removeConsentCookies', () => {
      removeConsentCookies()

      expect(removeCookie).toHaveBeenCalledTimes(3)
    })
  })
})

describe('Consent side effects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('syncs consent modal visibility with banner store updates', () => {
    const modal = document.createElement('div')
    modal.id = 'consent-modal-id'
    document.body.appendChild(modal)

    let visibilityListener: ((_visible: boolean) => void) | undefined
    vi.spyOn($isConsentBannerVisible, 'subscribe').mockImplementation((listener) => {
      visibilityListener = listener
      return () => {}
    })
    vi.spyOn($consent, 'subscribe').mockImplementation(() => () => {})
    vi.spyOn($hasFunctionalConsent, 'subscribe').mockImplementation(() => () => {})
    vi.spyOn($hasAnalyticsConsent, 'subscribe').mockImplementation(() => () => {})

    initConsentSideEffects()

    expect(visibilityListener).toBeDefined()

    visibilityListener?.(true)
    expect(modal.style.display).toBe('flex')

    visibilityListener?.(false)
    expect(modal.style.display).toBe('none')
  })

  it('logs consent updates via the GDPR API when preferences change', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchSpy)

    let consentListener:
      | ((_state: ConsentState, _oldState?: ConsentState) => Promise<void> | void)
      | undefined
    vi.spyOn($consent, 'subscribe').mockImplementation((listener) => {
      consentListener = listener
      return () => {}
    })
    vi.spyOn($isConsentBannerVisible, 'subscribe').mockImplementation(() => () => {})
    vi.spyOn($hasFunctionalConsent, 'subscribe').mockImplementation(() => () => {})
    vi.spyOn($hasAnalyticsConsent, 'subscribe').mockImplementation(() => () => {})

    initConsentSideEffects()

    const oldState = {
      analytics: false,
      marketing: false,
      functional: false,
      DataSubjectId: 'subject-123',
    }
    const newState = {
      analytics: true,
      marketing: false,
      functional: false,
      DataSubjectId: 'subject-123',
    }

    await consentListener?.(newState, oldState)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('/api/gdpr/consent')
    expect(options?.method).toBe('POST')
    const payload = JSON.parse(options?.body as string)
    expect(payload).toMatchObject({
      DataSubjectId: 'subject-123',
      purposes: ['analytics'],
      source: 'cookies_modal',
      verified: false,
    })

    await consentListener?.(newState, undefined)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('deletes the data subject id when functional consent is revoked', () => {
    let functionalListener: ((_hasConsent: boolean) => void) | undefined
    vi.spyOn($hasFunctionalConsent, 'subscribe').mockImplementation((listener) => {
      functionalListener = listener
      return () => {}
    })
    vi.spyOn($isConsentBannerVisible, 'subscribe').mockImplementation(() => () => {})
    vi.spyOn($consent, 'subscribe').mockImplementation(() => () => {})
    vi.spyOn($hasAnalyticsConsent, 'subscribe').mockImplementation(() => () => {})

    initConsentSideEffects()

    expect(functionalListener).toBeDefined()

    functionalListener?.(true)
    expect(deleteDataSubjectId).not.toHaveBeenCalled()

    functionalListener?.(false)
    expect(deleteDataSubjectId).toHaveBeenCalledTimes(1)
  })

  it('updates the Sentry consent context when analytics consent changes', async () => {
    let analyticsListener: ((_hasConsent: boolean) => void) | undefined
    vi.spyOn($hasAnalyticsConsent, 'subscribe').mockImplementation((listener) => {
      analyticsListener = listener
      return () => {}
    })
    vi.spyOn($isConsentBannerVisible, 'subscribe').mockImplementation(() => () => {})
    vi.spyOn($consent, 'subscribe').mockImplementation(() => () => {})
    vi.spyOn($hasFunctionalConsent, 'subscribe').mockImplementation(() => () => {})

    initConsentSideEffects()

    analyticsListener?.(true)

    await vi.waitFor(() => {
      expect(updateConsentContext).toHaveBeenCalledWith(true)
    })
  })
})
