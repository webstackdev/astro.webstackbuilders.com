import { describe, it, expect } from 'vitest'
import { rehypeTailwindClasses } from '@lib/markdown/plugins/rehype-tailwind/index'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('rehype-tailwind-classes (Layer 2: With Astro Pipeline)', () => {
  describe('tailwind classes with GFM', () => {
    it('should add classes to GFM tables', async () => {
      const markdown = `
| Column 1 | Column 2 |
| -------- | -------- |
| Data 1   | Data 2   |
      `.trim()

      const html = await processWithAstroSettings({ markdown, plugin: rehypeTailwindClasses, stage: 'rehype' })

      expect(html).toContain('<table')
      expect(html).toContain('class=')
      expect(html).toContain('Data 1')
    })

    it('should add classes to paragraphs with GFM strikethrough', async () => {
      const markdown = 'This has ~~strikethrough~~ text'

      const html = await processWithAstroSettings({ markdown, plugin: rehypeTailwindClasses, stage: 'rehype' })

      expect(html).toContain('<del>')
      expect(html).toContain('strikethrough')
      expect(html).toMatch(/class="[^"]*mb-8/)
    })

    it('should add classes to lists with GFM task lists', async () => {
      const markdown = `
- [x] Completed task
- [ ] Pending task
      `.trim()

      const html = await processWithAstroSettings({ markdown, plugin: rehypeTailwindClasses, stage: 'rehype' })

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

  const html = await processWithAstroSettings({ markdown, plugin: rehypeTailwindClasses, stage: 'rehype' })

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

  const html = await processWithAstroSettings({ markdown, plugin: rehypeTailwindClasses, stage: 'rehype' })

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

  const html = await processWithAstroSettings({ markdown, plugin: rehypeTailwindClasses, stage: 'rehype' })

      expect(html).toContain('<blockquote')
      expect(html).toContain('<pre')
      expect(html).toContain('class=')
    })
  })
})
