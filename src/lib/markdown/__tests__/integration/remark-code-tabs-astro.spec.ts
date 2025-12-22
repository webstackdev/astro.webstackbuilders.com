import { describe, it, expect } from 'vitest'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

describe('remark-code-tabs (Layer 2: Astro pipeline)', () => {
  it('should keep code block output and attach group/tab data attributes', async () => {
    const markdown = ['```js [g1:JavaScript]', 'console.log(1)', '```'].join('\n')

    const html = await processWithFullPipeline(markdown)

    expect(html).toContain('data-code-tabs-group="g1"')
    expect(html).toContain('data-code-tabs-tab="JavaScript"')
  })
})
