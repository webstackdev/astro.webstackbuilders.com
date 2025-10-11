import { describe, it, expect } from 'vitest'
import remarkAttribution from '../../remark-attribution/index'
import { processWithAstroSettings } from '../../helpers/test-utils'

describe('remark-attribution (Layer 2: With Astro Pipeline)', () => {
  describe('attribution with GFM', () => {
    it('should work with GFM in quotation text', async () => {
      const markdown = `
> That's ~~not~~ **definitely** one small step.
> — Neil Armstrong
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkAttribution)

      expect(html).toContain('<figure class="c-blockquote">')
      expect(html).toContain('<strong>definitely</strong>')
      expect(html).toContain('<del>not</del>')
      expect(html).toContain('Neil Armstrong')
    })

    it('should handle GFM autolinks in attribution', async () => {
      const markdown = `
> Great quote
> — https://example.com Author Name
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkAttribution)

      expect(html).toContain('cite="https://example.com"')
      expect(html).toContain('Author Name')
    })

    it('should work with GFM tables in blockquotes', async () => {
      const markdown = `
> | Column 1 | Column 2 |
> | -------- | -------- |
> | Data 1   | Data 2   |
>
> — Table Source
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkAttribution)

      expect(html).toContain('<figure')
      expect(html).toContain('Table Source')
    })
  })

  describe('attribution with Astro footnote settings', () => {
    it('should work with footnotes in blockquotes', async () => {
      const markdown = `
> Quote with reference[^1].
> — Author Name

[^1]: Additional context
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkAttribution)

      expect(html).toContain('<figure')
      expect(html).toContain('Author Name')
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should preserve attribution through remarkRehype conversion', async () => {
      const markdown = `
> Multi-paragraph quote
>
> Second paragraph
> — Attribution with URL https://example.com
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkAttribution)

      expect(html).toContain('<figure class="c-blockquote">')
      expect(html).toContain('<figcaption')
      expect(html).toContain('cite=')
    })
  })
})
