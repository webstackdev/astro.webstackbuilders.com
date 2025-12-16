import { describe, it, expect } from 'vitest'
import rehypeExternalLinks from 'rehype-external-links'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'
import { rehypeExternalLinksConfig } from '@lib/config/markdown'

describe('rehype-external-links (Layer 2: With Astro Pipeline)', () => {
  it('should add target and rel to external markdown links', async () => {
    const markdown = 'External: [Example](https://example.com).'

    const html = await processWithAstroSettings({
      markdown,
      plugin: rehypeExternalLinks,
      pluginOptions: rehypeExternalLinksConfig,
      stage: 'rehype',
    })

    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer"')
  })

  it('should not add target/rel to internal anchors', async () => {
    const markdown = 'Jump: [Section](#my-section) and [Home](/).'

    const html = await processWithAstroSettings({
      markdown,
      plugin: rehypeExternalLinks,
      pluginOptions: rehypeExternalLinksConfig,
      stage: 'rehype',
    })

    expect(html).toContain('href="#my-section"')
    expect(html).toContain('href="/"')
    expect(html).not.toContain('target="_blank"')
    expect(html).not.toContain('rel="noreferrer"')
  })
})
