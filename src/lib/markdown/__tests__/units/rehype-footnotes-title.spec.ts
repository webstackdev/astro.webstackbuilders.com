import { describe, it, expect } from 'vitest'
import rehypeFootnotesTitle from '@lib/markdown/plugins/rehype-footnotes-title'
import { rehypeFootnotesTitleConfig } from '@lib/config/markdown'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('rehype-footnotes-title (Layer 1: Isolated)', () => {
  it('should add title attribute to footnote backrefs', async () => {
    const markdown = `Here is a footnote.[^1]

[^1]: My reference.`

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeFootnotesTitle,
      pluginOptions: rehypeFootnotesTitleConfig,
      gfm: true,
    })

    expect(html).toContain('data-footnote-backref')
    expect(html).toContain('title="Return to footnote 1"')
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
})
