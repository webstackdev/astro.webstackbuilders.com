import { describe, it, expect } from 'vitest'
import { rehypeInlineCodeColorSwatch } from '@lib/markdown/plugins/rehype-inline-code-color-swatch'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('rehype-inline-code-color-swatch (Layer 1: Isolated)', () => {
  it('adds a swatch only for inline code colors', async () => {
    const markdown = 'Colors: `#0969DA` `rgb(9, 105, 218)` `hsl(212, 92%, 45%)`.'

    const html = await processIsolated({ markdown, plugin: rehypeInlineCodeColorSwatch, stage: 'rehype' })

    expect(html).toContain('data-color-swatch="true"')
    expect(html).toContain('background-color: #0969DA')
    expect(html).toContain('background-color: rgb(9, 105, 218)')
    expect(html).toContain('background-color: hsl(212, 92%, 45%)')
  })

  it('does not add a swatch for non-backticked colors', async () => {
    const markdown = 'Color: #0969DA rgb(9, 105, 218) hsl(212, 92%, 45%).'

    const html = await processIsolated({ markdown, plugin: rehypeInlineCodeColorSwatch, stage: 'rehype' })

    expect(html).not.toContain('data-color-swatch="true"')
  })

  it('does not add a swatch for code blocks', async () => {
    const markdown = ['```css', 'color: #0969DA;', 'background: rgb(9, 105, 218);', '```'].join('\n')

    const html = await processIsolated({ markdown, plugin: rehypeInlineCodeColorSwatch, stage: 'rehype' })

    expect(html).toContain('<pre')
    expect(html).not.toContain('data-color-swatch="true"')
  })
})
