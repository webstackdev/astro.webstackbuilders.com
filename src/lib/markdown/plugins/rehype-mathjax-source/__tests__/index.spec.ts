import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import rehypeMathjaxSource from '@lib/markdown/plugins/rehype-mathjax-source'
import { processIsolated } from '@lib/markdown/helpers/processors'

const runPlugin = async (html: string): Promise<string> => {
  const result = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeMathjaxSource)
    .use(rehypeStringify)
    .process(html)

  return String(result)
}

describe('rehype-mathjax-source (Layer 1: Isolated)', () => {
  it('wraps inline math code in a span with data-math-source', async () => {
    const input = '<p>Inline: <code class="language-math math-inline">a^2 + b^2 = c^2</code></p>'

    const html = await runPlugin(input)

    expect(html).toContain('data-math-source="a^2 + b^2 = c^2"')
    expect(html).toContain('<span')
  })

  it('wraps display math code blocks in a div with data-math-source', async () => {
    const markdown = ['```math', 'E = mc^2', '```'].join('\n')

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeMathjaxSource,
    })

    expect(html).toContain('data-math-source="E = mc^2"')
    expect(html).toContain('<div')
  })

  it('normalizes whitespace in the extracted source', async () => {
    const markdown = ['```math', '  a  +  b  ', '```'].join('\n')

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeMathjaxSource,
    })

    expect(html).toContain('data-math-source="a + b"')
  })

  it('does not wrap non-math code elements', async () => {
    const markdown = '`const x = 1`'

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeMathjaxSource,
    })

    expect(html).not.toContain('data-math-source')
  })
})
