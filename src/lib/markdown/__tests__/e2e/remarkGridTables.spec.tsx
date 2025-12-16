// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkGridTables
 *
 * Ensures grid table syntax is supported in the full pipeline.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = [
    '+----------+-------------+',
    '| Feature  | Notes       |',
    '+==========+=============+',
    '| Grid     | *formatted* |',
    '+----------+-------------+',
  ].join('\n')

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkGridTables', () => {
  it('should render a <table> element', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const table = container.querySelector('table')
    expect(table).not.toBeNull()
    expect(table?.textContent).toContain('Feature')
    expect(table?.textContent).toContain('Grid')

    const em = container.querySelector('table em')
    expect(em?.textContent).toBe('formatted')
  })
})
