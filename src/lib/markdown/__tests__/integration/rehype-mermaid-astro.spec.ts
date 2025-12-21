import { describe, it, expect } from 'vitest'
import rehypeMermaid from 'rehype-mermaid'

import { rehypeMermaidConfig } from '@lib/config/markdown'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('rehype-mermaid (Layer 2: With Astro Pipeline)', () => {
  it('should render Mermaid code blocks to inline SVG', async () => {
    const markdown = ['```mermaid', 'graph TD;', '  A-->B;', '```'].join('\n')

    const html = await processWithAstroSettings({
      markdown,
      plugin: rehypeMermaid,
      pluginOptions: rehypeMermaidConfig,
      stage: 'rehype',
    })

    expect(html).toContain('<svg')
    expect(html).toMatch(/id="mermaid-\d+"/)
    expect(html).not.toContain('language-mermaid')
  })
})
