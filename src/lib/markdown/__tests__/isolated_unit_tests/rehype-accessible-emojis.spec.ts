import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'
import rehypeStringify from 'rehype-stringify'

/**
 * Helper for testing rehype plugins (needs remark → rehype conversion)
 */
async function processRehype(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkRehype)
    .use(rehypeAccessibleEmojis)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}

describe('rehype-accessible-emojis (Layer 1: Isolated)', () => {
  describe('emoji accessibility', () => {
    it('should wrap emoji in span with role and aria-label', async () => {
      const markdown = 'Hello 👋'

      const html = await processRehype(markdown)

      expect(html).toContain('role="img"')
      expect(html).toContain('aria-label')
      expect(html).toContain('👋')
    })

    it('should handle multiple emojis', async () => {
      const markdown = 'I ❤️ coding 🚀'

      const html = await processRehype(markdown)

      const roleCount = (html.match(/role="img"/g) || []).length
      expect(roleCount).toBeGreaterThan(0)
    })

    it('should provide descriptive aria-labels', async () => {
      const markdown = 'Thumbs up 👍'

      const html = await processRehype(markdown)

      expect(html).toContain('aria-label')
      expect(html).toContain('👍')
    })
  })

  describe('edge cases', () => {
    it('should handle emoji in headings', async () => {
      const markdown = '# Hello 🌍'

      const html = await processRehype(markdown)

      expect(html).toContain('<h1>')
      expect(html).toContain('🌍')
      expect(html).toContain('role="img"')
    })

    it('should handle emoji in lists', async () => {
      const markdown = '- Item with 🎯\n- Another item'

      const html = await processRehype(markdown)

      expect(html).toContain('<li>')
      expect(html).toContain('🎯')
    })

    it('should handle text without emojis', async () => {
      const markdown = 'Plain text without any emojis'

      const html = await processRehype(markdown)

      expect(html).toContain('Plain text')
      expect(html).not.toContain('role="img"')
    })
  })
})
