import { describe, it, expect } from 'vitest'
import remarkReplacements from '@lib/markdown/plugins/remark-replacements'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('remark-replacements (Layer 2: With Astro Pipeline)', () => {
  describe('replacements with GFM', () => {
    it('should work with arrows in GFM tables', async () => {
      const markdown = `
| Operation | Symbol |
| --------- | ------ |
| Forward   | -->    |
| Back      | <--    |
| Both      | <-->   |
      `.trim()

      const html = await processWithAstroSettings({ markdown, plugin: remarkReplacements })

      expect(html).toContain('<table')
      expect(html).toContain('→')
      expect(html).toContain('←')
      expect(html).toContain('↔')
    })

    it('should work with replacements in strikethrough', async () => {
      const markdown = 'The result is ~~+- 5~~ exactly +- 0.5'

      const html = await processWithAstroSettings({ markdown, plugin: remarkReplacements })

      expect(html).toContain('±')
      expect(html).toContain('<del>± 5</del>')
    })

    it('should work with replacements in task lists', async () => {
      const markdown = `
- [x] Area is 2 x 3
- [ ] Size is 4 x 5
      `.trim()

      const html = await processWithAstroSettings({ markdown, plugin: remarkReplacements })

      expect(html).toContain('×')
      expect(html).toContain('2 × 3')
      expect(html).toContain('4 × 5')
    })
  })

  describe('replacements with Astro footnote settings', () => {
    it('should work with replacements in footnotes', async () => {
      const markdown = `
The arrow --> points right[^1]

[^1]: This arrow <-- points left
      `.trim()

      const html = await processWithAstroSettings({ markdown, plugin: remarkReplacements })

      expect(html).toContain('→')
      expect(html).toContain('←')
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should preserve replacements through remarkRehype conversion', async () => {
      const markdown = 'Double arrow ==> and bidirectional <==>'

      const html = await processWithAstroSettings({ markdown, plugin: remarkReplacements })

      expect(html).toContain('⇒')
      expect(html).toContain('⇔')
      expect(html).not.toContain('==>')
      expect(html).not.toContain('<==>')
    })

    it('should work with multiple replacements in one paragraph', async () => {
      const markdown = 'The value is +- 0.5 and the area is 2 x 3, pointing -->'

      const html = await processWithAstroSettings({ markdown, plugin: remarkReplacements })

      expect(html).toContain('±')
      expect(html).toContain('×')
      expect(html).toContain('→')
    })
  })
})
