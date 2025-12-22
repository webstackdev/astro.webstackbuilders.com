// @vitest-environment node

import { describe, it, expect, beforeAll } from 'vitest'

import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = [
    '```js [g1:JavaScript]',
    'console.log(1)',
    '```',
    '',
    '```ts [g1:TypeScript]',
    'console.log(2)',
    '```',
  ].join('\n')
  html = await processWithFullPipeline(markdown)
})

describe('rehype-code-tabs (Layer 3: E2E)', () => {
  it('should render <code-tabs> wrapper', () => {
    expect(html).toContain('<code-tabs')
    expect(html).toContain('class="code-tabs')
    expect(html).toContain('data-code-tabs-group="g1"')
  })
})
