import { describe, it, expect } from 'vitest'
import remarkBreaks from 'remark-breaks'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('remark-breaks (Layer 1: Isolated)', () => {
  describe('basic line break functionality', () => {
    it('should convert single line breaks to <br> tags', async () => {
      const markdown = 'Line one\nLine two'

      const html = await processIsolated({ markdown, plugin: remarkBreaks })

      expect(html).toContain('Line one<br>\nLine two')
    })

    it('should handle multiple consecutive line breaks', async () => {
      const markdown = 'Line one\n\nLine two'

      const html = await processIsolated({ markdown, plugin: remarkBreaks })

      // Double line break creates a new paragraph
      expect(html).toContain('<p>Line one</p>')
      expect(html).toContain('<p>Line two</p>')
    })

    it('should preserve hard breaks in different contexts', async () => {
      const markdown = `First line
Second line
Third line`

      const html = await processIsolated({ markdown, plugin: remarkBreaks })

      const brCount = (html.match(/<br>/g) || []).length
      expect(brCount).toBeGreaterThanOrEqual(2)
    })
  })

  describe('edge cases', () => {
    it('should handle line breaks in lists', async () => {
      const markdown = `- Item one
with continuation
- Item two`

    const html = await processIsolated({ markdown, plugin: remarkBreaks })

      expect(html).toContain('<li>')
      expect(html).toContain('Item one')
    })

    it('should handle line breaks in blockquotes', async () => {
      const markdown = `> Quote line one
> Quote line two`

      const html = await processIsolated({ markdown, plugin: remarkBreaks })

      expect(html).toContain('<blockquote>')
      expect(html).toContain('Quote line one')
      expect(html).toContain('Quote line two')
    })

    it('should not add breaks to empty lines', async () => {
      const markdown = 'Line one\n\n\nLine two'

      const html = await processIsolated({ markdown, plugin: remarkBreaks })

      expect(html).toContain('<p>Line one</p>')
      expect(html).toContain('<p>Line two</p>')
    })
  })
})
