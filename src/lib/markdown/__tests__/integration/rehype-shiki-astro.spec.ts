import { describe, it, expect } from 'vitest'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

describe('rehype-shiki (Layer 2: Astro pipeline)', () => {
  it('should highlight code fences and preserve code-tabs data attributes', async () => {
    const markdown = [
      '```ts [g1:TypeScript]',
      'const x: number = 1',
      '```',
      '',
      '```ts [g1:TypeScript]',
      'const y: number = 2',
      '```',
    ].join('\n')

    const html = await processWithFullPipeline(markdown)

    expect(html).toContain('<pre')
    expect(html).toContain('shiki')
    expect(html).toContain('data-language="typescript"')
    expect(html).toContain('data-code-tabs-group="g1"')
  })
})
