// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkVideo
 *
 * Ensures :::video directive blocks render as HTML5 <video> output in the full pipeline.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = [':::video', '/videos/sample-video-1.mp4', ':::'].join('\n')

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkVideo', () => {
  it('should render video markup with a <video> element', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const figure = container.querySelector('[data-remark-video-figure]')
    expect(figure).not.toBeNull()

    const video = container.querySelector('video')
    expect(video).not.toBeNull()

    const source = container.querySelector('video source')
    expect(source).not.toBeNull()
    expect(source?.getAttribute('src')).toBe('/videos/sample-video-1.mp4')
  })
})
