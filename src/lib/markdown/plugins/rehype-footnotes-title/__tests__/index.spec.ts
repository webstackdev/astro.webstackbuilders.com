import { describe, it, expect } from 'vitest'
import rehypeFootnotesTitle from '@lib/markdown/plugins/rehype-footnotes-title'
import { rehypeFootnotesTitleConfig } from '@lib/config/markdown'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('rehype-footnotes-title (Layer 1: Isolated)', () => {
  it('should wrap footnote backrefs in explicit tooltip markup', async () => {
    const markdown = `Here is a footnote.[^1]

[^1]: My reference.`

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeFootnotesTitle,
      pluginOptions: rehypeFootnotesTitleConfig,
      gfm: true,
    })

    expect(html).toContain('<site-tooltip')
    expect(html).toContain('data-footnote-backref')
    expect(html).toContain('data-tooltip-trigger')
    expect(html).toContain('data-tooltip-popup')
    expect(html).toContain('Return to footnote 1')
    expect(html).not.toContain('title="Return to footnote 1"')
  })

  it('should not add title attribute to footnote references', async () => {
    const markdown = `Here is a footnote.[^1]

[^1]: My reference.`

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeFootnotesTitle,
      pluginOptions: rehypeFootnotesTitleConfig,
      gfm: true,
    })

    expect(html).toContain('data-footnote-ref')
    expect(html).not.toContain('data-footnote-ref" title=')
  })

  it('should link footnotes section to its Footnotes heading with aria-labelledby', async () => {
    const markdown = `Here is a footnote.[^1]

[^1]: My reference.`

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeFootnotesTitle,
      pluginOptions: rehypeFootnotesTitleConfig,
      gfm: true,
    })

    expect(html).toContain('data-footnotes')
    expect(html).toContain('aria-labelledby="footnote-label"')
    expect(html).toContain('id="footnote-label"')
    expect(html).not.toContain('class="sr-only"')
  })
})
