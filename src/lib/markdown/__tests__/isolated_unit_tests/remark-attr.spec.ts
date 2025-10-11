import { describe, it, expect } from 'vitest'
import remarkAttr from '../../remark-attr/index'
import { processIsolated } from '../../helpers/test-utils'
import { remarkAttrConfig } from '../../../config/markdown'

describe('remark-attr (Layer 1: Isolated)', () => {
  describe('headings', () => {
    it('should add attributes to headings', async () => {
      const markdown = '# Heading{.custom-heading}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('<h1')
      expect(html).toContain('class="custom-heading"')
      expect(html).toContain('Heading')
    })

    it('should add id to heading', async () => {
      const markdown = '## Section{#section-id}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('<h2')
      expect(html).toContain('id="section-id"')
    })
  })

  describe('links', () => {
    it('should add attributes to links', async () => {
      const markdown = '[link text](https://example.com){.external-link}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('<a')
      expect(html).toContain('href="https://example.com"')
      expect(html).toContain('class="external-link"')
    })

    it('should add multiple attributes to links', async () => {
      const markdown = '[link](https://example.com){target=_blank rel=noopener}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('target="_blank"')
      expect(html).toContain('rel="noopener"')
    })
  })

  describe('code blocks', () => {
    it('should add attributes to inline code', async () => {
      const markdown = '`code`{.highlight}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('<code')
      expect(html).toContain('class="highlight"')
    })
  })
})
