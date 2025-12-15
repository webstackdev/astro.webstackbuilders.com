import { describe, it, expect } from 'vitest'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'
import { rehypeAutolinkHeadingsConfig } from '@lib/config/markdown'

describe('rehype-autolink-headings (Layer 2: With Astro Pipeline)', () => {
  describe('autolink with GFM', () => {
    it('should add anchor links to headings with GFM tables below', async () => {
      const markdown = `
## My Section

| Header |
| ------ |
| Data   |
      `.trim()

  const html = await processWithAstroSettings({
    markdown,
    plugin: rehypeAutolinkHeadings,
    pluginOptions: rehypeAutolinkHeadingsConfig,
    stage: 'rehype',
  })

      expect(html).toContain('<h2')
      expect(html).toContain('🔗')
      expect(html).toContain('class="anchor-link"')
      expect(html).toContain('<table')
    })

    it('should work with GFM strikethrough in headings', async () => {
      const markdown = '## ~~Old~~ New Approach'

      const html = await processWithAstroSettings({
        markdown,
        plugin: rehypeAutolinkHeadings,
        pluginOptions: rehypeAutolinkHeadingsConfig,
        stage: 'rehype',
      })

      expect(html).toContain('<h2')
      expect(html).toContain('<del>Old</del>')
      expect(html).toContain('🔗')
    })

    it('should work with GFM autolinks in headings', async () => {
      const markdown = '## Check https://example.com'

      const html = await processWithAstroSettings({
        markdown,
        plugin: rehypeAutolinkHeadings,
        pluginOptions: rehypeAutolinkHeadingsConfig,
        stage: 'rehype',
      })

      expect(html).toContain('<h2')
      expect(html).toContain('href="https://example.com"')
      expect(html).toContain('🔗')
    })
  })

  describe('autolink with Astro footnote settings', () => {
    it('should work with headings containing footnote references', async () => {
      const markdown = `
## Section Title[^1]

[^1]: Additional context
      `.trim()

  const html = await processWithAstroSettings({
    markdown,
    plugin: rehypeAutolinkHeadings,
    pluginOptions: rehypeAutolinkHeadingsConfig,
    stage: 'rehype',
  })

      expect(html).toContain('<h2')
      expect(html).toContain('🔗')
      expect(html).toContain('footnote')
    })

    it('should use custom footnote configuration from Astro', async () => {
      const markdown = `
## Heading

Content[^1]

[^1]: Note
      `.trim()

  const html = await processWithAstroSettings({
    markdown,
    plugin: rehypeAutolinkHeadings,
    pluginOptions: rehypeAutolinkHeadingsConfig,
    stage: 'rehype',
  })

      // Verify remarkRehype footnote settings are applied
      expect(html).toContain('footnote')
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should preserve anchor links through full pipeline', async () => {
      const markdown = `
# Main Title

## Section One

### Subsection 1.1

## Section Two
      `.trim()

  const html = await processWithAstroSettings({
    markdown,
    plugin: rehypeAutolinkHeadings,
    pluginOptions: rehypeAutolinkHeadingsConfig,
    stage: 'rehype',
  })

      const anchorCount = (html.match(/class="anchor-link"/g) || []).length
      expect(anchorCount).toBe(4) // All 4 headings should have anchors
    })

    it('should handle complex headings with mixed GFM features', async () => {
      const markdown = '## **Bold** ~~Strike~~ `code` [link](https://example.com)'

      const html = await processWithAstroSettings({
        markdown,
        plugin: rehypeAutolinkHeadings,
        pluginOptions: rehypeAutolinkHeadingsConfig,
        stage: 'rehype',
      })

      expect(html).toContain('<h2')
      expect(html).toContain('<strong>Bold</strong>')
      expect(html).toContain('<del>Strike</del>')
      expect(html).toContain('<code>code</code>')
      expect(html).toContain('🔗')
    })
  })
})
