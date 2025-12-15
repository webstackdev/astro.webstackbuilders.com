import { describe, it, expect } from 'vitest'
import remarkSmartypants from '@lib/markdown/plugins/remark-smartypants'
import type { Root } from 'mdast'
import type { Plugin } from 'unified'

import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

const noopRemarkPlugin: Plugin<[], Root> = () => tree => {
  void tree
}

describe('remark-smartypants (Layer 2: With Astro Pipeline)', () => {
  it('should convert quotes, dashes, and ellipsis in normal text', async () => {
    const markdown = 'He said, "Hello" -- wait... then left.'

    // This pipeline always includes remarkSmartypants; the noop plugin just satisfies the helper signature.
    const html = await processWithAstroSettings({ markdown, plugin: noopRemarkPlugin })

    expect(html).toContain('He said, “Hello”')
    expect(html).toContain('–')
    expect(html).toContain('…')
  })

  it('should not modify inline code', async () => {
    const markdown = 'Inline: `"Hello" -- ...`'

    const html = await processWithAstroSettings({ markdown, plugin: noopRemarkPlugin })

    expect(html).toContain('<code>"Hello" -- ...</code>')
  })

  it('should behave the same as running remarkSmartypants directly in isolation', async () => {
    const markdown = 'One --- two'

    const isolated = await processWithAstroSettings({ markdown, plugin: remarkSmartypants })
    const baseline = await processWithAstroSettings({ markdown, plugin: noopRemarkPlugin })

    expect(isolated).toContain('One — two')
    expect(baseline).toContain('One — two')
  })
})
