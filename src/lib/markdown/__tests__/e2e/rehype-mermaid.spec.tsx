// @vitest-environment node

import { describe, it, expect, beforeAll } from 'vitest'

import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

let html: string

beforeAll(async () => {
  const markdown = ['```mermaid', 'graph TD;', '  A-->B;', '```'].join('\n')
  html = await processWithFullPipeline(markdown)
})

describe('Layer 3: E2E - rehypeMermaid', () => {
  it('should render Mermaid diagrams as inline SVG', () => {
    expect(html).toContain('<svg')
    expect(html).toMatch(/id="mermaid-\d+"/)
    expect(html).not.toContain('language-mermaid')
  })
})
