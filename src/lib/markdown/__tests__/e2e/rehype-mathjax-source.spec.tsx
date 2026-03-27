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

describe('Layer 3: E2E - rehypeMathjaxSource', () => {
  it('preserves the original TeX source in data-math-source', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const wrapper = container.querySelector('[data-math-source]')
    expect(wrapper).toBeTruthy()
    expect(wrapper?.getAttribute('data-math-source')).toBe('E = mc^2')
  })

  it('wraps display math in a div wrapper', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const wrapper = container.querySelector('div[data-math-source]')
    expect(wrapper).toBeTruthy()
  })
})
