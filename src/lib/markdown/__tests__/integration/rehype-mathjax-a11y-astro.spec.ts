import { describe, it, expect } from 'vitest'

import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

describe('rehype-mathjax accessibility (Layer 2: Astro pipeline)', () => {
  it('adds accessible labels to inline and display MathJax SVG output', async () => {
    const markdown = [
      'Inline math: $$a^2 + b^2 = c^2$$.',
      '',
      '```math',
      'E = mc^2',
      '```',
    ].join('\n')

    const html = await processWithFullPipeline(markdown)

    expect(html).toContain('aria-label="Math expression: a^2 + b^2 = c^2"')
    expect(html).toContain('aria-label="Math expression: E = mc^2"')
    expect(html).toContain('<title>Math expression: a^2 + b^2 = c^2</title>')
    expect(html).toContain('<title>Math expression: E = mc^2</title>')
  })
})