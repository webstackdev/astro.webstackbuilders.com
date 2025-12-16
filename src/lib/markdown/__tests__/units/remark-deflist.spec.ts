import { describe, it, expect } from 'vitest'
import remarkDeflist from 'remark-deflist'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('remark-deflist (Layer 1: Isolated)', () => {
  it('should convert definition list syntax into dl/dt/dd', async () => {
    const markdown = ['Term 1', '', ': Definition 1'].join('\n')

    const html = await processIsolated({ markdown, plugin: remarkDeflist })

    expect(html).toContain('<dl')
    expect(html).toContain('<dt')
    expect(html).toContain('Term 1')
    expect(html).toContain('<dd')
    expect(html).toContain('Definition 1')
  })
})
