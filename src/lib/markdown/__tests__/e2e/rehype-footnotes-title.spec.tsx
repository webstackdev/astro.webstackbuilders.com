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
  it('should wrap footnote backrefs in explicit tooltip markup', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const tooltip = container.querySelector('site-tooltip')
    const backref = container.querySelector('a[data-footnote-backref]')
    const popup = container.querySelector('[data-tooltip-popup]')

    expect(tooltip).toBeTruthy()
    expect(backref).toBeTruthy()
    expect(backref?.getAttribute('title')).toBeNull()
    expect(popup?.textContent).toBe('Return to footnote 1')
  })
})
