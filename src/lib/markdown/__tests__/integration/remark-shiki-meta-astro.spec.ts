import { describe, it, expect } from 'vitest'

import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

describe('remark-shiki-meta (Layer 2: Astro pipeline)', () => {
  it('should preserve cleaned fenced-code meta for Shiki transformers', async () => {
    const markdown = [
      '```ts [g1:TypeScript] {2} /bad/ ins={1} del={2} error={2} warning={1}',
      "console.log('ok')",
      "console.log('bad')",
      '```',
    ].join('\n')

    const html = await processWithFullPipeline(markdown)

    // remark-code-tabs should have removed the tab metadata
    expect(html).not.toContain('[g1:TypeScript]')

    // remark-shiki-meta stores meta in data-shiki-meta, but rehype-shiki should consume it and remove it
    expect(html).not.toContain('data-shiki-meta=')

    // Verify meta-based transformers ran
    expect(html).toMatch(/class="line[^"]*\bhighlighted\b/) // line highlight via {..}
    expect(html).toContain('class="highlighted-word"') // word highlight via /.../
    expect(html).toMatch(/class="line[^"]*\bdiff-ins\b/) // ins={..}
    expect(html).toMatch(/class="line[^"]*\bdiff-del\b/) // del={..}
    expect(html).toMatch(/class="line[^"]*\bline-error\b/) // error={..}
    expect(html).toMatch(/class="line[^"]*\bline-warning\b/) // warning={..}
  })
})
