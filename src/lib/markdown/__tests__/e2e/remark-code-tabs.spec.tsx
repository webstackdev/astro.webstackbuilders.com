// @vitest-environment node

import { describe, it, expect, beforeAll } from 'vitest'

import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = ['```js [g1:JavaScript]', 'console.log(1)', '```'].join('\n')
  html = await processWithFullPipeline(markdown)
})

describe('remark-code-tabs (Layer 3: E2E)', () => {
  it('should render data attributes in final HTML', () => {
    expect(html).toContain('data-code-tabs-group="g1"')
    expect(html).toContain('data-code-tabs-tab="JavaScript"')
  })
})
