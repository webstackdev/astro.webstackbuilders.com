import { describe, it, expect } from 'vitest'
import rehypeMathjaxSource from '@lib/markdown/plugins/rehype-mathjax-source'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('rehype-mathjax-source (Layer 2: With Astro Pipeline)', () => {
  it('wraps display math code blocks with data-math-source in Astro pipeline', async () => {
    const markdown = ['```math', 'E = mc^2', '```'].join('\n')

    const html = await processWithAstroSettings({
      markdown,
      stage: 'rehype',
      plugin: rehypeMathjaxSource,
    })

    expect(html).toContain('data-math-source="E = mc^2"')
    expect(html).toContain('<div')
  })

  it('preserves non-math code blocks unchanged in Astro pipeline', async () => {
    const markdown = ['```js', 'const x = 1', '```'].join('\n')

    const html = await processWithAstroSettings({
      markdown,
      stage: 'rehype',
      plugin: rehypeMathjaxSource,
    })

    expect(html).not.toContain('data-math-source')
  })
})
