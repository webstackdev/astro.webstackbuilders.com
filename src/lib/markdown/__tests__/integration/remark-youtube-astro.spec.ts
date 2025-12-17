import { describe, it, expect } from 'vitest'
import remarkYoutube from 'remark-youtube'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('remark-youtube (Layer 2: With Astro Pipeline)', () => {
  it('should embed youtu.be URLs as iframes', async () => {
    const markdown = 'https://youtu.be/enTFE2c68FQ'

    const html = await processWithAstroSettings({ markdown, plugin: remarkYoutube })

    expect(html).toContain('<iframe')
    expect(html).toContain('src="https://www.youtube.com/embed/enTFE2c68FQ"')
  })
})
