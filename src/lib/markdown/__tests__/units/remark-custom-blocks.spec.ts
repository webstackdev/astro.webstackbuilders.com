import { describe, it, expect } from 'vitest'
import remarkCustomBlocks from '@lib/markdown/plugins/remark-custom-blocks'
import { processIsolated } from '@lib/markdown/helpers/processors'

import { remarkCustomBlocksConfig } from '@lib/config/markdown'

describe('remark-custom-blocks (Layer 1: Isolated)', () => {
  it('should convert [[details | Title]] blocks into details/summary markup', async () => {
    const markdown = ['[[details | My summary]]', '| Some content for the detail', '| Second line'].join('\n')

    const html = await processIsolated({
      markdown,
      plugin: remarkCustomBlocks,
      pluginOptions: remarkCustomBlocksConfig,
    })

    expect(html).toContain('<details')
    expect(html).toContain('<summary')
    expect(html).toContain('My summary')
    expect(html).toContain('<div')
    expect(html).toContain('Some content for the detail')
    expect(html).toContain('Second line')
  })
})
