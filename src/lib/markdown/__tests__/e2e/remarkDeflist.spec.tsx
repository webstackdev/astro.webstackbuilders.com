// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkDeflist
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = ['Term 1', '', ': Definition 1'].join('\n')
  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkDeflist', () => {
  it('should render dl/dt/dd output', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const dl = container.querySelector('dl')
    expect(dl).not.toBeNull()

    const dt = dl?.querySelector('dt')
    const dd = dl?.querySelector('dd')

    expect(dt?.textContent).toContain('Term 1')
    expect(dd?.textContent).toContain('Definition 1')
  })
})
