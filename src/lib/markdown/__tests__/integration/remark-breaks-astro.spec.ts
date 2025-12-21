import { describe, it, expect } from 'vitest'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('Line breaks (no remark-breaks) (Layer 2: With Astro Pipeline)', () => {
  const noopRemarkPlugin = () => (tree: unknown) => tree

  it('does not convert single newlines to <br> tags', async () => {
    const markdown = `Line one
Line two`

    const html = await processWithAstroSettings({ markdown, plugin: noopRemarkPlugin })

    expect(html).toContain('Line one')
    expect(html).toContain('Line two')
    expect(html.toLowerCase()).not.toContain('<br')
  })

  it('still treats blank lines as paragraph breaks', async () => {
    const markdown = `Line one

Line two`

    const html = await processWithAstroSettings({ markdown, plugin: noopRemarkPlugin })

    expect(html).toContain('<p>Line one</p>')
    expect(html).toContain('<p>Line two</p>')
  })

  it('does not interfere with GFM strikethrough', async () => {
    const markdown = `First line
~~Second line~~
Third line`

    const html = await processWithAstroSettings({ markdown, plugin: noopRemarkPlugin })

    expect(html).toContain('First line')
    expect(html).toContain('<del>Second line</del>')
    expect(html).toContain('Third line')
  })
})
