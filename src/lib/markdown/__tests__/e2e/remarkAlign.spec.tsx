// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - remarkAlign
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = [
    'Start',
    '',
    '[center]A centered paragraph[/center]',
    '',
    '[center]',
    '# Title',
    '',
    'Paragraph',
    '',
    '- a',
    '- b',
    '',
    '[/center]',
  ].join('\n')

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - remarkAlign', () => {
  it('should wrap inline markers with text alignment classes', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const wrapper = container.querySelector('div.text-center')
    expect(wrapper).not.toBeNull()
    expect(wrapper?.textContent?.trim()).toBe('A centered paragraph')
  })

  it('should wrap marker-only blocks with flex-col + items-* classes', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toContain('<div class="flex flex-col items-center">')

    const block = container.querySelector('div.flex.flex-col.items-center')
    expect(block).not.toBeNull()

    expect(block?.querySelector('h1')?.textContent).toContain('Title')
    expect(block?.querySelector('p')?.textContent).toBe('Paragraph')
    expect(block?.querySelectorAll('li').length).toBe(2)
  })
})
