/**
 * Integration tests for rehype-tailwind plugin with simple HTML elements
 * These tests verify that Tailwind classes are correctly applied to basic HTML elements
 * with no conditional logic through the Astro pipeline.
 */
import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import { rehypeTailwindClasses } from '../../plugins/rehype-tailwind/index.js'
import rehypeStringify from 'rehype-stringify'
import { remarkRehypeConfig } from '../../../config/markdown.js'

/**
 * Helper for processing markdown through Astro pipeline with rehype-tailwind
 */
async function processMarkdown(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, remarkRehypeConfig)
    .use(rehypeTailwindClasses)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}

describe('rehype-tailwind: Simple HTML Elements (Astro Pipeline)', () => {
  describe('Paragraph elements', () => {
    it('should add spacing and typography classes to paragraphs', async () => {
      const markdown = 'This is a test paragraph.'
      const html = await processMarkdown(markdown)

      expect(html).toContain('<p class="mb-8 text-lg leading-relaxed">')
      expect(html).toContain('This is a test paragraph.')
    })

    it('should handle multiple paragraphs', async () => {
      const markdown = `First paragraph.

Second paragraph.`
      const html = await processMarkdown(markdown)

      const paragraphMatches = html.match(/<p class="mb-8 text-lg leading-relaxed">/g)
      expect(paragraphMatches).toHaveLength(2)
    })
  })

  describe('Horizontal rule elements', () => {
    it('should add styling classes to hr with dashes', async () => {
      const markdown = `Content above

---

Content below`
      const html = await processMarkdown(markdown)

      expect(html).toContain('<hr class="bg-gray-300 border-0 border-gray-300 my-16 mx-auto text-center w-96 h-px">')
    })

    it('should add styling classes to hr with asterisks', async () => {
      const markdown = `Content above

***

Content below`
      const html = await processMarkdown(markdown)

      expect(html).toContain('<hr class="bg-gray-300 border-0 border-gray-300 my-16 mx-auto text-center w-96 h-px">')
    })
  })

  describe('List elements', () => {
    it('should add classes to unordered lists', async () => {
      const markdown = `
- Item 1
- Item 2
- Item 3
      `.trim()
      const html = await processMarkdown(markdown)

      expect(html).toContain('<ul class="list-disc list-outside pl-4 mb-8">')
    })

    it('should add classes to ordered lists', async () => {
      const markdown = `
1. First item
2. Second item
3. Third item
      `.trim()
      const html = await processMarkdown(markdown)

      expect(html).toContain('<ol class="list-decimal list-outside pl-4 mb-8">')
    })

    it('should add classes to list items', async () => {
      const markdown = `
- Item 1
- Item 2
      `.trim()
      const html = await processMarkdown(markdown)

      expect(html).toContain('<li class="mb-1 last:mb-0">')
    })

    it('should handle nested lists', async () => {
      const markdown = `
- Parent item
  - Nested item 1
  - Nested item 2
- Another parent
      `.trim()
      const html = await processMarkdown(markdown)

      const ulMatches = html.match(/<ul class="list-disc list-outside pl-4 mb-8">/g)
      expect(ulMatches).toHaveLength(2) // One parent list, one nested
    })
  })

  describe('Table elements', () => {
    it('should add classes to tables', async () => {
      const markdown = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
      `.trim()
      const html = await processMarkdown(markdown)

      expect(html).toContain('<table class="w-full border-collapse border border-gray-300 dark:border-gray-600 my-6 rounded-lg overflow-hidden">')
    })

    it('should add classes to table headers', async () => {
      const markdown = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
      `.trim()
      const html = await processMarkdown(markdown)

      expect(html).toContain('<th class="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-left font-semibold border-b border-gray-300 dark:border-gray-600">')
    })

    it('should add classes to table cells', async () => {
      const markdown = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
      `.trim()
      const html = await processMarkdown(markdown)

      expect(html).toContain('<td class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">')
    })
  })

  describe('Mixed content', () => {
    it('should handle multiple element types together', async () => {
      const markdown = `
# Heading

This is a paragraph with **bold** text.

- List item 1
- List item 2

---

| Column 1 | Column 2 |
| -------- | -------- |
| Data 1   | Data 2   |
      `.trim()
      const html = await processMarkdown(markdown)

      // Verify paragraph classes
      expect(html).toContain('class="mb-8 text-lg leading-relaxed"')

      // Verify list classes
      expect(html).toContain('class="list-disc list-outside pl-4 mb-8"')
      expect(html).toContain('class="mb-1 last:mb-0"')

      // Verify hr classes
      expect(html).toContain('class="bg-gray-300 border-0 border-gray-300 my-16 mx-auto text-center w-96 h-px"')

      // Verify table classes
      expect(html).toContain('class="w-full border-collapse border border-gray-300 dark:border-gray-600 my-6 rounded-lg overflow-hidden"')
    })

    it('should preserve markdown formatting while adding classes', async () => {
      const markdown = `
This paragraph has *italic* and **bold** text.

- Item with \`inline code\`
- Another item
      `.trim()
      const html = await processMarkdown(markdown)

      expect(html).toContain('<em>')
      expect(html).toContain('<strong>')
      expect(html).toContain('<code>')
      expect(html).toContain('class="mb-8 text-lg leading-relaxed"')
      expect(html).toContain('class="list-disc list-outside pl-4 mb-8"')
    })
  })
})
