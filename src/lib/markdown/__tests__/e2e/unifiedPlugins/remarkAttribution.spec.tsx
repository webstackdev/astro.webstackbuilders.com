// @vitest-environment happy-dom
/**
 * Layer 4: E2E Tests - Attribution Feature
 *
 * Tests for the remark-attribution plugin rendering through the complete Astro pipeline
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { axe } from 'vitest-axe'
import { loadFixture, renderMarkdown, MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'

let html: string

// Load fixture once for all tests (just the markdown string, not rendered)
beforeAll(async () => {
  const markdown = loadFixture('attribution.md')
  html = await renderMarkdown(markdown)
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

describe('Layer 4: E2E - Attribution', () => {
  describe('Feature Tests', () => {
    it('should render blockquote attributions with semantic HTML', async () => {
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

  describe('Accessibility Compliance', () => {
    it('should ensure blockquote attributions use semantic HTML', async () => {
      const { container } = render(<MarkdownOutput html={html} />)

      // Attributions should be in <figure> with <figcaption>
      const figures = container.querySelectorAll('figure.c-blockquote')
      expect(figures.length).toBeGreaterThan(0)

      figures.forEach((figure: Element) => {
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
