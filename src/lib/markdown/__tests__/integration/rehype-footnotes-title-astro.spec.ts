import { describe, it, expect } from 'vitest'
import rehypeFootnotesTitle from '@lib/markdown/plugins/rehype-footnotes-title'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'
import { rehypeFootnotesTitleConfig } from '@lib/config/markdown'

describe('rehype-footnotes-title (Layer 2: With Astro Pipeline)', () => {
  it('should wrap footnote backrefs in explicit tooltip markup', async () => {
    const markdown = `Here is a footnote.[^1]

[^1]: My reference.`

    const html = await processWithAstroSettings({
      markdown,
      plugin: rehypeFootnotesTitle,
      pluginOptions: rehypeFootnotesTitleConfig,
      stage: 'rehype',
    })

    expect(html).toContain('<site-tooltip')
    expect(html).toContain('data-footnote-backref')
    expect(html).toContain('data-tooltip-trigger')
    expect(html).toContain('data-tooltip-popup')
    expect(html).toContain('Return to footnote 1')
    expect(html).not.toContain('title="Return to footnote 1"')
  })

  it('should set aria-labelledby on the footnotes section', async () => {
    const markdown = `Here is a footnote.[^1]

[^1]: My reference.`

    const html = await processWithAstroSettings({
      markdown,
      plugin: rehypeFootnotesTitle,
      pluginOptions: rehypeFootnotesTitleConfig,
      stage: 'rehype',
    })

    expect(html).toContain('data-footnotes')
    expect(html).toContain('aria-labelledby="footnote-label"')
    expect(html).toContain('id="footnote-label"')
    expect(html).not.toContain('class="sr-only"')
  })
})
