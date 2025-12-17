import { describe, it, expect } from 'vitest'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

describe('remark-video (Layer 3: Full Pipeline)', () => {
  it('renders a video element from MDX-safe :::video blocks', async () => {
    const markdown = [':::video', '/videos/sample-video-1.mp4', ':::'].join('\n')

    const html = await processWithFullPipeline(markdown)

    expect(html).toContain('data-remark-video-figure')
    expect(html).toContain('<video')
    expect(html).toContain('preload="metadata"')
    expect(html).toContain('width="100%"')
    expect(html).toContain('src="/videos/sample-video-1.mp4"')
    expect(html).toContain('type="video/mp4"')
  })
})
