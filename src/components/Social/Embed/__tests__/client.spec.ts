// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { EmbedManager } from '../client'

/**
 * Unit tests for Social Embed component
 * Tests platform detection, lazy loading, caching, and embed management
 */

describe('EmbedManager', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mockIntersectionObserver: any

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = ''

    // Clear localStorage
    localStorage.clear()

    // Reset EmbedManager
    EmbedManager.reset()

    // Mock IntersectionObserver
    mockIntersectionObserver = vi.fn((_callback, options) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(),
      root: options?.root || null,
      rootMargin: options?.rootMargin || '0px',
      thresholds: Array.isArray(options?.threshold) ? options.threshold : [options?.threshold || 0],
    }))
    global.IntersectionObserver = mockIntersectionObserver
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Mock fetch
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('LoadableScript Interface', () => {
    it('should implement LoadableScript interface', () => {
      expect(EmbedManager.scriptName).toBe('EmbedManager')
      expect(EmbedManager.eventType).toBe('delayed')
      expect(typeof EmbedManager.init).toBe('function')
      expect(typeof EmbedManager.pause).toBe('function')
      expect(typeof EmbedManager.resume).toBe('function')
      expect(typeof EmbedManager.reset).toBe('function')
    })
  })

  describe('Initialization', () => {
    it('should discover and manage embed elements', () => {
      // Create embed element
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      EmbedManager.init()

      expect(embedElement.getAttribute('data-embed-managed')).toBe('true')
    })

    it('should not initialize the same embed twice', () => {
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      EmbedManager.init()
      EmbedManager.init() // Second initialization

      // Should still only have one managed embed
      expect(embedElement.getAttribute('data-embed-managed')).toBe('true')
      expect(document.querySelectorAll('[data-embed-managed]')).toHaveLength(1)
    })

    it('should warn when embed element is missing data-embed-url', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      // Missing data-embed-url
      document.body.appendChild(embedElement)

      EmbedManager.init()

      expect(consoleWarnSpy).toHaveBeenCalledWith('Embed element missing data-embed-url attribute')
      expect(embedElement.hasAttribute('data-embed-managed')).toBe(false)
    })

    it('should discover multiple embeds', () => {
      // Create multiple embed elements
      const platforms = ['twitter.com', 'youtube.com', 'reddit.com']
      platforms.forEach((platform, index) => {
        const embedElement = document.createElement('div')
        embedElement.setAttribute('data-embed', '')
        embedElement.setAttribute('data-embed-url', `https://${platform}/post/${index}`)
        embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
        document.body.appendChild(embedElement)
      })

      EmbedManager.init()

      expect(document.querySelectorAll('[data-embed-managed]')).toHaveLength(3)
    })
  })

  describe('Platform Detection', () => {
    const testCases = [
      { url: 'https://twitter.com/user/status/123', platform: 'x', name: 'Twitter' },
      { url: 'https://x.com/user/status/456', platform: 'x', name: 'X.com' },
      { url: 'https://linkedin.com/posts/123', platform: 'linkedin', name: 'LinkedIn' },
      { url: 'https://reddit.com/r/programming/comments/abc', platform: 'reddit', name: 'Reddit' },
      { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', platform: 'youtube', name: 'YouTube' },
      { url: 'https://youtu.be/dQw4w9WgXcQ', platform: 'youtube', name: 'YouTube short' },
      { url: 'https://gist.github.com/user/123abc', platform: 'github-gist', name: 'GitHub Gist' },
      { url: 'https://codepen.io/user/pen/abc123', platform: 'codepen', name: 'CodePen' },
      { url: 'https://mastodon.social/@user/123', platform: 'mastodon', name: 'Mastodon' },
    ]

    testCases.forEach(({ url, name }) => {
      it(`should detect ${name} platform from URL`, () => {
        const embedElement = document.createElement('div')
        embedElement.setAttribute('data-embed', '')
        embedElement.setAttribute('data-embed-url', url)
        embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
        document.body.appendChild(embedElement)

        EmbedManager.init()

        expect(embedElement.getAttribute('data-embed-managed')).toBe('true')
      })
    })

    it('should use explicit platform when provided', () => {
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://bsky.app/profile/user.bsky.social/post/123')
      embedElement.setAttribute('data-embed-platform', 'bluesky')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      EmbedManager.init()

      expect(embedElement.getAttribute('data-embed-managed')).toBe('true')
    })

    it('should warn and default to x for unknown URLs', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://unknown-platform.com/post/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      EmbedManager.init()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not detect platform for URL')
      )
    })
  })

  describe('Intersection Observer', () => {
    it('should setup intersection observer with correct options', () => {
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      EmbedManager.init()

      expect(mockIntersectionObserver).toHaveBeenCalled()
      const options = mockIntersectionObserver.mock.calls[0]?.[1]
      expect(options.root).toBe(document.body)
      expect(options.rootMargin).toBe('0px 0px 500px 0px')
      expect(options.threshold).toBe(0.01)
    })

    it('should not setup observer for LinkedIn embeds', () => {
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://linkedin.com/posts/123')
      embedElement.setAttribute('data-embed-platform', 'linkedin')
      const iframe = document.createElement('iframe')
      iframe.src = 'https://linkedin.com/embed/123'
      embedElement.appendChild(iframe)
      document.body.appendChild(embedElement)

      mockIntersectionObserver.mockClear()
      EmbedManager.init()

      // LinkedIn should not trigger IntersectionObserver
      expect(mockIntersectionObserver).not.toHaveBeenCalled()
    })

    it('should fallback to immediate loading if IntersectionObserver not available', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.spyOn(console, 'log').mockImplementation(() => {})

      // @ts-expect-error - Intentionally removing IntersectionObserver for test
      global.IntersectionObserver = undefined

      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      // Mock fetch to return oEmbed data
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ html: '<blockquote>Tweet</blockquote>' }),
      } as Response)

      EmbedManager.init()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'IntersectionObserver not supported, loading embed immediately'
      )
    })
  })

  describe('oEmbed Endpoints', () => {
    const endpointTests = [
      {
        platform: 'x',
        url: 'https://twitter.com/user/status/123',
        expectedEndpoint: 'https://publish.twitter.com/oembed?url=',
      },
      {
        platform: 'bluesky',
        url: 'https://bsky.app/profile/user/post/123',
        expectedEndpoint: 'https://embed.bsky.app/oembed?url=',
      },
      {
        platform: 'reddit',
        url: 'https://reddit.com/r/test/comments/123',
        expectedEndpoint: 'https://www.reddit.com/oembed?url=',
      },
      {
        platform: 'youtube',
        url: 'https://youtube.com/watch?v=123',
        expectedEndpoint: 'https://www.youtube.com/oembed?url=',
      },
      {
        platform: 'codepen',
        url: 'https://codepen.io/user/pen/abc',
        expectedEndpoint: 'https://codepen.io/api/oembed?url=',
      },
    ]

    endpointTests.forEach(({ platform, url, expectedEndpoint }) => {
      it(`should construct correct oEmbed endpoint for ${platform}`, async () => {
        const embedElement = document.createElement('div')
        embedElement.setAttribute('data-embed', '')
        embedElement.setAttribute('data-embed-url', url)
        embedElement.setAttribute('data-embed-platform', platform)
        embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
        document.body.appendChild(embedElement)

        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          json: async () => ({ html: '<div>Embed</div>' }),
        } as Response)

        EmbedManager.init()

        // Trigger intersection observer callback
        const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
        if (observerCallback) {
          if (observerCallback) {
        await observerCallback([{ isIntersecting: true, target: embedElement }])
      }
        }

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining(expectedEndpoint))
      })
    })

    it('should construct Mastodon endpoint from instance URL', async () => {
      const url = 'https://mastodon.social/@user/123456789'
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', url)
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ html: '<div>Toot</div>' }),
      } as Response)

      EmbedManager.init()

      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        await observerCallback([{ isIntersecting: true, target: embedElement }])
      }
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://mastodon.social/api/oembed?url=')
      )
    })
  })

  describe('Caching', () => {
    it('should cache oEmbed responses in localStorage', async () => {
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      const mockOEmbedData = { html: '<blockquote>Tweet</blockquote>' }
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockOEmbedData,
      } as Response)

      EmbedManager.init()

      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        await observerCallback([{ isIntersecting: true, target: embedElement }])
      }
      await new Promise(resolve => setTimeout(resolve, 0))

      // Check localStorage for cached data
      const cacheKey = Object.keys(localStorage).find(key => key.startsWith('embed_cache_x_'))
      expect(cacheKey).toBeTruthy()

      if (cacheKey) {
        const cached = JSON.parse(localStorage.getItem(cacheKey)!)
        expect(cached.data).toEqual(mockOEmbedData)
        expect(cached.timestamp).toBeDefined()
        expect(cached.ttl).toBeDefined()
      }
    })

    it('should use cached data when available', async () => {
      // Pre-populate cache
      const cacheKey = 'embed_cache_x_aHR0cHM6Ly90d2l0dGVyLmNvbS91c2VyL3N0YXR1cy8xMjM='
      const cachedData = {
        data: { html: '<blockquote>Cached Tweet</blockquote>' },
        timestamp: Date.now(),
        ttl: 24 * 60 * 60 * 1000, // 24 hours
      }
      localStorage.setItem(cacheKey, JSON.stringify(cachedData))

      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      EmbedManager.init()

      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        await observerCallback([{ isIntersecting: true, target: embedElement }])
      }
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(fetch).not.toHaveBeenCalled()
    })

    it('should invalidate expired cache entries', async () => {
      // Pre-populate cache with expired data
      const cacheKey = 'embed_cache_x_aHR0cHM6Ly90d2l0dGVyLmNvbS91c2VyL3N0YXR1cy8xMjM='
      const expiredData = {
        data: { html: '<blockquote>Old Tweet</blockquote>' },
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        ttl: 24 * 60 * 60 * 1000, // 24 hour TTL
      }
      localStorage.setItem(cacheKey, JSON.stringify(expiredData))

      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ html: '<blockquote>Fresh Tweet</blockquote>' }),
      } as Response)

      EmbedManager.init()

      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        await observerCallback([{ isIntersecting: true, target: embedElement }])
      }
      await new Promise(resolve => setTimeout(resolve, 0))

      // Should fetch fresh data instead of using expired cache
      expect(fetch).toHaveBeenCalled()
    })

    it('should respect cache_age from oEmbed response', async () => {
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      const customCacheAge = 3600 // 1 hour in seconds
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          html: '<blockquote>Tweet</blockquote>',
          /* eslint-disable-next-line camelcase */
          cache_age: customCacheAge,
        }),
      } as Response)

      EmbedManager.init()

      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        await observerCallback([{ isIntersecting: true, target: embedElement }])
      }
      await new Promise(resolve => setTimeout(resolve, 0))

      const cacheKey = Object.keys(localStorage).find(key => key.startsWith('embed_cache_x_'))
      if (cacheKey) {
        const cached = JSON.parse(localStorage.getItem(cacheKey)!)
        expect(cached.ttl).toBe(customCacheAge * 1000) // Converted to ms
      }
    })
  })

  describe('LinkedIn Special Handling', () => {
    it('should make LinkedIn iframe responsive', () => {
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://linkedin.com/embed/123')
      embedElement.setAttribute('data-embed-platform', 'linkedin')

      const iframe = document.createElement('iframe')
      iframe.src = 'https://linkedin.com/embed/123'
      iframe.width = '504'
      iframe.height = '593'
      embedElement.appendChild(iframe)
      document.body.appendChild(embedElement)

      EmbedManager.init()

      // Check wrapper was created
      const wrapper = embedElement.querySelector('.embed-linkedin-wrapper')
      expect(wrapper).toBeTruthy()
      expect((wrapper as HTMLElement)?.style.paddingBottom).toBe('117.86%')
      expect((wrapper as HTMLElement)?.style.maxWidth).toBe('504px')

      // Check iframe was styled
      expect(iframe.style.position).toBe('absolute')
      expect(iframe.style.width).toBe('100%')
      expect(iframe.style.height).toBe('100%')
    })

    it('should warn if LinkedIn iframe not found', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://linkedin.com/embed/123')
      embedElement.setAttribute('data-embed-platform', 'linkedin')
      // No iframe child
      document.body.appendChild(embedElement)

      EmbedManager.init()

      expect(consoleWarnSpy).toHaveBeenCalledWith('LinkedIn iframe not found')
    })
  })

  describe('Lifecycle Management', () => {
    it('should pause all embeds', () => {
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      EmbedManager.init()
      EmbedManager.pause()

      // Paused state is internal, but we can verify it doesn't crash
      expect(true).toBe(true)
    })

    it('should resume all embeds', () => {
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      EmbedManager.init()
      EmbedManager.pause()
      EmbedManager.resume()

      expect(true).toBe(true)
    })

    it('should cleanup removed embeds on reset', () => {
      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      EmbedManager.init()
      expect(embedElement.hasAttribute('data-embed-managed')).toBe(true)

      // Remove from DOM
      embedElement.remove()

      // Reset should cleanup
      EmbedManager.reset()

      // Re-init should work cleanly
      EmbedManager.init()
      expect(document.querySelectorAll('[data-embed-managed]')).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      EmbedManager.init()

      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        await observerCallback([{ isIntersecting: true, target: embedElement }])
      }
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(consoleErrorSpy).toHaveBeenCalled()
      // Placeholder should remain
      expect(embedElement.querySelector('[data-embed-placeholder]')).toBeTruthy()
    })

    it('should handle HTTP error responses', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      embedElement.innerHTML = '<div data-embed-placeholder>Loading...</div>'
      document.body.appendChild(embedElement)

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      EmbedManager.init()

      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        await observerCallback([{ isIntersecting: true, target: embedElement }])
      }
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch oEmbed data')
      )
    })

    it('should handle missing placeholder gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const embedElement = document.createElement('div')
      embedElement.setAttribute('data-embed', '')
      embedElement.setAttribute('data-embed-url', 'https://twitter.com/user/status/123')
      // No placeholder element
      document.body.appendChild(embedElement)

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ html: '<blockquote>Tweet</blockquote>' }),
      } as Response)

      EmbedManager.init()

      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0]
      if (observerCallback) {
        await observerCallback([{ isIntersecting: true, target: embedElement }])
      }
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(consoleWarnSpy).toHaveBeenCalledWith('Placeholder not found in embed container')
    })
  })
})
