// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkLinkifyRegex
 *
 * Tests for the remarkLinkifyRegex plugin which automatically converts
 * URLs in text to clickable links.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = `
Visit https://example.com for more info.
Check out http://test.org as well.
Email me at user@example.com
`
  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkLinkifyRegex', () => {
  it('should convert URLs to links', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toContain('<a')
    expect(html).toContain('https://example.com')
    expect(html).toContain('http://test.org')

    const links = container.querySelectorAll('a')
    expect(links.length).toBeGreaterThanOrEqual(2)
  })

  it('should handle multiple URLs in the same content', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const linkCount = (html.match(/<a/g) || []).length
    expect(linkCount).toBeGreaterThanOrEqual(2)

    const links = container.querySelectorAll('a')
    expect(links.length).toBeGreaterThanOrEqual(2)
  })

  it('should maintain text content around URLs', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toContain('Visit')
    expect(html).toContain('for more info')
    expect(html).toContain('Check out')

    expect(container.textContent).toContain('Visit')
    expect(container.textContent).toContain('for more info')
    expect(container.textContent).toContain('Check out')
  })
})
