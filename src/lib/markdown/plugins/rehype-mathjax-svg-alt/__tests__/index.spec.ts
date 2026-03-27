import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import rehypeMathjaxSvgAlt from '@lib/markdown/plugins/rehype-mathjax-svg-alt'

const runPlugin = async (html: string): Promise<string> => {
  const result = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeMathjaxSvgAlt)
    .use(rehypeStringify)
    .process(html)

  return String(result)
}

describe('rehype-mathjax-svg-alt (Layer 1: Isolated)', () => {
  it('adds aria-label and title to SVG inside a data-math-source wrapper', async () => {
    const input = '<span data-math-source="a^2 + b^2"><svg><path d="M0 0"></path></svg></span>'

    const html = await runPlugin(input)

    expect(html).toContain('aria-label="Math expression: a^2 + b^2"')
    expect(html).toContain('title="Math expression: a^2 + b^2"')
    expect(html).toContain('<title>Math expression: a^2 + b^2</title>')
  })

  it('adds accessible labels to display math (div wrapper)', async () => {
    const input = '<div data-math-source="E = mc^2"><svg><path d="M0 0"></path></svg></div>'

    const html = await runPlugin(input)

    expect(html).toContain('aria-label="Math expression: E = mc^2"')
    expect(html).toContain('<title>Math expression: E = mc^2</title>')
  })

  it('does not add a duplicate title element when one exists', async () => {
    const input =
      '<span data-math-source="x"><svg><title>Existing</title><path d="M0 0"></path></svg></span>'

    const html = await runPlugin(input)

    expect(html).toContain('aria-label="Math expression: x"')
    expect(html).toContain('<title>Existing</title>')
    expect(html).not.toContain('<title>Math expression: x</title>')
  })

  it('skips elements without data-math-source', async () => {
    const input = '<span><svg><path d="M0 0"></path></svg></span>'

    const html = await runPlugin(input)

    expect(html).not.toContain('aria-label')
    expect(html).not.toContain('<title>')
  })

  it('skips wrappers with no SVG descendant', async () => {
    const input = '<span data-math-source="x"><code>x</code></span>'

    const html = await runPlugin(input)

    expect(html).not.toContain('aria-label')
  })
})
