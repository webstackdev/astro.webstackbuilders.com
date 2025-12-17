import { describe, it, expect } from 'vitest'
import remarkMarkPlus from '@lib/markdown/plugins/remark-mark-plus'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('remark-mark-plus (Layer 2: Astro Pipeline)', () => {
  it('should convert ==marked== into <mark>marked</mark>', async () => {
    const markdown = 'My ==marked== text.'

    const html = await processWithAstroSettings({ markdown, plugin: remarkMarkPlus })

    expect(html).toContain('<mark>')
    expect(html).toContain('marked')
    expect(html).toContain('</mark>')
  })
})
