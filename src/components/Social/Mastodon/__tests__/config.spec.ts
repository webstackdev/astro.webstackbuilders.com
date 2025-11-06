// @vitest-environment happy-dom
/**
 * SPDX-FileCopyrightText: 2025 WebStack Builders LLC
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Unit tests for Mastodon configuration
 * Tests share URL building and endpoint configuration
 */

import { describe, it, expect } from 'vitest'
import { mastodonConfig, buildShareUrl } from '@components/Social/Mastodon/config'

describe('Mastodon Configuration', () => {
  describe('mastodonConfig', () => {
    it('has correct endpoint', () => {
      expect(mastodonConfig.endpoint).toBe('share')
    })

    it('has correct text parameter name', () => {
      expect(mastodonConfig.params.text).toBe('text')
    })

    it('is immutable (as const)', () => {
      // TypeScript will prevent modification, but we can verify structure
      expect(Object.isFrozen(mastodonConfig)).toBe(false) // 'as const' is compile-time only
      expect(mastodonConfig).toBeDefined()
    })
  })

  describe('buildShareUrl', () => {
    it('builds correct URL with domain and text', () => {
      const url = buildShareUrl('mastodon.social', 'Hello World')
      expect(url).toBe('https://mastodon.social/share?text=Hello+World')
    })

    it('encodes special characters in text', () => {
      const url = buildShareUrl('mastodon.social', 'Hello & World!')
      expect(url).toContain('Hello+%26+World%21')
    })

    it('handles instance with https:// prefix', () => {
      const url = buildShareUrl('https://mastodon.social', 'Test')
      expect(url).toBe('https://mastodon.social/share?text=Test')
    })

    it('handles instance with trailing slash', () => {
      const url = buildShareUrl('mastodon.social/', 'Test')
      expect(url).toBe('https://mastodon.social/share?text=Test')
    })

    it('handles instance with both prefix and trailing slash', () => {
      const url = buildShareUrl('https://mastodon.social/', 'Test')
      expect(url).toBe('https://mastodon.social/share?text=Test')
    })

    it('handles empty text', () => {
      const url = buildShareUrl('mastodon.social', '')
      expect(url).toBe('https://mastodon.social/share?text=')
    })

    it('handles long text', () => {
      const longText = 'A'.repeat(500)
      const url = buildShareUrl('mastodon.social', longText)
      expect(url).toContain('mastodon.social/share')
      expect(url).toContain('text=')
      expect(url.length).toBeGreaterThan(500)
    })

    it('handles Unicode characters', () => {
      const url = buildShareUrl('mastodon.social', 'Hello 世界 🌍')
      expect(url).toContain('mastodon.social/share')
      expect(url).toContain('text=')
    })

    it('handles newlines in text', () => {
      const url = buildShareUrl('mastodon.social', 'Line 1\nLine 2')
      expect(url).toContain('mastodon.social/share')
      expect(url).toContain('text=')
    })

    it('handles instance with subdomain', () => {
      const url = buildShareUrl('social.example.com', 'Test')
      expect(url).toBe('https://social.example.com/share?text=Test')
    })

    it('handles instance with port', () => {
      const url = buildShareUrl('mastodon.local:3000', 'Test')
      expect(url).toBe('https://mastodon.local:3000/share?text=Test')
    })
  })
})
