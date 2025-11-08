// @vitest-environment happy-dom
/**
 * Unit tests for social embeds cache state management
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { cacheEmbed, getCachedEmbed } from '@components/scripts/store/socialEmbeds'
import { $consent, updateConsent } from '@components/scripts/store/consent'

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

describe('Embed Cache Management', () => {
  beforeEach(() => {
    // Reset stores to default state
    $consent.set({
      necessary: true,
      analytics: false,
      marketing: false,
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
