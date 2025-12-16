// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkMarkPlus
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = 'My ==marked== text.'
  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkMarkPlus', () => {
  it('should render mark tags', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(container.querySelector('mark')?.textContent).toBe('marked')
  })
})
