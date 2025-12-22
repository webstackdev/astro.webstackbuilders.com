// @vitest-environment node

import { describe, it, expect, beforeAll } from 'vitest'

import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = [
    '```ts [g1:TypeScript]',
    'const x: number = 1',
    '```',
  ].join('\n')

  html = await processWithFullPipeline(markdown)
})

describe('rehype-shiki (Layer 3: E2E)', () => {
  it('should emit Shiki-highlighted <pre>', () => {
    expect(html).toContain('<pre')
    expect(html).toContain('shiki')
    expect(html).toContain('data-language="typescript"')
  })
})
