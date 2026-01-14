// @vitest-environment node

import { describe, it, expect, beforeAll } from 'vitest'

import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = [
    '```ts [g1:TypeScript] {2} /bad/ ins={1} del={2} error={2} warning={1}',
    "console.log('ok')",
    "console.log('bad')",
    '```',
  ].join('\n')

  html = await processWithFullPipeline(markdown)
})

describe('remark-shiki-meta (Layer 3: E2E)', () => {
  it('should apply meta-driven Shiki classes in final HTML', () => {
    expect(html).not.toContain('data-shiki-meta=')

    expect(html).toMatch(/class="line[^"]*\bhighlighted\b/)
    expect(html).toContain('class="highlighted-word"')
    expect(html).toMatch(/class="line[^"]*\bdiff-ins\b/)
    expect(html).toMatch(/class="line[^"]*\bdiff-del\b/)
    expect(html).toMatch(/class="line[^"]*\bline-error\b/)
    expect(html).toMatch(/class="line[^"]*\bline-warning\b/)
  })
})
