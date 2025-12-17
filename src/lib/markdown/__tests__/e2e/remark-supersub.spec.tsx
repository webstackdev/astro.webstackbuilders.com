// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkSupersub
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

describe('remark-supersub (Layer 3: E2E)', () => {
  let html: string

  beforeAll(async () => {
    const markdown = ['Subscript: a~i~', '', 'Superscript: e^x^'].join('\n')
    html = await processWithFullPipeline(markdown)
  })

  afterEach(() => {
    cleanup()
  })

  it('should render sub and sup tags', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(container.querySelector('sub')?.textContent).toBe('i')
    expect(container.querySelector('sup')?.textContent).toBe('x')
  })
})
