import { describe, it, expect } from 'vitest'
import remarkCaptions from 'remark-captions'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'
import { remarkCaptionsConfig } from '@lib/config/markdown'

describe('remark-captions (Layer 2: Astro Pipeline)', () => {
  it('should wrap captioned elements in figure/figcaption', async () => {
    const markdown = [
      '> Quote text',
      '>',
      '> Source: Quote caption',
      '',
      '| a | b |',
      '| - | - |',
      '| 1 | 2 |',
      '',
      'Table: Table caption',
      '',
      '```ts',
      'export const answer = 42',
      '```',
      'Code: Code caption',
      '',
      '![Alt](/assets/images/branding/wordmark.svg)',
      'Figure: Image caption',
    ].join('\n')

    const html = await processWithAstroSettings({
      markdown,
      plugin: remarkCaptions,
      pluginOptions: remarkCaptionsConfig,
    })

    expect(html.match(/<figure>/g)?.length).toBeGreaterThanOrEqual(4)
    expect(html).toContain('Quote caption')
    expect(html).toContain('Table caption')
    expect(html).toContain('Code caption')
    expect(html).toContain('Image caption')
  })
})
