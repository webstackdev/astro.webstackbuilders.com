import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'
import rehypeStringify from 'rehype-stringify'
import { remarkRehypeConfig } from '@lib/config/markdown'

/**
 * Helper for testing rehype-accessible-emojis with Astro settings
 */
async function processWithAstroSettings(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, remarkRehypeConfig)
    .use(rehypeAccessibleEmojis)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}

describe('rehype-accessible-emojis (Layer 2: With Astro Pipeline)', () => {
  describe('emoji accessibility with GFM', () => {
    it('should make emojis accessible in GFM tables', async () => {
      const markdown = `
| Status | Icon |
| ------ | ---- |
| Happy  | 😊   |
      `.trim()

      const html = await processWithAstroSettings(markdown)

      expect(html).toContain('<table')
      expect(html).toContain('role="img"')
      expect(html).toContain('😊')
    })

    it('should work with GFM strikethrough containing emojis', async () => {
      const markdown = '~~Not happy 😢~~ Happy now 😄'

      const html = await processWithAstroSettings(markdown)

      expect(html).toContain('<del>')
      expect(html).toContain('role="img"')
      expect(html).toContain('😄')
    })

    it('should work in GFM task lists', async () => {
      const markdown = `
- [x] Completed ✅
- [ ] Pending ⏳
      `.trim()

      const html = await processWithAstroSettings(markdown)

      expect(html).toContain('role="img"')
      expect(html).toContain('✅')
    })
  })

  describe('emoji accessibility with Astro footnote settings', () => {
    it('should make emojis accessible in footnotes', async () => {
      const markdown = `
Text with emoji 👋[^1]

[^1]: Footnote with 😊
      `.trim()

      const html = await processWithAstroSettings(markdown)

      expect(html).toContain('role="img"')
      expect(html).toContain('👋')
      expect(html).toContain('😊')
    })

    it('should use custom footnote labels from Astro config', async () => {
      const markdown = `
Reference[^1]

[^1]: Content
      `.trim()

      const html = await processWithAstroSettings(markdown)

      // Verify footnote structure is preserved
      expect(html).toContain('footnote')
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should preserve emoji accessibility through full pipeline', async () => {
      const markdown = `
# Heading 🌟

Paragraph with 🚀 emoji

- List with 📝
- Another item
      `.trim()

      const html = await processWithAstroSettings(markdown)

      const roleCount = (html.match(/role="img"/g) || []).length
      expect(roleCount).toBeGreaterThan(0)
      expect(html).toContain('aria-label')
    })
  })
})
