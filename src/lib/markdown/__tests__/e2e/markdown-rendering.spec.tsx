/**
 * Layer 4: E2E Markdown Rendering Tests
 *
 * These tests render actual markdown content through the complete Astro pipeline
 * and validate both rendering output and accessibility using the Axe library.
 *
 * Testing approach:
 * - Use fixtures from __fixtures__/markdown directory
 * - Render markdown through full pipeline (same as production)
 * - Test rendered HTML using Testing Library
 * - Validate accessibility with vitest-axe
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/preact'
import { axe } from 'vitest-axe'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Get the directory path for fixtures relative to this file
const fixturesDir = join(__dirname, '../../__fixtures__/markdown')

/**
 * Helper to load markdown fixtures
 */
function loadFixture(filename: string): string {
  const filePath = join(fixturesDir, filename)
  const content = readFileSync(filePath, 'utf-8')

  // Strip frontmatter if present
  const frontmatterRegex = /^---\n[\s\S]*?\n---\n/
  return content.replace(frontmatterRegex, '').trim()
}

/**
 * Helper to render markdown through the Test component
 * This simulates rendering through Astro's pipeline
 */
async function renderMarkdown(content: string) {
  // Import plugins and process markdown (same as Test component)
  const { remark } = await import('remark')
  const { default: remarkGfm } = await import('remark-gfm')
  const { default: remarkRehype } = await import('remark-rehype')
  const { default: rehypeStringify } = await import('rehype-stringify')
  const { default: rehypeSlug } = await import('rehype-slug')

  // Import custom plugins
  const remarkAbbrModule = await import('../../remark-abbr')
  const remarkAbbr = remarkAbbrModule.default

  const remarkAttrModule = await import('../../remark-attr')
  const remarkAttr = remarkAttrModule.default

  const remarkAttributionModule = await import('../../remark-attribution')
  const remarkAttribution = remarkAttributionModule.default

  const { default: remarkBreaks } = await import('remark-breaks')
  const { default: remarkEmoji } = await import('remark-emoji')

  const remarkLinkifyRegexModule = await import('remark-linkify-regex')
  const remarkLinkifyRegex = remarkLinkifyRegexModule.default

  const { default: remarkToc } = await import('remark-toc')
  const { rehypeAccessibleEmojis } = await import('rehype-accessible-emojis')
  const { default: rehypeAutolinkHeadings } = await import('rehype-autolink-headings')

  const rehypeTailwindModule = await import('../../plugins/rehype-tailwind')
  const { rehypeTailwindClasses } = rehypeTailwindModule

  // Import configs
  const configModule = await import('../../../config/markdown')
  const { remarkAttrConfig, remarkTocConfig, rehypeAutolinkHeadingsConfig, remarkRehypeConfig } =
    configModule

  // Process markdown through the full pipeline
  const processor = remark()
    .use(remarkGfm)
    .use(remarkAbbr)
    .use(remarkAttr, remarkAttrConfig)
    .use(remarkAttribution)
    .use(remarkBreaks)
    .use(remarkEmoji)
    .use(remarkLinkifyRegex(/^(https?:\/\/[^\s$.?#].[^\s]*)$/i))
    .use(remarkToc, remarkTocConfig)
    .use(remarkRehype, remarkRehypeConfig)
    .use(rehypeSlug)
    .use(rehypeAccessibleEmojis)
    .use(rehypeAutolinkHeadings, rehypeAutolinkHeadingsConfig)
    .use(rehypeTailwindClasses)
    .use(rehypeStringify)

  const result = await processor.process(content)
  const html = String(result)

  return html
}

/**
 * Wrapper component for rendering HTML in tests
 */
function MarkdownOutput({ html }: { html: string }) {
  return (
    <article
      className="markdown-content"
      data-testid="markdown-output"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// Cleanup after each test
afterEach(() => {
  cleanup()
})

describe('Layer 4: E2E Markdown Rendering', () => {
  describe('Abbreviations Feature', () => {
    it('should render abbreviations with proper HTML and accessibility', async () => {
      const markdown = loadFixture('abbreviations.md')
      const html = await renderMarkdown(markdown)
      const { container } = render(<MarkdownOutput html={html} />)

      // Check that abbreviations are rendered
      expect(html).toContain('<abbr')
      expect(html).toContain('title="Markdown Abstract Syntax Tree"')
      expect(html).toContain('title="HyperText Markup Language"')

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Attributes Feature', () => {
    it('should render custom attributes on elements', async () => {
      const markdown = loadFixture('attributes.md')
      const html = await renderMarkdown(markdown)
      const { container } = render(<MarkdownOutput html={html} />)

      // Check that custom classes are applied
      expect(html).toContain('class="custom-heading"')
      expect(html).toContain('class="custom-link"')
      expect(html).toContain('class="custom-code"')

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Attribution Feature', () => {
    it('should render blockquote attributions with semantic HTML', async () => {
      const markdown = loadFixture('attribution.md')
      const html = await renderMarkdown(markdown)
      const { container } = render(<MarkdownOutput html={html} />)

      // Check that attribution is wrapped in figure/figcaption
      // Note: figure will have additional Tailwind classes, so check for class presence
      expect(html).toContain('class="c-blockquote')
      expect(html).toContain('class="c-blockquote__attribution')
      expect(html).toContain('Neil Armstrong')
      expect(html).toContain('Alan Kay')

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Emoji Feature', () => {
    it('should render emojis with accessibility attributes', async () => {
      const markdown = loadFixture('emoji.md')
      const html = await renderMarkdown(markdown)
      const { container } = render(<MarkdownOutput html={html} />)

      // Check that emojis are converted
      expect(html).toContain('❤️')
      expect(html).toContain('🚀')
      expect(html).toContain('👍')
      expect(html).toContain('👎')

      // Check that emojis have accessibility attributes (from rehype-accessible-emojis)
      expect(html).toContain('role="img"')
      expect(html).toContain('aria-label')

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Full Pipeline Integration', () => {
    it('should render all features together with proper semantics and accessibility', async () => {
      const markdown = loadFixture('full-pipeline.md')
      const html = await renderMarkdown(markdown)
      const { container } = render(<MarkdownOutput html={html} />)

      // Verify all plugins contributed to the output
      expect(html).toContain('<abbr') // Abbreviations
      expect(html).toContain('class="custom-link"') // Attributes
      expect(html).toContain('class="c-blockquote') // Attribution
      expect(html).toContain('❤️') // Emoji
      expect(html).toContain('href="https://webstackbuilders.com"') // Auto-linking
      expect(html).toContain('class="anchor-link"') // Anchor headings

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should generate valid semantic HTML structure', async () => {
      const markdown = loadFixture('full-pipeline.md')
      const html = await renderMarkdown(markdown)
      const { container } = render(<MarkdownOutput html={html} />)

      // Verify proper heading hierarchy
      const h1 = container.querySelector('h1')
      const h2Elements = container.querySelectorAll('h2')

      expect(h1).toBeTruthy()
      expect(h2Elements.length).toBeGreaterThan(0)

      // Verify headings have IDs (from rehype-slug)
      expect(h1?.hasAttribute('id')).toBe(true)
      h2Elements.forEach(h2 => {
        expect(h2.hasAttribute('id')).toBe(true)
      })

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should handle complex markdown with GFM features', async () => {
      const markdown = loadFixture('full-pipeline.md')
      const html = await renderMarkdown(markdown)
      const { container } = render(<MarkdownOutput html={html} />)

      // GFM autolinks should work
      const links = container.querySelectorAll('a[href^="https://"]')
      expect(links.length).toBeGreaterThan(0)

      // Check that links are accessible
      links.forEach(link => {
        // Links should have href
        expect(link.getAttribute('href')).toBeTruthy()
      })

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Accessibility Compliance', () => {
    it('should ensure all abbreviations have title attributes', async () => {
      const markdown = loadFixture('abbreviations.md')
      const html = await renderMarkdown(markdown)
      const { container } = render(<MarkdownOutput html={html} />)

      const abbrs = container.querySelectorAll('abbr')
      expect(abbrs.length).toBeGreaterThan(0)

      abbrs.forEach(abbr => {
        expect(abbr.hasAttribute('title')).toBe(true)
        expect(abbr.getAttribute('title')?.length).toBeGreaterThan(0)
      })

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should ensure all emojis have proper ARIA attributes', async () => {
      const markdown = loadFixture('emoji.md')
      const html = await renderMarkdown(markdown)
      const { container } = render(<MarkdownOutput html={html} />)

      // Find emoji spans (rehype-accessible-emojis wraps emojis)
      const emojiElements = container.querySelectorAll('[role="img"]')
      expect(emojiElements.length).toBeGreaterThan(0)

      emojiElements.forEach(emoji => {
        expect(emoji.getAttribute('role')).toBe('img')
        expect(emoji.hasAttribute('aria-label')).toBe(true)
      })

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should ensure heading anchor links are accessible', async () => {
      const markdown = loadFixture('full-pipeline.md')
      const html = await renderMarkdown(markdown)
      const { container } = render(<MarkdownOutput html={html} />)

      // Find anchor links - these are <a> tags inside headings that contain .anchor-link spans
      // Query for headings that contain anchor links
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const headingsWithAnchors = Array.from(headings).filter(
        h => h.querySelector('.anchor-link') !== null
      )

      expect(headingsWithAnchors.length).toBeGreaterThan(0)

      headingsWithAnchors.forEach(heading => {
        // Find the <a> tag (parent of .anchor-link span)
        const anchorLink = heading.querySelector('a')
        expect(anchorLink).toBeTruthy()

        // Should have href pointing to the heading ID
        const href = anchorLink!.getAttribute('href')
        expect(href).toBeTruthy()
        expect(href!).toMatch(/^#/)
      })

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should ensure blockquote attributions use semantic HTML', async () => {
      const markdown = loadFixture('attribution.md')
      const html = await renderMarkdown(markdown)
      const { container } = render(<MarkdownOutput html={html} />)

      // Attributions should be in <figure> with <figcaption>
      const figures = container.querySelectorAll('figure.c-blockquote')
      expect(figures.length).toBeGreaterThan(0)

      figures.forEach(figure => {
        const blockquote = figure.querySelector('blockquote')
        const figcaption = figure.querySelector('figcaption')

        expect(blockquote).toBeTruthy()
        expect(figcaption).toBeTruthy()
        expect(figcaption?.classList.contains('c-blockquote__attribution')).toBe(true)
      })

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
