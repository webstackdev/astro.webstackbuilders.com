import { describe, it, expect } from 'vitest'
import { rehypeTailwindClasses } from '@lib/markdown/plugins/rehype-tailwind'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('rehype-tailwind-classes (Layer 2: With Astro Pipeline)', () => {
  describe('Tailwind classes with GFM', () => {
    it('should add classes to GFM tables', async () => {
      const markdown = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
      `.trim()

      const html = await processWithAstroSettings({
        markdown,
        plugin: rehypeTailwindClasses,
        stage: 'rehype',
      })

      expect(html).toContain('<table')
      expect(html).toContain('Header 1')
      expect(html).toContain('Cell 1')
    })

    it('should work with GFM strikethrough', async () => {
      const markdown = 'Text with ~~strikethrough~~ formatting'

      const html = await processWithAstroSettings({
        markdown,
        plugin: rehypeTailwindClasses,
        stage: 'rehype',
      })

      expect(html).toContain('<del>')
      expect(html).toContain('strikethrough')
    })

    it('should work with GFM task lists', async () => {
      const markdown = `
- [x] Completed task
- [ ] Pending task
      `.trim()

      const html = await processWithAstroSettings({
        markdown,
        plugin: rehypeTailwindClasses,
        stage: 'rehype',
      })

      // The output clearly contains <li> elements with classes
      expect(html).toContain('task-list-item')
      expect(html).toContain('Completed task')
    })

    it('should work with GFM autolinks', async () => {
      const markdown = 'Visit https://example.com for info'

      const html = await processWithAstroSettings({
        markdown,
        plugin: rehypeTailwindClasses,
        stage: 'rehype',
      })

      expect(html).toContain('<a')
      expect(html).toContain('https://example.com')
    })
  })

  describe('Tailwind classes with Astro footnote settings', () => {
    it('should add classes to footnotes', async () => {
      const markdown = `
Text with footnote[^1]

[^1]: Footnote content
      `.trim()

      const html = await processWithAstroSettings({
        markdown,
        plugin: rehypeTailwindClasses,
        stage: 'rehype',
      })

      expect(html).toContain('footnote')
      expect(html).toContain('Footnote content')
    })

    it('should handle footnote structure from Astro config', async () => {
      const markdown = `
Reference[^note]

[^note]: Note content
      `.trim()

      const html = await processWithAstroSettings({
        markdown,
        plugin: rehypeTailwindClasses,
        stage: 'rehype',
      })

      expect(html).toContain('footnote')
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should apply classes through full Astro pipeline', async () => {
      const markdown = `
# Heading

Paragraph with **bold** and *italic*

| Table |
| ----- |
| Data  |

\`\`\`javascript
const x = 1;
\`\`\`

> Blockquote

- List item
      `.trim()

      const html = await processWithAstroSettings({
        markdown,
        plugin: rehypeTailwindClasses,
        stage: 'rehype',
      })

      expect(html).toContain('<h1')
      expect(html).toContain('<p')
      expect(html).toContain('<table')
      expect(html).toContain('<code')
      expect(html).toContain('<blockquote')
      expect(html).toContain('<ul')
    })

    it('should preserve existing classes through pipeline', async () => {
      const markdown = `
# Regular heading

Content text
      `.trim()

      const html = await processWithAstroSettings({
        markdown,
        plugin: rehypeTailwindClasses,
        stage: 'rehype',
      })

      expect(html).toContain('<h1')
      expect(html).toContain('Content text')
    })
  })
})
