import { describe, it, expect } from 'vitest'
import remarkMath from 'remark-math'

import { remarkMathConfig } from '@lib/config/markdown'
import { processWithAstroSettings } from '@lib/markdown/helpers/processors'

describe('remark-math (Layer 2: With Astro Pipeline)', () => {
  it('should emit language-math placeholders for downstream rendering', async () => {
    const markdown = ['Inline: $$a+b$$', '', '$$', 'E = mc^2', '$$'].join('\n')

    const html = await processWithAstroSettings({ markdown, plugin: remarkMath, pluginOptions: remarkMathConfig })

    expect(html).toContain('class="language-math math-inline"')
    expect(html).toContain('class="language-math math-display"')
  })

  it('should preserve $...$ when singleDollarTextMath is disabled', async () => {
    const markdown = 'This is not math: $x$.'

    const html = await processWithAstroSettings({ markdown, plugin: remarkMath, pluginOptions: remarkMathConfig })

    expect(html).toContain('$x$')
    expect(html).not.toContain('language-math')
  })
})
