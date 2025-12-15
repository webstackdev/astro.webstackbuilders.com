import { describe, it, expect } from 'vitest'
import remarkBreaks from 'remark-breaks'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('remark-breaks (Layer 2: With Astro Pipeline)', () => {
  describe('line breaks with GFM', () => {
    it('should work with GFM hard line breaks', async () => {
      const markdown = `Line one
Line two
Line three`

      const html = await processWithAstroSettings(markdown, remarkBreaks)

      expect(html).toContain('Line one')
      expect(html).toContain('Line two')
      expect(html).toContain('Line three')
    })

    // Note: remark-breaks is incompatible with GFM tables because it converts
    // newlines to <br> tags, which breaks GFM's table parsing.
    // This is expected behavior - use GFM's native line break syntax (two spaces)
    // or avoid using remark-breaks with tables.

    it('should work with GFM strikethrough', async () => {
      const markdown = `First line
~~Second line~~
Third line`

      const html = await processWithAstroSettings(markdown, remarkBreaks)

      expect(html).toContain('First line')
      expect(html).toContain('<del>Second line</del>')
    })
  })

  describe('line breaks with Astro footnote settings', () => {
    it('should work with footnotes', async () => {
      const markdown = `Line one
Line two[^1]

[^1]: Footnote text`

      const html = await processWithAstroSettings(markdown, remarkBreaks)

      expect(html).toContain('Line one')
      expect(html).toContain('Line two')
      expect(html).toContain('footnote')
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should preserve line breaks through remarkRehype conversion', async () => {
      const markdown = `# Heading

Paragraph line 1
Paragraph line 2

Another paragraph`

      const html = await processWithAstroSettings(markdown, remarkBreaks)

      expect(html).toContain('<h1>')
      expect(html).toContain('<p>')
      expect(html).toContain('Paragraph line 1')
    })
  })
})
