// @vitest-environment happy-dom
/**
 * Layer 3: Unified Plugin Tests - remark-emoji
 *
 * Tests for the remark-emoji plugin which converts emoji shortcodes like :heart:
 * to Unicode emoji characters (❤️).
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { loadFixture, MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

// Load fixture once for all tests (just the markdown string, not rendered)
beforeAll(async () => {
  const markdown = loadFixture('emoji.md')
  html = await processWithFullPipeline(markdown)
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

describe('Layer 3: Unified Plugin - remark-emoji', () => {
  it('should convert emoji shortcodes to Unicode emoji characters', async () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Check that emoji shortcodes are converted to Unicode
    expect(html).toContain('❤️')
    expect(html).toContain('🚀')
    expect(html).toContain('👍')
    expect(html).toContain('👎')

    // Verify the emojis are present in the rendered container
    expect(container.textContent).toContain('❤️')
    expect(container.textContent).toContain('🚀')
  })
})
