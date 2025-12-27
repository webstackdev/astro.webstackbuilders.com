// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - rehypeHeadingIds
 *
 * Verifies that heading IDs are generated in the full configured pipeline.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = `
# Hello World

## Hello World

## Hello World

### A heading with punctuation!
`

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - rehypeHeadingIds', () => {
  it('adds ids to headings in the rendered HTML', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const headingsWithId = container.querySelectorAll('h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]')
    expect(headingsWithId.length).toBeGreaterThanOrEqual(1)

    expect(html).toMatch(/<h[1-6][^>]*id=["'][^"']+["']/)
  })

  it('generates slug ids from heading text and deduplicates repeats', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const ids = Array.from(container.querySelectorAll('h1[id],h2[id],h3[id]')).map(h =>
      h.getAttribute('id')
    )

    expect(ids).toContain('hello-world')
    expect(ids).toContain('hello-world-1')
    expect(ids).toContain('hello-world-2')
    expect(ids).toContain('a-heading-with-punctuation')
  })
})
