// @vitest-environment happy-dom
/**
 * Layer 4: E2E Tests - remarkLinkifyRegex
 *
 * Tests for the remarkLinkifyRegex plugin which automatically converts
 * URLs in text to clickable links.
 */

import { describe, it, expect, beforeAll } from "vitest"
import { renderMarkdown } from "@lib/markdown/helpers/markdownLoader"

let html: string

beforeAll(async () => {
  const markdown = `
Visit https://example.com for more info.
Check out http://test.org as well.
Email me at user@example.com
`
  html = await renderMarkdown(markdown)
})

describe('Layer 4: E2E - remarkLinkifyRegex', () => {
  it('should convert URLs to links', () => {
    expect(html).toContain('<a')
    expect(html).toContain('https://example.com')
    expect(html).toContain('http://test.org')
  })

  it('should handle multiple URLs in the same content', () => {
    const linkCount = (html.match(/<a/g) || []).length
    expect(linkCount).toBeGreaterThanOrEqual(2)
  })

  it('should maintain text content around URLs', () => {
    expect(html).toContain('Visit')
    expect(html).toContain('for more info')
    expect(html).toContain('Check out')
  })
})
