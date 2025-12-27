import { describe, it, expect } from 'vitest'
import remarkYoutube from 'remark-youtube'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('remark-youtube (Layer 1: Isolated)', () => {
  it('should transform YouTube URLs into embedded iframes', async () => {
    const markdown = [
      'https://youtu.be/enTFE2c68FQ',
      '',
      'https://www.youtube.com/watch?v=enTFE2c68FQ',
    ].join('\n')

    const html = await processIsolated({ markdown, plugin: remarkYoutube })

    expect(html).toContain('<iframe')
    expect(html).toContain('src="https://www.youtube.com/embed/enTFE2c68FQ"')
    expect(html).toContain('width="560"')
    expect(html).toContain('height="315"')

    expect(html).not.toContain('https://youtu.be/enTFE2c68FQ')
    expect(html).not.toContain('https://www.youtube.com/watch?v=enTFE2c68FQ')
  })
})
