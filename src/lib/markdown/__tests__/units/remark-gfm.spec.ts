import { describe, it, expect } from 'vitest'
import remarkGfm from 'remark-gfm'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('remark-gfm (Layer 1: Isolated)', () => {
  it('should autolink URLs and email addresses', async () => {
    const markdown = 'www.example.com, https://example.com, and contact@example.com.'

    const html = await processIsolated({ markdown, plugin: remarkGfm })

    expect(html).toMatch(/href="https?:\/\/www\.example\.com"/)
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('href="mailto:contact@example.com"')
  })

  it('should support strikethrough', async () => {
    const markdown = '`~one~` and ~~two~~'

    const html = await processIsolated({ markdown, plugin: remarkGfm })

    expect(html).toContain('<code>~one~</code>')
    expect(html).toContain('<del>two</del>')
  })

  it('should support tables', async () => {
    const markdown = [
      '| a | b  |  c |  d  |',
      '| - | :- | -: | :-: |',
      '| 1 | 2  |  3 |  4  |',
    ].join('\n')

    const html = await processIsolated({ markdown, plugin: remarkGfm })

    expect(html).toContain('<table>')
    expect(html).toContain('<th>a</th>')
    expect(html).toContain('<td>1</td>')
  })

  it('should support task lists', async () => {
    const markdown = ['* [ ] to do', '* [x] done'].join('\n')

    const html = await processIsolated({ markdown, plugin: remarkGfm })

    expect(html).toContain('type="checkbox"')
    expect(html).toContain('disabled')
    expect(html).toMatch(/checked(=\"\"|\b)/)
  })

  it('should support footnotes', async () => {
    const markdown = [
      'Here is a simple footnote[^1].',
      '',
      'More content after the reference.',
      '',
      '[^1]: My reference.',
    ].join('\n')

    const html = await processIsolated({ markdown, plugin: remarkGfm })

    // Output varies across versions (e.g. `#fn1` vs `#user-content-fn-1`).
    expect(html).toMatch(/href="#(?:user-content-)?fn-?1"/)
    expect(html).toMatch(/id="(?:user-content-)?fn-?1"/)
    expect(html).toContain('Footnotes')
  })
})
