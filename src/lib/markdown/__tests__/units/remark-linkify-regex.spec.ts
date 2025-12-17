import { describe, it, expect } from 'vitest'
import remarkLinkifyRegex from 'remark-linkify-regex'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('remark-linkify-regex (Layer 1: Isolated)', () => {
  describe('basic URL detection', () => {
    it('should convert plain URLs to links', async () => {
      const markdown = 'Visit https://example.com for more info'
      const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i

      const html = await processIsolated({ markdown, plugin: remarkLinkifyRegex(urlRegex) })

      expect(html).toContain('<a href="https://example.com"')
      expect(html).toContain('https://example.com</a>')
    })

    it('should handle http URLs', async () => {
      const markdown = 'Check http://example.com'
      const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i

      const html = await processIsolated({ markdown, plugin: remarkLinkifyRegex(urlRegex) })

      expect(html).toContain('<a href="http://example.com"')
    })

    it('should handle URLs with paths', async () => {
      const markdown = 'Visit https://example.com/path/to/page'
      const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i

      const html = await processIsolated({ markdown, plugin: remarkLinkifyRegex(urlRegex) })

      expect(html).toContain('href="https://example.com/path/to/page"')
    })
  })

  describe('URL edge cases', () => {
    it('should handle URLs with query parameters', async () => {
      const markdown = 'Search https://example.com?query=test&page=1'
      const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i

      const html = await processIsolated({ markdown, plugin: remarkLinkifyRegex(urlRegex) })

      expect(html).toContain('href="https://example.com?query=test&#x26;page=1"')
    })

    it('should handle URLs with fragments', async () => {
      const markdown = 'Go to https://example.com#section'
      const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i

      const html = await processIsolated({ markdown, plugin: remarkLinkifyRegex(urlRegex) })

      expect(html).toContain('href="https://example.com#section"')
    })

    it('should not linkify existing markdown links', async () => {
      const markdown = '[Example](https://example.com)'
      const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i

      const html = await processIsolated({ markdown, plugin: remarkLinkifyRegex(urlRegex) })

      expect(html).toContain('<a')
      expect(html).toContain('href="https://example.com"')
    })

    it('should handle multiple URLs in text', async () => {
      const markdown = 'Visit https://example.com or https://other.com'
      const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i

      const html = await processIsolated({ markdown, plugin: remarkLinkifyRegex(urlRegex) })

      expect(html).toContain('href="https://example.com"')
      expect(html).toContain('href="https://other.com"')
    })
  })
})
