import { describe, expect, it } from 'vitest'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

import remarkCodeTabs from '../../remark-code-tabs'
import remarkShikiMeta from '../index'

describe('remark-shiki-meta', () => {
  it('preserves cleaned fenced-code meta as data-shiki-meta', async () => {
    const markdown = [
      '```js [g1:JavaScript] {1,3}',
      'console.log(1)',
      'console.log(2)',
      'console.log(3)',
      '```',
    ].join('\n')

    const html = String(
      await remark()
        .use(remarkCodeTabs)
        .use(remarkShikiMeta)
        .use(remarkRehype)
        .use(rehypeStringify)
        .process(markdown)
    )

    expect(html).toContain('data-code-tabs-group="g1"')
    expect(html).toContain('data-code-tabs-tab="JavaScript"')
    expect(html).toContain('data-shiki-meta="{1,3}"')
    expect(html).not.toContain('[g1:JavaScript]')
  })
})
