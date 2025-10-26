// @vitest-environment happy-dom
/**
 * Layer 4: E2E Tests - Attributes Feature
 *
 * Tests for the remark-attr plugin rendering through the complete Astro pipeline
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { axe } from 'vitest-axe'
import { loadFixture, renderMarkdown, MarkdownOutput } from '../../../helpers/markdownLoader'

let html: string

// Load fixture once for all tests (just the markdown string, not rendered)
beforeAll(async () => {
  const markdown = loadFixture('attributes.md')
  html = await renderMarkdown(markdown)
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

describe('Layer 4: E2E - Attributes', () => {
  it('should render custom attributes on elements', async () => {
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
