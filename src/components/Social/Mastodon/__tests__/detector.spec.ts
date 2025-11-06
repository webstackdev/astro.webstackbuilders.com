// @vitest-environment happy-dom
/**
 * SPDX-FileCopyrightText: 2023 - 2025 Niklas Poslovski <me@n1klas.net> (Share2Fedi project)
 * SPDX-FileCopyrightText: 2025 WebStack Builders LLC
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Unit tests for Mastodon instance detector
 * Tests NodeInfo protocol implementation for Fediverse instance detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { normalizeURL, getUrlDomain, getSoftwareName, isMastodonInstance } from '@components/Social/Mastodon/detector'

// Type alias for mocked fetch function
type MockedFetch = ReturnType<typeof vi.fn>

describe('normalizeURL', () => {
  it('adds https:// prefix if missing', () => {
    expect(normalizeURL('mastodon.social')).toBe('https://mastodon.social/')
  })

  it('preserves existing https:// prefix', () => {
    expect(normalizeURL('https://mastodon.social')).toBe('https://mastodon.social/')
  })

  it('adds trailing slash if missing', () => {
    expect(normalizeURL('https://mastodon.social')).toBe('https://mastodon.social/')
  })

  it('preserves existing trailing slash', () => {
    expect(normalizeURL('https://mastodon.social/')).toBe('https://mastodon.social/')
  })

  it('handles complete URL correctly', () => {
    expect(normalizeURL('https://mastodon.social/')).toBe('https://mastodon.social/')
  })
})

describe('getUrlDomain', () => {
  it('extracts domain from URL string', () => {
    expect(getUrlDomain('https://mastodon.social/path')).toBe('mastodon.social')
  })

  it('handles URL without protocol', () => {
    expect(getUrlDomain('mastodon.social')).toBe('mastodon.social')
  })

  it('trims whitespace', () => {
    expect(getUrlDomain('  mastodon.social  ')).toBe('mastodon.social')
  })

  it('adds https:// if protocol missing', () => {
    expect(getUrlDomain('example.com')).toBe('example.com')
  })

  it('handles URL with port', () => {
    expect(getUrlDomain('https://mastodon.social:443')).toBe('mastodon.social')
  })
})

describe('getSoftwareName', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    // Suppress console.error and console.warn during tests to reduce noise
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('returns software name for valid Mastodon instance', async () => {
    const mockNodeInfoList = {
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: 'https://mastodon.social/nodeinfo/2.0',
        },
      ],
    }

    const mockNodeInfo = {
      software: {
        name: 'mastodon',
        version: '4.2.0',
      },
    }

    ;(global.fetch as unknown as MockedFetch)
      .mockResolvedValueOnce({
        json: async () => mockNodeInfoList,
      })
      .mockResolvedValueOnce({
        json: async () => mockNodeInfo,
      })

    const result = await getSoftwareName('mastodon.social')
    expect(result).toBe('mastodon')
  })

  it('returns undefined for network error', async () => {
    ;(global.fetch as unknown as MockedFetch).mockRejectedValueOnce(new Error('Network error'))

    const result = await getSoftwareName('invalid.domain')
    expect(result).toBeUndefined()
  })

  it('returns undefined when nodeinfo has no links', async () => {
    const mockNodeInfoList = { links: [] }

    ;(global.fetch as unknown as MockedFetch).mockResolvedValueOnce({
      json: async () => mockNodeInfoList,
    })

    const result = await getSoftwareName('mastodon.social')
    expect(result).toBeUndefined()
  })

  it('handles nodeinfo fetch failure gracefully', async () => {
    const mockNodeInfoList = {
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: 'https://mastodon.social/nodeinfo/2.0',
        },
      ],
    }

    ;(global.fetch as unknown as MockedFetch)
      .mockResolvedValueOnce({
        json: async () => mockNodeInfoList,
      })
      .mockRejectedValueOnce(new Error('NodeInfo fetch failed'))

    const result = await getSoftwareName('mastodon.social')
    expect(result).toBeUndefined()
  })

  it('tries all links in nodeinfo list', async () => {
    const mockNodeInfoList = {
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: 'https://mastodon.social/nodeinfo/2.0',
        },
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
          href: 'https://mastodon.social/nodeinfo/2.1',
        },
      ],
    }

    const mockNodeInfo = {
      software: {
        name: 'mastodon',
        version: '4.2.0',
      },
    }

    ;(global.fetch as unknown as MockedFetch)
      .mockResolvedValueOnce({
        json: async () => mockNodeInfoList,
      })
      .mockRejectedValueOnce(new Error('First link failed'))
      .mockResolvedValueOnce({
        json: async () => mockNodeInfo,
      })

    const result = await getSoftwareName('mastodon.social')
    expect(result).toBe('mastodon')
  })
})

describe('isMastodonInstance', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    // Suppress console.error and console.warn during tests to reduce noise
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('returns true for Mastodon instance', async () => {
    const mockNodeInfoList = {
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: 'https://mastodon.social/nodeinfo/2.0',
        },
      ],
    }

    const mockNodeInfo = {
      software: {
        name: 'mastodon',
        version: '4.2.0',
      },
    }

    ;(global.fetch as unknown as MockedFetch)
      .mockResolvedValueOnce({
        json: async () => mockNodeInfoList,
      })
      .mockResolvedValueOnce({
        json: async () => mockNodeInfo,
      })

    const result = await isMastodonInstance('mastodon.social')
    expect(result).toBe(true)
  })

  it('returns true for Hometown instance', async () => {
    const mockNodeInfoList = {
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: 'https://example.com/nodeinfo/2.0',
        },
      ],
    }

    const mockNodeInfo = {
      software: {
        name: 'hometown',
        version: '1.0.0',
      },
    }

    ;(global.fetch as unknown as MockedFetch)
      .mockResolvedValueOnce({
        json: async () => mockNodeInfoList,
      })
      .mockResolvedValueOnce({
        json: async () => mockNodeInfo,
      })

    const result = await isMastodonInstance('example.com')
    expect(result).toBe(true)
  })

  it('returns true for Fedibird instance', async () => {
    const mockNodeInfoList = {
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: 'https://example.com/nodeinfo/2.0',
        },
      ],
    }

    const mockNodeInfo = {
      software: {
        name: 'fedibird',
        version: '1.0.0',
      },
    }

    ;(global.fetch as unknown as MockedFetch)
      .mockResolvedValueOnce({
        json: async () => mockNodeInfoList,
      })
      .mockResolvedValueOnce({
        json: async () => mockNodeInfo,
      })

    const result = await isMastodonInstance('example.com')
    expect(result).toBe(true)
  })

  it('returns true for GlitchCafé instance', async () => {
    const mockNodeInfoList = {
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: 'https://example.com/nodeinfo/2.0',
        },
      ],
    }

    const mockNodeInfo = {
      software: {
        name: 'glitchcafe',
        version: '1.0.0',
      },
    }

    ;(global.fetch as unknown as MockedFetch)
      .mockResolvedValueOnce({
        json: async () => mockNodeInfoList,
      })
      .mockResolvedValueOnce({
        json: async () => mockNodeInfo,
      })

    const result = await isMastodonInstance('example.com')
    expect(result).toBe(true)
  })

  it('returns false for non-Mastodon instance', async () => {
    const mockNodeInfoList = {
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: 'https://pixelfed.social/nodeinfo/2.0',
        },
      ],
    }

    const mockNodeInfo = {
      software: {
        name: 'pixelfed',
        version: '1.0.0',
      },
    }

    ;(global.fetch as unknown as MockedFetch)
      .mockResolvedValueOnce({
        json: async () => mockNodeInfoList,
      })
      .mockResolvedValueOnce({
        json: async () => mockNodeInfo,
      })

    const result = await isMastodonInstance('pixelfed.social')
    expect(result).toBe(false)
  })

  it('returns false for network error', async () => {
    ;(global.fetch as unknown as MockedFetch).mockRejectedValueOnce(new Error('Network error'))

    const result = await isMastodonInstance('invalid.domain')
    expect(result).toBe(false)
  })

  it('returns false when getSoftwareName returns undefined', async () => {
    const mockNodeInfoList = { links: [] }

    ;(global.fetch as unknown as MockedFetch).mockResolvedValueOnce({
      json: async () => mockNodeInfoList,
    })

    const result = await isMastodonInstance('mastodon.social')
    expect(result).toBe(false)
  })
})
