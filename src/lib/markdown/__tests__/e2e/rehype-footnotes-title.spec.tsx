// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - rehypeFootnotesTitle
 *
 * Tests for rehype-footnotes-title configured in the full pipeline.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = `Here is a footnote.[^1]

[^1]: My reference.`

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - rehypeFootnotesTitle', () => {
  it('should add a title attribute to footnote backrefs', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const backref = container.querySelector('a[data-footnote-backref]')
    expect(backref).toBeTruthy()
    expect(backref?.getAttribute('title')).toBe('Return to footnote 1')
  })
})
