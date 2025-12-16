import { describe, it, expect } from 'vitest'
import rehypeExternalLinks from 'rehype-external-links'
import { rehypeExternalLinksConfig } from '@lib/config/markdown'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('rehype-external-links (Layer 1: Isolated)', () => {
  it('should add target and rel to external links', async () => {
    const markdown = 'External: [Example](https://example.com).'

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeExternalLinks,
      pluginOptions: rehypeExternalLinksConfig,
    })

    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer"')
  })

  it('should not modify relative links', async () => {
    const markdown = 'Internal: [Home](/).'

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeExternalLinks,
      pluginOptions: rehypeExternalLinksConfig,
    })

    expect(html).toContain('href="/"')
    expect(html).not.toContain('target="_blank"')
    expect(html).not.toContain('rel="noreferrer"')
  })
})
