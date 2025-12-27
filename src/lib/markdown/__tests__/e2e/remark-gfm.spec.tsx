// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkGfm
 *
 * Ensures GFM features are supported in the full pipeline:
 * - Autolink literals
 * - Strikethrough
 * - Tables
 * - Task lists
 * - Footnotes
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = [
    'www.example.com, https://example.com, and contact@example.com.',
    '',
    '~~struck~~',
    '',
    '| a | b |',
    '| - | - |',
    '| 1 | 2 |',
    '',
    '* [ ] to do',
    '* [x] done',
    '',
    'Here is a simple footnote[^1].',
    '',
    'More content below the footnote reference.',
    '',
    '[^1]: My reference.',
  ].join('\n')

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkGfm', () => {
  it('should render autolinks and email links', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const links = Array.from(container.querySelectorAll('a'))
    const hrefs = links.map(link => link.getAttribute('href') ?? '')

    expect(hrefs.some(href => /^https?:\/\/www\.example\.com(?:\/|$)/.test(href))).toBe(true)
    expect(hrefs).toContain('https://example.com')
    expect(hrefs).toContain('mailto:contact@example.com')
  })

  it('should render strikethrough', () => {
    const { container } = render(<MarkdownOutput html={html} />)
    expect(container.querySelector('del')?.textContent).toBe('struck')
  })

  it('should render tables', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const table = container.querySelector('table')
    expect(table).not.toBeNull()
    expect(table?.textContent).toContain('a')
    expect(table?.textContent).toContain('1')
  })

  it('should render task lists as disabled checkboxes', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'))
    expect(checkboxes.length).toBeGreaterThanOrEqual(2)

    expect(checkboxes.every(cb => cb.hasAttribute('disabled'))).toBe(true)
    expect(checkboxes.some(cb => cb.hasAttribute('checked'))).toBe(true)
  })

  it('should render footnotes with a reference and a definition', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const footnoteSection =
      container.querySelector('section.footnotes') ??
      container.querySelector('section[data-footnotes]')

    expect(footnoteSection).not.toBeNull()

    const footnoteLink = container.querySelector(
      'a[data-footnote-ref], a[href^="#user-content-fn-"], a[href^="#fn"]'
    )

    expect(footnoteLink).not.toBeNull()

    const href = footnoteLink?.getAttribute('href') ?? ''
    expect(href.startsWith('#')).toBe(true)

    const definitionId = href.slice(1)
    const definition = container.querySelector(`[id="${definitionId}"]`)
    expect(definition).not.toBeNull()
  })
})
