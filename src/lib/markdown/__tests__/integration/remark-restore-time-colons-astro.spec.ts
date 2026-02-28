import { describe, expect, it } from 'vitest'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

describe('remark-restore-time-colons (Layer 2: With Astro Pipeline)', () => {
  it('preserves time values that include colons', async () => {
    const markdown = 'A client can make 95 requests at 11:59:59 and 95 more at 12:00:01.'

    const html = await processWithFullPipeline(markdown)

    expect(html).toContain('11:59:59')
    expect(html).toContain('12:00:01')
    expect(html).not.toContain('<div></div>')
  })
})
