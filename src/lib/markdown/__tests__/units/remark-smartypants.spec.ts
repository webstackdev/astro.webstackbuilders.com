import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkSmartypants from '@lib/markdown/plugins/remark-smartypants'

import { processIsolated } from '@lib/markdown/helpers/processors'

describe('remark-smartypants (Layer 1: Isolated)', () => {
  it('should convert straight quotes into curly quotes', async () => {
    const markdown = 'He said, "Hello" and \'goodbye\'.'

    const html = await processIsolated({ markdown, plugin: remarkSmartypants })

    expect(html).toContain('He said, “Hello”')
    expect(html).toContain('‘goodbye’')
  })

  it('should convert backticks-style quotes (``like this\'\') into curly quotes', async () => {
    const markdown = "He said, ``like this'' and left."

    const html = await processIsolated({ markdown, plugin: remarkSmartypants })

    expect(html).toContain('He said, “like this”')
  })

  it('should convert -- and --- into en and em dashes', async () => {
    const markdown = 'One -- two --- three.'

    const html = await processIsolated({ markdown, plugin: remarkSmartypants })

    expect(html).toContain('One – two — three')
  })

  it('should convert ... and . . . into ellipsis', async () => {
    const markdown = 'Wait... or wait . . .'

    const html = await processIsolated({ markdown, plugin: remarkSmartypants })

    expect(html).toContain('Wait… or wait …')
  })

  it('should not modify content inside inline code or code blocks', async () => {
    const markdown = [
      'Outside: "Hello" -- ...',
      '',
      'Inline: `"Hello" -- ...`',
      '',
      '```text',
      '"Hello" -- ...',
      '```',
    ].join('\n')

    const html = await processIsolated({ markdown, plugin: remarkSmartypants })

    // Outside should be transformed
    expect(html).toContain('Outside: “Hello” – …')

    // Inline + block code should remain literal
    expect(html).toContain('<code>"Hello" -- ...</code>')
    expect(html).toContain('<code class="language-text">"Hello" -- ...\n</code>')
  })

  it('should not modify content within raw HTML blocks like <pre>, <code>, <kbd>, <math>, <script>', async () => {
    const markdown = [
      '<pre>"Hello" -- ...</pre>',
      '<code>"Hello" -- ...</code>',
      '<kbd>"Hello" -- ...</kbd>',
      '<math>"Hello" -- ...</math>',
      '<script>var x = "Hello"; // -- ...</script>',
    ].join('\n\n')

    const html = String(
      await remark()
        .use(remarkSmartypants)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(markdown)
    )

    expect(html).toContain('<pre>"Hello" -- ...</pre>')
    expect(html).toContain('<code>"Hello" -- ...</code>')
    expect(html).toContain('<kbd>"Hello" -- ...</kbd>')
    expect(html).toContain('<math>"Hello" -- ...</math>')
    expect(html).toContain('<script>var x = "Hello"; // -- ...</script>')
  })
})
