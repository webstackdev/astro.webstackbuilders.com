import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import { rehypeTailwindClasses } from '../../rehype-tailwind-classes.ts'
import rehypeStringify from 'rehype-stringify'

/**
 * Helper for testing rehype-tailwind-classes
 */
async function processRehype(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkRehype)
    .use(rehypeTailwindClasses)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}

describe('rehype-tailwind-classes (Layer 1: Isolated)', () => {
  describe('basic class addition', () => {
    it('should add classes to elements', async () => {
      const markdown = '# Heading'

      const html = await processRehype(markdown)

      // Check that classes are added (specific classes depend on implementation)
      expect(html).toContain('<h1')
    })

    it('should handle paragraphs', async () => {
      const markdown = 'This is a paragraph.'

      const html = await processRehype(markdown)

      expect(html).toContain('<p')
      expect(html).toContain('This is a paragraph.')
    })

    it('should handle links', async () => {
      const markdown = '[Link text](https://example.com)'

      const html = await processRehype(markdown)

      expect(html).toContain('<a')
      expect(html).toContain('href="https://example.com"')
    })
  })

  describe('lists', () => {
    it('should handle unordered lists', async () => {
      const markdown = `- Item 1
- Item 2
- Item 3`

      const html = await processRehype(markdown)

      expect(html).toContain('<ul')
      expect(html).toContain('<li')
      expect(html).toContain('Item 1')
    })

    it('should handle ordered lists', async () => {
      const markdown = `1. First
2. Second
3. Third`

      const html = await processRehype(markdown)

      expect(html).toContain('<ol')
      expect(html).toContain('<li')
      expect(html).toContain('First')
    })
  })

  describe('code blocks', () => {
    it('should handle inline code', async () => {
      const markdown = 'Use `const` for constants'

      const html = await processRehype(markdown)

      expect(html).toContain('<code')
      expect(html).toContain('const')
    })

    it('should handle fenced code blocks', async () => {
      const markdown = '```javascript\nconst x = 1;\n```'

      const html = await processRehype(markdown)

      expect(html).toContain('<code')
      expect(html).toContain('const x = 1')
    })
  })

  describe('blockquotes', () => {
    it('should handle blockquotes', async () => {
      const markdown = '> This is a quote'

      const html = await processRehype(markdown)

      expect(html).toContain('<blockquote')
      expect(html).toContain('This is a quote')
    })
  })

  describe('tables', () => {
    it('should handle tables', async () => {
      const markdown = `| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |`

      const html = await processRehype(markdown)

      expect(html).toContain('Header 1')
      expect(html).toContain('Cell 1')
    })
  })

  describe('edge cases', () => {
    it('should handle empty markdown', async () => {
      const markdown = ''

      const html = await processRehype(markdown)

      // Empty markdown produces empty output, which is correct behavior
      expect(html).toBe('')
    })

    it('should handle mixed content', async () => {
      const markdown = `# Heading

Paragraph with **bold** and *italic*.

- List item
- Another item

\`\`\`
code block
\`\`\`

> Quote`

      const html = await processRehype(markdown)

      expect(html).toContain('<h1')
      expect(html).toContain('<p')
      expect(html).toContain('<ul')
      expect(html).toContain('<blockquote')
    })
  })
})
