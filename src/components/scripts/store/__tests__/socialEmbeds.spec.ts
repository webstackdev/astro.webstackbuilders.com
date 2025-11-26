// @vitest-environment jsdom
/**
 * Unit tests for social embeds cache state management
 *
 * Social embed caching is classified as 'necessary' under GDPR:
 * - Caches only public oEmbed API responses
 * - No user authentication tokens
 * - Performance optimization that improves user experience
 * - Contains no information about which user viewed which embed
 *
 * No consent check required - always caches and retrieves.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  cacheEmbed,
  clearEmbedCache,
  getCachedEmbed,
  getEmbedCacheState,
  setEmbedCacheState,
} from '@components/scripts/store/socialEmbeds'

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
    // Clear mocks
    vi.clearAllMocks()

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should cache embed without consent check', () => {
    const mockData = { html: '<iframe>...</iframe>' }
    cacheEmbed('twitter_123', mockData, 3600000)

    const cached = getCachedEmbed('twitter_123')
    expect(cached).toEqual(mockData)
  })

  it('should retrieve cached embed data', () => {
    const mockData = { html: '<iframe>...</iframe>', providerName: 'Twitter' }
    cacheEmbed('twitter_123', mockData, 3600000)

    const cached = getCachedEmbed('twitter_123')
    expect(cached).toEqual(mockData)
  })

  it('should return null for expired cache entries', () => {
    const mockData = { html: '<iframe>...</iframe>' }
    const ttl = -1000 // Already expired (negative TTL)

    cacheEmbed('twitter_123', mockData, ttl)

    const cached = getCachedEmbed('twitter_123')
    expect(cached).toBeNull()
  })

  it('should return null for non-existent cache keys', () => {
    const cached = getCachedEmbed('non_existent_key')
    expect(cached).toBeNull()
  })

  it('should cache multiple embeds independently', () => {
    const twitterData = { html: '<iframe src="twitter">...</iframe>' }
    const youtubeData = { html: '<iframe src="youtube">...</iframe>' }

    cacheEmbed('twitter_123', twitterData, 3600000)
    cacheEmbed('youtube_456', youtubeData, 3600000)

    expect(getCachedEmbed('twitter_123')).toEqual(twitterData)
    expect(getCachedEmbed('youtube_456')).toEqual(youtubeData)
  })

  it('should overwrite existing cache entry with same key', () => {
    const originalData = { html: '<iframe>original</iframe>' }
    const updatedData = { html: '<iframe>updated</iframe>' }

    cacheEmbed('twitter_123', originalData, 3600000)
    cacheEmbed('twitter_123', updatedData, 3600000)

    const cached = getCachedEmbed('twitter_123')
    expect(cached).toEqual(updatedData)
  })

  it('should clear the entire cache when requested', () => {
    cacheEmbed('twitter_123', { html: 'foo' }, 3600000)
    cacheEmbed('youtube_456', { html: 'bar' }, 3600000)

    clearEmbedCache()

    expect(getCachedEmbed('twitter_123')).toBeNull()
    expect(getCachedEmbed('youtube_456')).toBeNull()
    expect(getEmbedCacheState()).toEqual({})
  })

  it('should expose cache state getters and setters', () => {
    const state = {
      /* eslint-disable camelcase */
      entry_a: { data: { html: 'A' }, timestamp: 0, ttl: 1000 },
      entry_b: { data: { html: 'B' }, timestamp: 0, ttl: 1000 },
      /* eslint-enable camelcase */
    }

    setEmbedCacheState(state)

    expect(getEmbedCacheState()).toEqual(state)
  })
})
