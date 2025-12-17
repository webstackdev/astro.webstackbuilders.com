// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkYoutube
 *
 * Ensures YouTube URLs are converted to embedded iframes in the full pipeline.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = ['https://youtu.be/enTFE2c68FQ', '', 'https://www.youtube.com/watch?v=enTFE2c68FQ'].join('\n')
  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkYoutube', () => {
  it('should render two embedded iframes', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const iframes = Array.from(container.querySelectorAll('iframe'))
    expect(iframes).toHaveLength(2)

    for (const iframe of iframes) {
      expect(iframe.getAttribute('src')).toBe('https://www.youtube.com/embed/enTFE2c68FQ')
      expect(iframe.getAttribute('width')).toBe('560')
      expect(iframe.getAttribute('height')).toBe('315')
    }
  })

  it('should not leave the raw URLs as visible text', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(container.textContent).not.toContain('https://youtu.be/enTFE2c68FQ')
    expect(container.textContent).not.toContain('https://www.youtube.com/watch?v=enTFE2c68FQ')
  })
})
