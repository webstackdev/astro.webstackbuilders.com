import { describe, it, expect } from 'vitest'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('Line breaks (no remark-breaks) (Layer 1: Isolated)', () => {
  const noopRemarkPlugin = () => (tree: unknown) => tree

  it('does not convert single newlines to <br> tags', async () => {
    const markdown = 'Line one\nLine two'

    const html = await processIsolated({ markdown, plugin: noopRemarkPlugin })

    expect(html).toContain('<p>Line one\nLine two</p>')
    expect(html.toLowerCase()).not.toContain('<br')
  })

  it('renders blank lines as paragraph breaks', async () => {
    const markdown = 'Line one\n\nLine two'

    const html = await processIsolated({ markdown, plugin: noopRemarkPlugin })

    expect(html).toContain('<p>Line one</p>')
    expect(html).toContain('<p>Line two</p>')
  })
})
