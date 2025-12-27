// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkSmartypants
 *
 * Tests for typographic transformations:
 * - Straight quotes -> curly quotes
 * - Backticks-style quotes (``like this'') -> curly quotes
 * - -- / --- -> en / em dashes
 * - ... / . . . -> ellipsis
 *
 * Also verifies code blocks and inline code are not modified.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = [
    'He said, "Hello" and \'goodbye\'.',
    "He said, ``like this''.",
    'One -- two --- three.',
    'Wait... and wait . . .',
    '',
    'Inline: `"Hello" -- ...`',
    '',
    '```text',
    '"Hello" -- ...',
    '```',
  ].join('\n')

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkSmartypants', () => {
  it('should apply smart quotes, dashes, and ellipsis in normal text', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toContain('“Hello”')
    expect(html).toContain('‘goodbye’')
    expect(html).toContain('“like this”')
    expect(html).toContain('–')
    expect(html).toContain('—')
    expect(html).toContain('…')

    expect(container.textContent).toContain('Hello')
  })

  it('should not modify inline code or code blocks', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const codes = Array.from(container.querySelectorAll('code'))
    const combined = codes.map(node => node.textContent ?? '').join('\n')

    expect(combined).toContain('"Hello" -- ...')

    // Ensure the code literal text did not get smartypants-transformed.
    expect(combined).not.toContain('“Hello”')
    expect(combined).not.toContain('–')
    expect(combined).not.toContain('…')
  })
})
