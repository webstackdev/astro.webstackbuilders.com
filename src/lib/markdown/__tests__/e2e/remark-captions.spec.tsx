// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkCaptions
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = [
    '> Quote text',
    '>',
    '> Source: Quote caption',
    '',
    '| a | b |',
    '| - | - |',
    '| 1 | 2 |',
    '',
    'Table: Table caption',
    '',
    '```ts',
    'export const answer = 42',
    '```',
    'Code: Code caption',
    '',
    '![Alt](/assets/images/branding/wordmark.svg)',
    'Figure: Image caption',
  ].join('\n')

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkCaptions', () => {
  it('should render figure/figcaption wrappers', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const figures = container.querySelectorAll('figure')
    expect(figures.length).toBeGreaterThanOrEqual(4)

    expect(container.querySelector('figcaption')?.textContent).toBeTruthy()
    expect(container.textContent).toContain('Quote caption')
    expect(container.textContent).toContain('Table caption')
    expect(container.textContent).toContain('Code caption')
    expect(container.textContent).toContain('Image caption')
  })
})
