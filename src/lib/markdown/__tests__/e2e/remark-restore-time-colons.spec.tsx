// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = 'A client can make 95 requests at 11:59:59 and 95 more at 12:00:01.'
  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkRestoreTimeColons', () => {
  it('renders time values without directive corruption', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const text = container.textContent ?? ''
    expect(text).toContain('11:59:59')
    expect(text).toContain('12:00:01')
    expect(container.innerHTML).not.toContain('<div></div>')
  })
})
