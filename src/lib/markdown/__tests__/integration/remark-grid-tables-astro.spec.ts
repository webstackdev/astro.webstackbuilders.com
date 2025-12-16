import { describe, it, expect } from 'vitest'
import remarkGridTables from '@adobe/remark-gridtables'

import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('remark-gridtables (Layer 2: With Astro Pipeline)', () => {
  it('should render grid tables alongside the rest of the Astro pipeline', async () => {
    const markdown = [
      '## Grid tables',
      '',
      '+----------+-------------+',
      '| Feature  | Notes       |',
      '+==========+=============+',
      '| Grid     | *formatted* |',
      '+----------+-------------+',
    ].join('\n')

    const html = await processWithAstroSettings({ markdown, plugin: remarkGridTables })

    expect(html).toContain('<table')
    expect(html).toContain('<th>Feature</th>')
    expect(html).toContain('<td>Grid</td>')
    expect(html).toContain('<em>formatted</em>')
  })
})
