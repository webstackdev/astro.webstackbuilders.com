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

describe('Layer 3: E2E - rehypeMathjax', () => {
  it('should render math to SVG and inject stylesheet once', () => {
    render(<MarkdownOutput html={html} />)

    expect(html).toContain('<mjx-container')
    expect(html).toContain('jax="SVG"')
    expect(html).toContain('<svg')
    expect(html).toContain('<style')
    expect(html).not.toContain('language-math')
  })
})
