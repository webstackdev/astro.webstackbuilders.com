import { describe, it, expect } from 'vitest'
import remarkSupersub from 'remark-supersub'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('remark-supersub (Layer 2: Astro Pipeline)', () => {
  it('should convert ~sub~ and ^sup^ into sub/sup elements', async () => {
    const markdown = ['Subscript: a~i~', '', 'Superscript: e^x^'].join('\n')

    const html = await processWithAstroSettings({ markdown, plugin: remarkSupersub })

    expect(html).toContain('<sub>')
    expect(html).toContain('i')
    expect(html).toContain('</sub>')

    expect(html).toContain('<sup>')
    expect(html).toContain('x')
    expect(html).toContain('</sup>')
  })
})
