import { describe, it, expect } from 'vitest'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

describe('remark-directive (Layer 2: With Astro Pipeline)', () => {
  it('should enable :::video blocks to be parsed and rendered by downstream plugins', async () => {
    const markdown = [':::video', '/videos/sample-video-1.mp4', ':::'].join('\n')

    const html = await processWithFullPipeline(markdown)

    expect(html).toContain('data-remark-video-figure')
    expect(html).toContain('<video')
  })
})
