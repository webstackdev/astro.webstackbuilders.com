// @vitest-environment happy-dom
/**
 * Layer 3: Unified Plugin Tests - rehype-accessible-emojis
 *
 * Tests for the rehype-accessible-emojis plugin which wraps emoji characters
 * with proper accessibility attributes (role="img" and aria-label).
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { axe } from 'vitest-axe'
import { loadFixture, renderMarkdown, MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'

let html: string

// Load fixture once for all tests (just the markdown string, not rendered)
beforeAll(async () => {
  const markdown = loadFixture('emoji.md')
  html = await renderMarkdown(markdown)
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

describe('Layer 3: Unified Plugin - rehype-accessible-emojis', () => {
  it('should add accessibility attributes to emoji characters', async () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Check that emojis have accessibility attributes
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label')

    // Find emoji elements with accessibility attributes
    const emojiElements = container.querySelectorAll('[role="img"]')
    expect(emojiElements.length).toBeGreaterThan(0)
  })

  it('should ensure all emojis have proper ARIA attributes', async () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Find emoji spans (rehype-accessible-emojis wraps emojis)
    const emojiElements = container.querySelectorAll('[role="img"]')
    expect(emojiElements.length).toBeGreaterThan(0)

    emojiElements.forEach((emoji: Element) => {
      expect(emoji.getAttribute('role')).toBe('img')
      expect(emoji.hasAttribute('aria-label')).toBe(true)
      expect(emoji.getAttribute('aria-label')?.length).toBeGreaterThan(0)
    })
  })

  it('should pass accessibility compliance checks', async () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Check accessibility with axe
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
