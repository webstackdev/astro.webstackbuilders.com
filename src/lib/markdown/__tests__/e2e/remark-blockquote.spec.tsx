// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - Blockquote Feature
 *
 * Tests for the remark-blockquote plugin rendering through the complete Astro pipeline.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { axe } from 'vitest-axe'
import { loadFixture, MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = loadFixture('blockquote.md')
  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - Blockquote', () => {
  it('renders attribution and caption variants with semantic HTML', async () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Attribution-only: figure + figcaption
    expect(html).toContain('class="blockquote')
    expect(html).toContain('class="blockquote-attribution')

    // Caption: figure + figcaption
    expect(html).toContain('blockquote-figure')
    expect(html).toContain('class="blockquote-caption')

    // Combined: attribution should be a div when caption exists
    expect(html).toContain('<div class="blockquote-attribution')

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('uses semantic structure for each variant', async () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const attributionFigures = container.querySelectorAll('figure.blockquote:not(.blockquote-figure)')
    expect(attributionFigures.length).toBeGreaterThan(0)

    attributionFigures.forEach(figure => {
      expect(figure.querySelector('blockquote')).toBeTruthy()
      const attribution = figure.querySelector('figcaption.blockquote-attribution')
      expect(attribution).toBeTruthy()

      const attributionName = attribution?.querySelector('div > p')
      expect(attributionName?.textContent?.length).toBeGreaterThan(0)
    })

    const captionFigures = container.querySelectorAll('figure.blockquote-figure')
    expect(captionFigures.length).toBeGreaterThan(0)

    captionFigures.forEach(figure => {
      expect(figure.querySelector('blockquote')).toBeTruthy()
      const caption = figure.querySelector('figcaption.blockquote-caption')
      expect(caption).toBeTruthy()
    })

    const combinedFigure = Array.from(captionFigures).find(figure => {
      return figure.querySelector('div.blockquote-attribution') !== null
    })

    expect(combinedFigure).toBeTruthy()

    const combinedAttribution = combinedFigure?.querySelector('div.blockquote-attribution')
    expect(combinedAttribution?.querySelector('div > p')).toBeTruthy()
    expect(combinedAttribution?.querySelectorAll('div > p').length).toBeGreaterThan(1)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
