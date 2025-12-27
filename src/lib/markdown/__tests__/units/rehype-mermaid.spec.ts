import { describe, it, expect } from 'vitest'
import rehypeMermaid from 'rehype-mermaid'

import { BuildError } from '@lib/errors/BuildError'
import { rehypeMermaidConfig } from '@lib/config/markdown'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('rehype-mermaid (Layer 1: Isolated)', () => {
  it('should use inline-svg strategy and a local CSS file', () => {
    expect(rehypeMermaidConfig.strategy).toBe('inline-svg')
    expect(String(rehypeMermaidConfig.css)).toContain('/src/styles/vendor/mermaid.css')
  })

  it('should throw BuildError from errorFallback', () => {
    const element = { type: 'element', tagName: 'code', properties: {}, children: [] }
    const diagram = 'graph TD\n  A --> B\n'
    const error = new Error('boom')
    const file = { path: '/fake/file.mdx' }

    expect(() => rehypeMermaidConfig.errorFallback(element, diagram, error, file)).toThrow(
      BuildError
    )
  })

  it('should render Mermaid code blocks to inline SVG', async () => {
    const markdown = ['```mermaid', 'graph TD;', '  A-->B;', '```'].join('\n')

    const html = await processIsolated({
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
