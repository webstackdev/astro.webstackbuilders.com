// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkBreaks
 *
 * Regression test:
 * We intentionally do NOT convert single newlines to hard line breaks (<br>)
 * in the site pipeline, because prose is often hard-wrapped and that would
 * introduce visible mid-sentence line breaks.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = `Line one
Line two
Line three

New paragraph`
  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkBreaks', () => {
  it('should not convert single newlines to hard line breaks', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).not.toContain('<br>')
    expect(container.querySelectorAll('br').length).toBe(0)
  })

  it('should preserve paragraph breaks for double newlines', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Double newlines should create separate paragraphs
    const paragraphCount = (html.match(/<p/g) || []).length
    expect(paragraphCount).toBeGreaterThanOrEqual(2)

    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBeGreaterThanOrEqual(2)
  })

  it('should maintain text content', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toContain('Line one')
    expect(html).toContain('Line two')
    expect(html).toContain('Line three')
    expect(html).toContain('New paragraph')

    expect(container.textContent).toContain('Line one')
    expect(container.textContent).toContain('Line two')
    expect(container.textContent).toContain('Line three')
    expect(container.textContent).toContain('New paragraph')
  })
})
