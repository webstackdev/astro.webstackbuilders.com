import { describe, it, expect } from 'vitest'
import remarkAttr from '../../remark-attr/index'
import { processIsolated } from '../../helpers/test-utils'
import { remarkAttrConfig } from '../../../config/markdown'

describe('remark-attr (Layer 1: Isolated)', () => {
  describe('basic attribute functionality', () => {
    it('should add class to bracketed spans', async () => {
      const markdown = '[text content]{.my-class}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('class="my-class"')
      expect(html).toContain('text content')
    })

    it('should add id to bracketed spans', async () => {
      const markdown = '[text content]{#my-id}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('id="my-id"')
      expect(html).toContain('text content')
    })

    it('should add both class and id', async () => {
      const markdown = '[text content]{.my-class #my-id}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('class="my-class"')
      expect(html).toContain('id="my-id"')
    })

    it('should add custom attributes', async () => {
      const markdown = '[text content]{data-value=test}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('data-value="test"')
    })
  })

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

    it('should add attributes to fenced code blocks', async () => {
      const markdown = '```javascript{.my-code}\nconst x = 1;\n```'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('class="my-code"')
    })
  })

  describe('lists', () => {
    it('should add attributes to list items', async () => {
      const markdown = '- item{.special-item}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('class="special-item"')
    })
  })

  describe('images', () => {
    it('should add attributes to images', async () => {
      const markdown = '![alt text](image.jpg){.responsive-image}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('<img')
      expect(html).toContain('class="responsive-image"')
      expect(html).toContain('alt="alt text"')
    })

    it('should add width/height to images', async () => {
      const markdown = '![alt](image.jpg){width=300 height=200}'

      const html = await processIsolated(markdown, remarkAttr, remarkAttrConfig)

      expect(html).toContain('width="300"')
      expect(html).toContain('height="200"')
    })
  })
})
