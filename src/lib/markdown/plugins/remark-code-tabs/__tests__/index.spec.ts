import { describe, it, expect } from 'vitest'
import remarkCodeTabs, { parseGroupMeta } from '@lib/markdown/plugins/remark-code-tabs'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('remark-code-tabs (Layer 1: Isolated)', () => {
  it('should parse [group:tab] tokens and return cleaned meta', () => {
    expect(parseGroupMeta('[g1:JavaScript]')).toEqual({
      group: 'g1',
      tab: 'JavaScript',
      cleanedMeta: undefined,
    })

    expect(parseGroupMeta('title=foo [g1:JS]')).toEqual({
      group: 'g1',
      tab: 'JS',
      cleanedMeta: 'title=foo',
    })

    expect(parseGroupMeta('title=foo')).toBeNull()
  })

  it('should attach data attributes to fenced code blocks', async () => {
    const markdown = ['```js [g1:JavaScript]', 'console.log(1)', '```'].join('\n')

    const html = await processIsolated({
      markdown,
      plugin: remarkCodeTabs,
      stage: 'remark',
    })

    expect(html).toContain('data-code-tabs-group="g1"')
    expect(html).toContain('data-code-tabs-tab="JavaScript"')
  })
})
