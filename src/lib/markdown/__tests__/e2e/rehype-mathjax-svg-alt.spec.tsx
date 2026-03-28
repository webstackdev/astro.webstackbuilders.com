// @vitest-environment happy-dom

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = ['```math', 'E = mc^2', '```'].join('\n')

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - rehypeMathjaxSvgAlt', () => {
  it('adds aria-label to the MathJax SVG element', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const svg = container.querySelector('svg[aria-label]')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('aria-label')).toBe('Math expression: E = mc^2')
  })

  it('adds a title element inside the SVG', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const title = container.querySelector('svg title')
    expect(title).toBeTruthy()
    expect(title?.textContent).toBe('Math expression: E = mc^2')
  })
})
