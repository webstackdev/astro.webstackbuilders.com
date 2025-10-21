/**
 * Layer 4: E2E Tests - Full Pipeline Integration
 *
 * Tests for all plugins working together through the complete Astro pipeline.
 * Uses the full-pipeline.md fixture which exercises all markdown features.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { axe } from 'vitest-axe'
import { loadFixture, renderMarkdown, MarkdownOutput } from '../../helpers/markdownLoader'

let html: string

// Load fixture once for all tests (just the markdown string, not rendered)
beforeAll(async () => {
  const markdown = loadFixture('full-pipeline.md')
  html = await renderMarkdown(markdown)
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

describe('Layer 4: E2E - Full Pipeline Integration', () => {
  describe('Feature Tests', () => {
    it('should render all features together with proper semantics and accessibility', async () => {
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
    it('should ensure heading anchor links are accessible', async () => {
      const { container } = render(<MarkdownOutput html={html} />)

      // Find anchor links - these are <a> tags inside headings that contain .anchor-link spans
      // Query for headings that contain anchor links
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const headingsWithAnchors = Array.from(headings).filter(
        (h: Element) => h.querySelector('.anchor-link') !== null
      )

      expect(headingsWithAnchors.length).toBeGreaterThan(0)

      headingsWithAnchors.forEach((heading: Element) => {
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
  })
})
