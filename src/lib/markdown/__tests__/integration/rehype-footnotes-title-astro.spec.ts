import { describe, it, expect } from 'vitest'
import rehypeFootnotesTitle from '@lib/markdown/plugins/rehype-footnotes-title'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'
import { rehypeFootnotesTitleConfig } from '@lib/config/markdown'

describe('rehype-footnotes-title (Layer 2: With Astro Pipeline)', () => {
  it('should add a title attribute to footnote backrefs', async () => {
    const markdown = `Here is a footnote.[^1]

[^1]: My reference.`

    const html = await processWithAstroSettings({
      markdown,
      plugin: rehypeFootnotesTitle,
      pluginOptions: rehypeFootnotesTitleConfig,
      stage: 'rehype',
    })

    expect(html).toContain('data-footnote-backref')
    expect(html).toContain('title="Return to footnote 1"')
  })
})
