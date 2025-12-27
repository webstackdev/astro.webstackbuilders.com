// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkCustomBlocks
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = [
    '[[details | My summary]]',
    '| Some content for the detail',
    '| Second line',
  ].join('\n')
  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkCustomBlocks', () => {
  it('should render details/summary content', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const details = container.querySelector('details')
    expect(details).not.toBeNull()

    const summary = details?.querySelector('summary')
    expect(summary?.textContent).toContain('My summary')

    const div = details?.querySelector('div')
    expect(div?.textContent).toContain('Some content for the detail')
    expect(div?.textContent).toContain('Second line')
  })
})
