import { describe, it, expect } from 'vitest'
import remarkAlign from '@lib/markdown/plugins/remark-align'

import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('remark-align (Layer 2: With Astro Pipeline)', () => {
  it('should render aligned blocks/paragraphs with Tailwind wrappers', async () => {
    const markdown = [
      '[center]Centered paragraph[/center]',
      '',
      '[center]',
      '# Title',
      '',
      '- a',
      '- b',
      '',
      '[/center]',
    ].join('\n')

    const html = await processWithAstroSettings({ markdown, plugin: remarkAlign })

    expect(html).toContain('<div class="text-center">')
    expect(html).toContain('Centered paragraph</p>')
    expect(html).toContain('<div class="flex flex-col items-center">')
    expect(html).toContain('>Title</h1>')
    expect(html).toContain('<ul')
  })
})
