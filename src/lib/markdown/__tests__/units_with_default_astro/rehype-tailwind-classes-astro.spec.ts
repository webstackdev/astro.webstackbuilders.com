import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import { rehypeTailwindClasses } from '../../plugins/rehype-tailwind/index'
import rehypeStringify from 'rehype-stringify'
import { remarkRehypeConfig } from '../../../config/markdown'

/**
 * Helper for testing rehype-tailwind-classes with Astro settings
 */
async function processWithAstroSettings(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, remarkRehypeConfig)
    .use(rehypeTailwindClasses)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}

describe('rehype-tailwind-classes (Layer 2: With Astro Pipeline)', () => {
  describe('tailwind classes with GFM', () => {
    it('should add classes to GFM tables', async () => {
      const markdown = `
| Column 1 | Column 2 |
| -------- | -------- |
| Data 1   | Data 2   |
      `.trim()

      const html = await processWithAstroSettings(markdown)

      expect(html).toContain('<table')
      expect(html).toContain('class=')
      expect(html).toContain('Data 1')
    })

    it('should add classes to paragraphs with GFM strikethrough', async () => {
      const markdown = 'This has ~~strikethrough~~ text'

      const html = await processWithAstroSettings(markdown)

      expect(html).toContain('<del>')
      expect(html).toContain('strikethrough')
      expect(html).toMatch(/class="[^"]*mb-8/)
    })

    it('should add classes to lists with GFM task lists', async () => {
      const markdown = `
- [x] Completed task
- [ ] Pending task
      `.trim()

      const html = await processWithAstroSettings(markdown)

      expect(html).toContain('<ul')
      expect(html).toMatch(/class="[^"]*list-/)
    })
  })

  describe('tailwind classes with Astro footnote settings', () => {
    it('should add classes to elements with footnotes', async () => {
      const markdown = `
Text with footnote[^1]

[^1]: Footnote content
      `.trim()

      const html = await processWithAstroSettings(markdown)

      expect(html).toContain('class=')
      expect(html).toMatch(/mb-8|text-lg/)
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should preserve classes through remarkRehype conversion', async () => {
      const markdown = `
# Heading

Paragraph with **bold** and *italic*.

- List item
      `.trim()

      const html = await processWithAstroSettings(markdown)

      expect(html).toContain('<h1')
      expect(html).toContain('<p')
      expect(html).toContain('<ul')
      expect(html).toContain('<strong>')
      expect(html).toContain('<em>')
      expect(html).toMatch(/class="[^"]*mb-/)
    })

    it('should add classes to complex nested structures', async () => {
      const markdown = `
> Quote with **bold** text

\`\`\`js
code block
\`\`\`
      `.trim()

      const html = await processWithAstroSettings(markdown)

      expect(html).toContain('<blockquote')
      expect(html).toContain('<pre')
      expect(html).toContain('class=')
    })
  })
})
