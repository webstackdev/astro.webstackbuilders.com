// @vitest-environment happy-dom
/**
 * Layer 4: E2E Tests - remarkReplacements
 *
 * Tests for the remarkReplacements plugin which handles typographic
 * replacements like arrows, fractions, and multiplication signs.
 * Note: Smart quotes, em dashes, and copyright symbols are handled by Astro's smartypants.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { renderMarkdown } from '../../../helpers/markdownLoader'

let html: string

beforeAll(async () => {
  const markdown = `
Arrow right --> and left <--
Double arrow <==>
Plus-minus +- symbol
Fractions: 1/2, 1/4, 3/4
Multiplication: 2 x 4 equals 8
`
  html = await renderMarkdown(markdown)
})

describe('Layer 4: E2E - remarkReplacements', () => {
  it('should convert arrow symbols', () => {
    // Plugin should convert --> to → and <-- to ←
    expect(html).toMatch(/→|&rarr;/)
    expect(html).toMatch(/←|&larr;/)
  })

  it('should convert double arrows', () => {
    // Should convert <==> to ⇔
    expect(html).toMatch(/⇔|&hArr;/)
  })

  it('should convert plus-minus', () => {
    expect(html).toMatch(/±|&plusmn;/)
  })

  it('should convert fractions', () => {
    expect(html).toMatch(/½|&frac12;/)
    expect(html).toMatch(/¼|&frac14;/)
    expect(html).toMatch(/¾|&frac34;/)
  })

  it('should convert multiplication sign', () => {
    expect(html).toMatch(/×|&times;/)
  })

  it('should maintain text content', () => {
    expect(html).toContain('equals')
    expect(html).toContain('symbol')
  })
})
