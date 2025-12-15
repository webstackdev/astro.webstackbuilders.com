import { describe, it, expect } from 'vitest'
import remarkEmoji from 'remark-emoji'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('remark-emoji (Layer 2: With Astro Pipeline)', () => {
  describe('emoji with GFM', () => {
    it('should work with GFM tables containing emojis', async () => {
      const markdown = `
| Status | Icon |
| ------ | ---- |
| Happy  | :smile: |
| Sad    | :cry: |
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkEmoji)

      expect(html).toContain('<table')
      expect(html).toContain('😄')
      expect(html).toContain('😢')
    })

    it('should work with GFM strikethrough and emojis', async () => {
      const markdown = 'I :heart: ~~hate~~ coding :rocket:'

      const html = await processWithAstroSettings(markdown, remarkEmoji)

      expect(html).toContain('❤')
      expect(html).toContain('🚀')
      expect(html).toContain('<del>hate</del>')
    })

    it('should work with GFM task lists', async () => {
      const markdown = `
- [x] Complete task :heavy_check_mark:
- [ ] Pending task :hourglass:
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkEmoji)

      expect(html).toContain('✔')
    })
  })

  describe('emoji with Astro footnote settings', () => {
    it('should work with emojis in footnotes', async () => {
      const markdown = `
Text with emoji :wave:[^1]

[^1]: Footnote with :smile:
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkEmoji)

      expect(html).toContain('👋')
      expect(html).toContain('😄')
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should preserve emojis through remarkRehype conversion', async () => {
      const markdown = '# Heading :star:\n\nParagraph with :tada: emoji'

      const html = await processWithAstroSettings(markdown, remarkEmoji)

      expect(html).toContain('⭐')
      expect(html).toContain('🎉')
    })

    it('should handle multiple emojis with GFM autolinks', async () => {
      const markdown = 'Check :link: https://example.com for more :information_source:'

      const html = await processWithAstroSettings(markdown, remarkEmoji)

      expect(html).toContain('🔗')
      expect(html).toContain('https://example.com')
    })
  })
})
