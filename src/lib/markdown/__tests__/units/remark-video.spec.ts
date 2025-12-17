import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkDirective from 'remark-directive'
import remarkVideo from 'remark-video'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

import { remarkVideoConfig } from '@lib/config/markdown'

describe('remark-video (Layer 1: Isolated)', () => {
  it('should render :::video blocks as <video> markup', async () => {
    const markdown = [':::video', '/videos/sample-video-1.mp4', ':::'].join('\n')

    const result = await remark()
      .use(remarkDirective)
      .use(remarkVideo, remarkVideoConfig as never)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(markdown)

    const html = String(result)

    expect(html).toContain('data-remark-video-figure')
    expect(html).toContain('<video')
    expect(html).toContain('src="/videos/sample-video-1.mp4"')
  })
})
