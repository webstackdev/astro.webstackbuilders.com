// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - rehypeAutolinkHeadings
 *
 * Tests for the rehypeAutolinkHeadings plugin which adds anchor links
 * to heading elements for easy section linking.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

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
  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - rehypeAutolinkHeadings', () => {
  it('should add IDs to headings', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Headings should have id attributes
    expect(html).toMatch(/<h[1-6][^>]*id=["'][^"']+["']/)

    const headingWithId = container.querySelector('h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]')
    expect(headingWithId).toBeTruthy()
  })

  it('should add anchor links to headings', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Plugin should wrap or add links within headings
    expect(html).toMatch(/<h[1-6][^>]*>.*<a/)

    const headingLink = container.querySelector('h1 a,h2 a,h3 a,h4 a,h5 a,h6 a')
    expect(headingLink).toBeTruthy()
  })

  it('should generate slugified IDs from heading text', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // IDs should be based on heading text
    expect(html).toMatch(/id=["']main-title["']|id=["']section-one["']|id=["']section-two["']/)

    const ids = Array.from(
      container.querySelectorAll('h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]')
    ).map(h => h.getAttribute('id'))
    expect(ids.join(' ')).toMatch(/main-title|section-one|section-two/)
  })

  it('should handle multiple heading levels', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const h1Count = (html.match(/<h1/g) || []).length
    const h2Count = (html.match(/<h2/g) || []).length
    const h3Count = (html.match(/<h3/g) || []).length

    expect(h1Count).toBeGreaterThanOrEqual(1)
    expect(h2Count).toBeGreaterThanOrEqual(2)
    expect(h3Count).toBeGreaterThanOrEqual(1)

    expect(container.querySelectorAll('h1').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelectorAll('h2').length).toBeGreaterThanOrEqual(2)
    expect(container.querySelectorAll('h3').length).toBeGreaterThanOrEqual(1)
  })

  it('should preserve heading text content', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toContain('Main Title')
    expect(html).toContain('Section One')
    expect(html).toContain('Section Two')
    expect(html).toContain('Subsection')

    expect(container.textContent).toContain('Main Title')
    expect(container.textContent).toContain('Section One')
    expect(container.textContent).toContain('Section Two')
    expect(container.textContent).toContain('Subsection')
  })

  it('should add accessible attributes to anchor links', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Heading anchor links should have an accessible name (axe: link-name)
    const headingAnchor = container.querySelector('h1 a,h2 a,h3 a,h4 a,h5 a,h6 a')
    expect(headingAnchor).toBeTruthy()
    expect(headingAnchor?.getAttribute('aria-label')).toBeTruthy()

    // The icon itself should remain hidden from screen readers
    expect(html).toMatch(/class=["'][^"']*anchor-link[^"']*["'][^>]*aria-hidden=["']true["']/)
  })
})
