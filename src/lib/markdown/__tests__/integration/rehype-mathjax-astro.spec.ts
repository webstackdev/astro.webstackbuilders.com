import { describe, it, expect } from 'vitest'
import rehypeMathjax from 'rehype-mathjax'

import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('rehype-mathjax (Layer 2: With Astro Pipeline)', () => {
  it('should render fenced ```math blocks to SVG MathJax output', async () => {
    const markdown = ['```math', 'E = mc^2', '```'].join('\n')

    const html = await processWithAstroSettings({
      markdown,
      plugin: rehypeMathjax,
      stage: 'rehype',
    })

    expect(html).toContain('<mjx-container')
    expect(html).toContain('jax="SVG"')
    expect(html).toContain('<svg')
    expect(html).toContain('<style')
    expect(html).not.toContain('language-math')
  })
})
