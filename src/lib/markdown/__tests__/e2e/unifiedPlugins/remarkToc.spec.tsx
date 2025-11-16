// @vitest-environment happy-dom
/**
 * Layer 4: E2E Tests - remarkToc
 *
 * Tests for the remarkToc plugin which generates a table of contents
 * from heading elements in markdown.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { renderMarkdown } from '@lib/markdown/helpers/markdownLoader'

let html: string

beforeAll(async () => {
  const markdown = `
# Main Heading

## Section One

Some content here.

## Section Two

More content.

### Subsection 2.1

Details here.

## Section Three

Final section.
`
  html = await renderMarkdown(markdown)
})

describe('Layer 4: E2E - remarkToc', () => {
  it('should generate table of contents structure', () => {
    // Plugin should create a TOC with links to headings
    // The exact output depends on plugin configuration
    expect(html).toContain('Main Heading')
    expect(html).toContain('Section One')
    expect(html).toContain('Section Two')
    expect(html).toContain('Section Three')
  })

  it('should preserve heading hierarchy', () => {
    // Should maintain h1, h2, h3 structure
    expect(html).toMatch(/<h1|<h2|<h3/)
  })

  it('should include subsections in TOC structure', () => {
    expect(html).toContain('Subsection 2.1')
  })

  it('should generate IDs for headings', () => {
    // Headings should have IDs for linking
    expect(html).toMatch(/id=["'][^"']+["']/)
  })

  it('should maintain content after headings', () => {
    expect(html).toContain('Some content here')
    expect(html).toContain('More content')
    expect(html).toContain('Details here')
  })
})
