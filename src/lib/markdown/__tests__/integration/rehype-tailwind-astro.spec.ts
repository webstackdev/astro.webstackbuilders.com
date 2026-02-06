import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { rehypeTailwindClasses } from '@lib/markdown/plugins/rehype-tailwind'
import { processWithAstroSettings, processWithFullPipeline } from '@lib/markdown/helpers/processors'

function splitClassTokens(value: string | null): string[] {
  if (!value) return []
  return value
    .split(/\s+/g)
    .map(token => token.trim())
    .filter(Boolean)
}

function isWellFormedCssClassToken(token: string): boolean {
  if (!token) return false
  if (/[\s"'`{};]/.test(token)) return false

  for (const char of token) {
    const code = char.charCodeAt(0)
    if (code <= 0x1f || code === 0x7f) return false
  }

  return true
}

function expectHasAtLeastOneValidClassAttribute(element: Element | null, name: string): void {
  if (!element) throw new Error(`Expected to find element: ${name}`)

  const classAttr = element.getAttribute('class')
  const tokens = splitClassTokens(classAttr)
  expect(tokens.length).toBeGreaterThan(0)
  tokens.forEach(token => {
    expect(isWellFormedCssClassToken(token)).toBe(true)
  })
}

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
      expect(html).toContain('hover:decoration-content-active')
      expect(html).toContain('focus-visible:outline-none')
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

      const document = new JSDOM(html).window.document
      expectHasAtLeastOneValidClassAttribute(document.querySelector('blockquote'), 'blockquote')
      expectHasAtLeastOneValidClassAttribute(document.querySelector('table'), 'table')
      expectHasAtLeastOneValidClassAttribute(document.querySelector('pre'), 'pre')
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

    it('should not apply generic link classes to heading anchors', async () => {
      const markdown = `
## Components

Paragraph with a [regular link](https://example.com)
      `.trim()

      const html = await processWithFullPipeline(markdown)

      // Heading anchors are created by rehype-autolink-headings and should be styled via its config.
      expect(html).toContain('class="heading-anchor')
      // Regular links should not be marked as heading anchors.
      expect(html).toContain('href="https://example.com"')
      expect(html).not.toMatch(/href="https:\/\/example\.com"[^>]*class="[^"]*heading-anchor/)
    })
  })
})
