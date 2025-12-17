// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - Abbreviations Feature
 *
 * Tests for the remark-abbr plugin rendering through the complete Astro pipeline
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { axe } from 'vitest-axe'
import { loadFixture, MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string
let markdown: string

// Load fixture once for all tests (just the markdown string, not rendered)
beforeAll(async () => {
  markdown = loadFixture('abbreviations.md')
  html = await processWithFullPipeline(markdown)
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - Abbreviations', () => {
  describe('Feature Tests', () => {
    it('should render abbreviations with proper HTML and accessibility', async () => {
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

  describe('Accessibility Compliance', () => {
    it('should ensure all abbreviations have title attributes', async () => {
      const { container } = render(<MarkdownOutput html={html} />)

      const abbrs = container.querySelectorAll('abbr')
      expect(abbrs.length).toBeGreaterThan(0)

      abbrs.forEach((abbr: Element) => {
        expect(abbr.hasAttribute('title')).toBe(true)
        expect(abbr.getAttribute('title')?.length).toBeGreaterThan(0)
      })

      // Check accessibility
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
