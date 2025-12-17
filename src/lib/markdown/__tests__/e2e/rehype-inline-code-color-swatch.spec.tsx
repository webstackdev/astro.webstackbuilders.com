// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - rehypeInlineCodeColorSwatch
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'
import { isSpanElement } from '@components/scripts/assertions/elements'

let html: string

beforeAll(async () => {
  const markdown = [
    '# Colors',
    '',
    'Inline colors: `#0969DA`, `rgb(9, 105, 218)`, `hsl(212, 92%, 45%)`.',
    '',
    'Not inline code: #0969DA rgb(9, 105, 218) hsl(212, 92%, 45%).',
    '',
    '```css',
    'color: #0969DA;',
    'background: rgb(9, 105, 218);',
    'border-color: hsl(212, 92%, 45%);',
    '```',
  ].join('\n')

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - rehypeInlineCodeColorSwatch', () => {
  it('adds a swatch span inside inline code for supported colors', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const swatches = Array.from(container.querySelectorAll('code span[data-color-swatch="true"]'))
    expect(swatches.length).toBeGreaterThanOrEqual(3)

    const first = swatches[0]
    expect(isSpanElement(first)).toBe(true)
    if (!isSpanElement(first)) return
    expect(first.getAttribute('style') || '').toMatch(/background-color:\s*#0969DA/i)
  })

  it('does not add a swatch for non-backticked colors', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const paragraph = Array.from(container.querySelectorAll('p')).find(p =>
      (p.textContent || '').includes('Not inline code:')
    )
    expect(paragraph).toBeTruthy()

    const swatchesInParagraph = paragraph?.querySelectorAll('span[data-color-swatch="true"]')
    expect(swatchesInParagraph?.length || 0).toBe(0)
  })

  it('does not add a swatch inside code blocks', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const pre = container.querySelector('pre')
    expect(pre).toBeTruthy()

    const swatchesInPre = pre?.querySelectorAll('span[data-color-swatch="true"]')
    expect(swatchesInPre?.length || 0).toBe(0)
  })
})
