// @vitest-environment happy-dom
/**
 * Layer 4: E2E Tests - rehypeTailwindClasses
 *
 * Tests for the rehypeTailwindClasses plugin which adds Tailwind CSS
 * utility classes to HTML elements for consistent styling.
 */

import { describe, it, expect, beforeAll } from "vitest"
import { renderMarkdown } from "@lib/markdown/helpers/markdownLoader"

let html: string

beforeAll(async () => {
  const markdown = `
# Heading

This is a paragraph with some text.

## Lists

- List item one
- List item two
- List item three

## Code

Here is some \`inline code\`.

\`\`\`typescript
const example = "code block"
\`\`\`

## Links

Check out [this link](https://example.com).
`
  html = await renderMarkdown(markdown)
})

describe('Layer 4: E2E - rehypeTailwindClasses', () => {
  it('should add Tailwind classes to headings', () => {
    // h2-h6 headings should have Tailwind typography classes
    // h1 may not have classes but h2 and below should
    expect(html).toMatch(/<h[2-6][^>]*class=["'][^"']*/)
  })

  it('should add Tailwind classes to paragraphs', () => {
    // Paragraphs should have spacing and text classes
    expect(html).toMatch(/<p[^>]*class=["'][^"']*mb-/)
  })

  it('should add Tailwind classes to lists', () => {
    // Lists should have list styling classes
    expect(html).toMatch(/<ul[^>]*class=["'][^"']*list-/)
  })

  it('should add Tailwind classes to list items', () => {
    // List items should have margin classes
    expect(html).toMatch(/<li[^>]*class=["'][^"']*mb-/)
  })

  it('should add Tailwind classes to code elements', () => {
    // Code should have background and padding classes
    expect(html).toMatch(/<code[^>]*class=["'][^"']*bg-/)
  })

  it('should add Tailwind classes to links', () => {
    // Links should have color and hover classes
    expect(html).toMatch(/<a[^>]*class=["'][^"']*/)
  })

  it('should preserve content structure', () => {
    expect(html).toContain('This is a paragraph')
    expect(html).toContain('List item one')
    expect(html).toContain('inline code')
    expect(html).toContain('this link')
  })

  it('should maintain semantic HTML structure', () => {
    // Elements should still be semantically correct
    expect(html).toContain('<h1')
    expect(html).toContain('<h2')
    expect(html).toContain('<p')
    expect(html).toContain('<ul')
    expect(html).toContain('<li')
    expect(html).toContain('<code')
    expect(html).toContain('<a')
  })
})
