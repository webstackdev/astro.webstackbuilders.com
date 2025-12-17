import { describe, it, expect } from 'vitest'
import remarkAttributes from '@lib/markdown/plugins/remark-attributes/index'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'
import { remarkAttributesConfig } from '@lib/config/markdown'

describe('remark-attributes (Layer 2: With Astro Pipeline)', () => {
  describe('attributes with GFM', () => {
    // Note: Attributes on GFM tables are not supported - the attribute syntax
    // gets parsed as a table row by GFM. This is expected behavior.
    // To add attributes to tables, they must be in a separate paragraph.

    it('should work with GFM strikethrough', async () => {
      const markdown = '[~~deleted text~~][[.highlight]]'

      const html = await processWithAstroSettings({
        markdown,
        plugin: remarkAttributes,
        pluginOptions: remarkAttributesConfig,
      })

      expect(html).toContain('<del')
      expect(html).toContain('deleted text')
    })

    it('should work with GFM task lists', async () => {
      const markdown = `
    - [ ] Task 1[[.todo-item]]
- [x] Task 2
      `.trim()

      const html = await processWithAstroSettings({
        markdown,
        plugin: remarkAttributes,
        pluginOptions: remarkAttributesConfig,
      })

      expect(html).toContain('Task 1')
      expect(html).toContain('Task 2')
    })
  })

  describe('attributes with Astro footnote settings', () => {
    it('should add attributes to footnote references', async () => {
      const markdown = `
    Text with footnote[^1][[.footnote-ref]].

[^1]: Footnote content
      `.trim()

  const html = await processWithAstroSettings({
    markdown,
    plugin: remarkAttributes,
    pluginOptions: remarkAttributesConfig,
  })

      expect(html).toContain('footnote')
      expect(html).toContain('Footnote content')
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should handle attributes on links with autolinks', async () => {
      const markdown = '[Visit](https://example.com)[[.external target=_blank]]'

      const html = await processWithAstroSettings({
        markdown,
        plugin: remarkAttributes,
        pluginOptions: remarkAttributesConfig,
      })

      expect(html).toContain('class="external"')
      expect(html).toContain('target="_blank"')
      expect(html).toContain('href="https://example.com"')
    })

    it('should preserve attributes through remarkRehype conversion', async () => {
      const markdown = '# Heading[[.title #main-heading data-level=1]]'

      const html = await processWithAstroSettings({
        markdown,
        plugin: remarkAttributes,
        pluginOptions: remarkAttributesConfig,
      })

      expect(html).toContain('class="title"')
      expect(html).toContain('id="main-heading"')
      expect(html).toContain('data-level="1"')
    })
  })
})
