import { describe, it, expect } from 'vitest'
import remarkMath from 'remark-math'

import { remarkMathConfig } from '@lib/config/markdown'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('remark-math (Layer 1: Isolated)', () => {
  it('should parse $$...$$ as inline math when single-dollar is disabled', async () => {
    const markdown = 'Inline math: $$a^2 + b^2$$.'

    const html = await processIsolated({
      markdown,
      plugin: remarkMath,
      pluginOptions: remarkMathConfig,
    })

    expect(html).toContain('class="language-math math-inline"')
    expect(html).toContain('a^2 + b^2')
  })

  it('should parse $$ ... $$ as display math', async () => {
    const markdown = ['$$', '\\frac{1}{2}', '$$'].join('\n')

    const html = await processIsolated({
      markdown,
      plugin: remarkMath,
      pluginOptions: remarkMathConfig,
    })

    expect(html).toContain('class="language-math math-display"')
    expect(html).toContain('\\frac{1}{2}')
  })

  it('should not parse $...$ when singleDollarTextMath is disabled', async () => {
    const markdown = 'This is $5 and this is not math: $x$.'

    const html = await processIsolated({
      markdown,
      plugin: remarkMath,
      pluginOptions: remarkMathConfig,
    })

    expect(html).toContain('$5')
    expect(html).toContain('$x$')
    expect(html).not.toContain('language-math')
  })
})
