// @vitest-environment happy-dom

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'

import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = ['This is $5 and not math: $x$.', '', 'Inline: $$a^2 + b^2$$', '', '$$', '\\frac{1}{2}', '$$'].join(
    '\n'
  )

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkMath', () => {
  it('should keep $...$ as plain text but render $$...$$ and $$...$$ blocks', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toContain('<mjx-container')
    expect(container.textContent).toContain('$x$')
  })
})
