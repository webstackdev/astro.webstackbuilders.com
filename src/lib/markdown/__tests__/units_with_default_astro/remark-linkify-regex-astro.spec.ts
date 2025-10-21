import { describe, it, expect } from 'vitest'
import remarkLinkifyRegex from 'remark-linkify-regex'
import { processWithAstroSettings } from '../../helpers/test-utils'

describe('remark-linkify-regex (Layer 2: With Astro Pipeline)', () => {
  const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i

  describe('URL linking with GFM', () => {
    it('should work alongside GFM autolinks', async () => {
      const markdown = 'Visit https://example.com and <https://other.com>'

      const html = await processWithAstroSettings(markdown, remarkLinkifyRegex(urlRegex))

      expect(html).toContain('href="https://example.com"')
      expect(html).toContain('href="https://other.com"')
    })

    it('should work in GFM tables', async () => {
      const markdown = `
| Site | URL |
| ---- | --- |
| Example | https://example.com |
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkLinkifyRegex(urlRegex))

      expect(html).toContain('<table')
      expect(html).toContain('https://example.com')
    })

    it('should work with GFM strikethrough', async () => {
      const markdown = 'Visit ~~https://old.com~~ https://new.com instead'

      const html = await processWithAstroSettings(markdown, remarkLinkifyRegex(urlRegex))

      expect(html).toContain('href="https://new.com"')
      expect(html).toContain('<del>')
    })
  })

  describe('URL linking with Astro footnote settings', () => {
    it('should work with URLs in footnotes', async () => {
      const markdown = `
Reference link[^1]

[^1]: See https://example.com for details
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkLinkifyRegex(urlRegex))

      expect(html).toContain('https://example.com')
      expect(html).toContain('footnote')
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should preserve URL links through remarkRehype conversion', async () => {
      const markdown = 'Documentation: https://example.com/docs'

      const html = await processWithAstroSettings(markdown, remarkLinkifyRegex(urlRegex))

      expect(html).toContain('<a')
      expect(html).toContain('href="https://example.com/docs"')
    })

    it('should handle URLs with query params and fragments', async () => {
      const markdown = 'Search: https://example.com?q=test#results'

      const html = await processWithAstroSettings(markdown, remarkLinkifyRegex(urlRegex))

      expect(html).toContain('href="https://example.com?q=test#results"')
    })
  })
})
