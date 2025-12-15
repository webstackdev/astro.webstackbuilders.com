import { describe, it, expect } from 'vitest'
import type { Root } from 'mdast'
import type { Plugin } from 'unified'

import { processWithAstroSettings } from '@lib/markdown/helpers/processors'
import { remarkRehypeConfig } from '@lib/config/markdown'

const noopRemarkPlugin: Plugin<[], Root> = () => tree => {
  void tree
}

describe('remark-gfm (Layer 2: With Astro Pipeline)', () => {
  it('should support tables, task lists, and strikethrough', async () => {
    const markdown = [
      '## GFM',
      '',
      '| Feature | Supported |',
      '| --- | --- |',
      '| Task lists | [x] |',
      '',
      '* [ ] to do',
      '* [x] done',
      '',
      '~~struck~~',
    ].join('\n')

    const html = await processWithAstroSettings({ markdown, plugin: noopRemarkPlugin })

    expect(html).toContain('<table')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('<del>struck</del>')
  })

  it('should support autolink literals', async () => {
    const markdown = 'www.example.com and contact@example.com'

    const html = await processWithAstroSettings({ markdown, plugin: noopRemarkPlugin })

    expect(html).toMatch(/href="https?:\/\/www\.example\.com"/)
    expect(html).toContain('href="mailto:contact@example.com"')
  })

  it('should support footnotes and apply Astro footnote labels', async () => {
    const markdown = [
      'Here is a simple footnote[^1].',
      '',
      'More content below the footnote reference.',
      '',
      '[^1]: My reference.',
    ].join('\n')

    const html = await processWithAstroSettings({ markdown, plugin: noopRemarkPlugin })

    expect(html).toContain(remarkRehypeConfig.footnoteLabel)
    expect(html).toContain(remarkRehypeConfig.footnoteBackLabel)
    expect(html).toMatch(/href="#(?:user-content-)?fn-?1"/)
  })
})
