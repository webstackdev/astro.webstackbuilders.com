import { describe, it, expect } from 'vitest'
import remarkAbbreviations from '@lib/markdown/plugins/remark-abbreviations/index'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('remark-abbreviations (Layer 2: With Astro Pipeline)', () => {
  describe('abbreviations with GFM', () => {
    it('should work with GitHub Flavored Markdown features', async () => {
      const markdown = `
This uses MDAST with ~~strikethrough~~ text.

*[MDAST]: Markdown Abstract Syntax Tree
      `.trim()

  const html = await processWithAstroSettings({ markdown, plugin: remarkAbbreviations })

      // Should have abbreviation
      expect(html).toContain('<abbr title="Markdown Abstract Syntax Tree">MDAST</abbr>')
      // Should have GFM strikethrough
      expect(html).toContain('<del>strikethrough</del>')
    })

    it('should work with GFM tables', async () => {
      const markdown = `
| Feature | Description |
| ------- | ----------- |
| MDAST   | Tree format |

*[MDAST]: Markdown Abstract Syntax Tree
      `.trim()

  const html = await processWithAstroSettings({ markdown, plugin: remarkAbbreviations })

      expect(html).toContain('<table')
      expect(html).toContain('<abbr title="Markdown Abstract Syntax Tree">MDAST</abbr>')
    })

    it('should work with GFM autolinks', async () => {
      const markdown = `
Check https://example.com for MDAST info.

*[MDAST]: Markdown Abstract Syntax Tree
      `.trim()

  const html = await processWithAstroSettings({ markdown, plugin: remarkAbbreviations })

      expect(html).toContain('<abbr')
      expect(html).toContain('https://example.com')
    })
  })

  describe('abbreviations with Astro footnote settings', () => {
    it('should work alongside footnotes', async () => {
      const markdown = `
This uses MDAST[^1].

[^1]: A tree structure

*[MDAST]: Markdown Abstract Syntax Tree
      `.trim()

  const html = await processWithAstroSettings({ markdown, plugin: remarkAbbreviations })

      expect(html).toContain('<abbr title="Markdown Abstract Syntax Tree">MDAST</abbr>')
      // Footnote reference should be present
      expect(html).toContain('footnote')
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should handle abbreviations with smartypants quotes', async () => {
      const markdown = `
The "MDAST" format is great.

*[MDAST]: Markdown Abstract Syntax Tree
      `.trim()

  const html = await processWithAstroSettings({ markdown, plugin: remarkAbbreviations })

      expect(html).toContain('<abbr title="Markdown Abstract Syntax Tree">MDAST</abbr>')
      // Note: smartypants is handled by Astro's internal processing, not in our test pipeline
    })
  })
})
