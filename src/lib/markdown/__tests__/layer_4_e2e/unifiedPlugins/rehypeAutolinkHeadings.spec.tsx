/**
 * Layer 4: E2E Tests - rehypeAutolinkHeadings
 *
 * Tests for the rehypeAutolinkHeadings plugin which adds anchor links
 * to heading elements for easy section linking.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { renderMarkdown } from '../../../helpers/markdownLoader'

let html: string

beforeAll(async () => {
  const markdown = `
# Main Title

## Section One

Content here.

## Section Two

More content.

### Subsection

Details.
`
  html = await renderMarkdown(markdown)
})

describe('Layer 4: E2E - rehypeAutolinkHeadings', () => {
  it('should add IDs to headings', () => {
    // Headings should have id attributes
    expect(html).toMatch(/<h[1-6][^>]*id=["'][^"']+["']/)
  })

  it('should add anchor links to headings', () => {
    // Plugin should wrap or add links within headings
    expect(html).toMatch(/<h[1-6][^>]*>.*<a/)
  })

  it('should generate slugified IDs from heading text', () => {
    // IDs should be based on heading text
    expect(html).toMatch(/id=["']main-title["']|id=["']section-one["']|id=["']section-two["']/)
  })

  it('should handle multiple heading levels', () => {
    const h1Count = (html.match(/<h1/g) || []).length
    const h2Count = (html.match(/<h2/g) || []).length
    const h3Count = (html.match(/<h3/g) || []).length
    
    expect(h1Count).toBeGreaterThanOrEqual(1)
    expect(h2Count).toBeGreaterThanOrEqual(2)
    expect(h3Count).toBeGreaterThanOrEqual(1)
  })

  it('should preserve heading text content', () => {
    expect(html).toContain('Main Title')
    expect(html).toContain('Section One')
    expect(html).toContain('Section Two')
    expect(html).toContain('Subsection')
  })

  it('should add accessible attributes to anchor links', () => {
    // Anchor links should have aria-hidden or similar for accessibility
    expect(html).toMatch(/aria-hidden=["']true["']/)
  })
})
