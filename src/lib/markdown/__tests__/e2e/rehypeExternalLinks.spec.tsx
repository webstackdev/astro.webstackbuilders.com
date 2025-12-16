// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - rehypeExternalLinks
 *
 * Tests for rehype-external-links configured in the full pipeline.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = `
External: [Example](https://example.com).

Internal: [Home](/) and [Section](#my-section).
`

  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - rehypeExternalLinks', () => {
  it('should add target and rel to external links', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const external = container.querySelector('a[href="https://example.com"]')
    expect(external).toBeTruthy()
    expect(external?.getAttribute('target')).toBe('_blank')
    expect(external?.getAttribute('rel')).toBe('noreferrer')
  })

  it('should not add target and rel to internal links', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const internalHome = container.querySelector('a[href="/"]')
    const internalAnchor = container.querySelector('a[href="#my-section"]')

    expect(internalHome).toBeTruthy()
    expect(internalAnchor).toBeTruthy()

    expect(internalHome?.hasAttribute('target')).toBe(false)
    expect(internalHome?.hasAttribute('rel')).toBe(false)

    expect(internalAnchor?.hasAttribute('target')).toBe(false)
    expect(internalAnchor?.hasAttribute('rel')).toBe(false)
  })
})
