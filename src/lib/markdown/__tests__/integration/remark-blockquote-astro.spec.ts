import { describe, it, expect } from 'vitest'
import remarkBlockquote from '@lib/markdown/plugins/remark-blockquote/index'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('remark-blockquote (Layer 2: With Astro Pipeline)', () => {
  it('renders attribution-only blockquotes with expected semantic elements', async () => {
    const markdown = [
      "> That's ~~not~~ **definitely** one small step.",
      '> — Neil Armstrong',
    ].join('\n')

    const html = await processWithAstroSettings({ markdown, plugin: remarkBlockquote })

    expect(html).toContain('<figure class="blockquote')
    expect(html).toContain('<figcaption class="blockquote-attribution')
    expect(html).toContain('<figcaption class="blockquote-attribution"><div><p>Neil Armstrong</p>')
    expect(html).toContain('<strong>definitely</strong>')
    expect(html).toContain('<del>not</del>')
    expect(html).toContain('Neil Armstrong')
  })

  it('renders caption-only blockquotes with expected semantic elements', async () => {
    const markdown = ['> Quote text', '> Source: Quote caption'].join('\n')

    const html = await processWithAstroSettings({ markdown, plugin: remarkBlockquote })

    expect(html).toContain('<figure class="blockquote blockquote-figure')
    expect(html).toContain('<figcaption class="blockquote-caption')
    expect(html).toContain('Quote caption')
  })

  it('renders caption + attribution with caption figcaption and attribution div', async () => {
    const markdown = ['> Quote text', '> — Attribution', '> Source: Quote caption'].join('\n')

    const html = await processWithAstroSettings({ markdown, plugin: remarkBlockquote })

    expect(html).toContain('<figure class="blockquote blockquote-figure')
    expect(html).toContain('<div class="blockquote-attribution')
    expect(html).toContain('<div class="blockquote-attribution"><div><p>Attribution</p>')
    expect(html).toContain('<figcaption class="blockquote-caption')
  })

  it('extracts URL and applies cite attribute on the blockquote', async () => {
    const markdown = ['> Great quote', '> — https://example.com Author Name'].join('\n')

    const html = await processWithAstroSettings({ markdown, plugin: remarkBlockquote })

    expect(html).toContain('cite="https://example.com"')
    expect(html).toContain('Author Name')
  })
})
