import { describe, it, expect } from 'vitest'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

describe('rehype-code-tabs (Layer 2: Astro pipeline)', () => {
  it('should wrap consecutive grouped code blocks in <code-tabs>', async () => {
    const markdown = [
      '```js [g1:JavaScript]',
      'console.log(1)',
      '```',
      '',
      '```ts [g1:TypeScript]',
      'console.log(2)',
      '```',
    ].join('\n')

    const html = await processWithFullPipeline(markdown)

    expect(html).toContain('<code-tabs')
    expect(html).toContain('class="code-tabs')
    expect(html).toContain('data-code-tabs-group="g1"')
  })
})
