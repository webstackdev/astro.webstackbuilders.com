// @vitest-environment happy-dom
/**
 * Layer 4: E2E Tests - remarkBreaks
 *
 * Tests for the remarkBreaks plugin which adds support for hard line breaks
 * without requiring double spaces or backslashes.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { renderMarkdown } from '@lib/markdown/helpers/markdownLoader'

let html: string

beforeAll(async () => {
  const markdown = `Line one
Line two
Line three

New paragraph`
  html = await renderMarkdown(markdown)
})

describe('Layer 4: E2E - remarkBreaks', () => {
  it('should convert single newlines to hard line breaks', () => {
    // The plugin should convert single newlines to <br> tags
    expect(html).toContain('<br>')
  })

  it('should preserve paragraph breaks for double newlines', () => {
    // Double newlines should create separate paragraphs
    const paragraphCount = (html.match(/<p/g) || []).length
    expect(paragraphCount).toBeGreaterThanOrEqual(2)
  })

  it('should maintain text content', () => {
    expect(html).toContain('Line one')
    expect(html).toContain('Line two')
    expect(html).toContain('Line three')
    expect(html).toContain('New paragraph')
  })
})
