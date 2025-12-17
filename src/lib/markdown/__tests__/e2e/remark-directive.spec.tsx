// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkDirective
 *
 * Ensures directive syntax is supported in the full pipeline.
 * In our pipeline, directives are used by remark-video (e.g. :::video blocks).
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

describe('Layer 3: E2E - remarkDirective', () => {
  it('should render directive-backed video output', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const figure = container.querySelector('[data-remark-video-figure]')
    expect(figure).not.toBeNull()

    const video = container.querySelector('video')
    expect(video).not.toBeNull()
  })
})
