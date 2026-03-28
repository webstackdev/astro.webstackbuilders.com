import { describe, it, expect } from 'vitest'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

describe('rehype-mathjax-svg-alt (Layer 2: With Astro Pipeline)', () => {
  it('adds accessible labels to MathJax SVG output in full pipeline', async () => {
    const markdown = ['```math', 'E = mc^2', '```'].join('\n')

    const html = await processWithFullPipeline(markdown)

    expect(html).toContain('aria-label="Math expression: E = mc^2"')
    expect(html).toContain('<title>Math expression: E = mc^2</title>')
  })

  it('adds accessible labels to inline math in full pipeline', async () => {
    const markdown = 'Inline math: $$a^2 + b^2 = c^2$$.'

    const html = await processWithFullPipeline(markdown)

    expect(html).toContain('aria-label="Math expression: a^2 + b^2 = c^2"')
  })
})
