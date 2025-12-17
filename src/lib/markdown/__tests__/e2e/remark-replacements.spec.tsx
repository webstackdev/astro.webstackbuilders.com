// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkReplacements
 *
 * Tests for the remarkReplacements plugin which handles typographic
 * replacements like arrows, fractions, and multiplication signs.
 * Note: Smart quotes, em dashes, and copyright symbols are handled by Astro's smartypants.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = `
Arrow right --> and left <--
Double arrow <==>
Plus-minus +- symbol
Fractions: 1/2, 1/4, 3/4
Multiplication: 2 x 4 equals 8
`
  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkReplacements', () => {
  it('should convert arrow symbols', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Plugin should convert --> to → and <-- to ←
    expect(html).toMatch(/→|&rarr;/)
    expect(html).toMatch(/←|&larr;/)

    expect(container.textContent).toContain('Arrow right')
  })

  it('should convert double arrows', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Should convert <==> to ⇔
    expect(html).toMatch(/⇔|&hArr;/)

    expect(container.textContent).toContain('Double arrow')
  })

  it('should convert plus-minus', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toMatch(/±|&plusmn;/)

    expect(container.textContent).toContain('Plus-minus')
  })

  it('should convert fractions', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toMatch(/½|&frac12;/)
    expect(html).toMatch(/¼|&frac14;/)
    expect(html).toMatch(/¾|&frac34;/)

    expect(container.textContent).toContain('Fractions:')
  })

  it('should convert multiplication sign', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toMatch(/×|&times;/)

    expect(container.textContent).toContain('Multiplication:')
  })

  it('should maintain text content', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toContain('equals')
    expect(html).toContain('symbol')

    expect(container.textContent).toContain('equals')
    expect(container.textContent).toContain('symbol')
  })
})
