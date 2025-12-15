// @vitest-environment happy-dom
/**
 * Layer 3: E2E Tests - rehypeTailwindClasses
 *
 * Tests for the rehypeTailwindClasses plugin which adds Tailwind CSS
 * utility classes to HTML elements for consistent styling.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/preact'
import { MarkdownOutput } from '@lib/markdown/helpers/markdownLoader'
import { processWithFullPipeline } from '@lib/markdown/helpers/processors'

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
  html = await processWithFullPipeline(markdown)
})

afterEach(() => {
  cleanup()
})

describe('Layer 3: E2E - rehypeTailwindClasses', () => {
  it('should add Tailwind classes to headings', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // h2-h6 headings should have Tailwind typography classes
    // h1 may not have classes but h2 and below should
    expect(html).toMatch(/<h[2-6][^>]*class=["'][^"']*/)

    const headingWithClass = container.querySelector('h2[class],h3[class],h4[class],h5[class],h6[class]')
    expect(headingWithClass).toBeTruthy()
  })

  it('should add Tailwind classes to paragraphs', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Paragraphs should have spacing and text classes
    expect(html).toMatch(/<p[^>]*class=["'][^"']*mb-/)

    const paragraph = container.querySelector('p')
    expect(paragraph).toBeTruthy()
  })

  it('should add Tailwind classes to lists', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Lists should have list styling classes
    expect(html).toMatch(/<ul[^>]*class=["'][^"']*list-/)

    const list = container.querySelector('ul')
    expect(list).toBeTruthy()
  })

  it('should add Tailwind classes to list items', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // List items should have margin classes
    expect(html).toMatch(/<li[^>]*class=["'][^"']*mb-/)

    const listItem = container.querySelector('li')
    expect(listItem).toBeTruthy()
  })

  it('should add Tailwind classes to code elements', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Code should have background and padding classes
    expect(html).toMatch(/<code[^>]*class=["'][^"']*bg-/)

    const code = container.querySelector('code')
    expect(code).toBeTruthy()
  })

  it('should add Tailwind classes to links', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Links should have color and hover classes
    expect(html).toMatch(/<a[^>]*class=["'][^"']*/)

    const link = container.querySelector('a')
    expect(link).toBeTruthy()
  })

  it('should preserve content structure', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    expect(html).toContain('This is a paragraph')
    expect(html).toContain('List item one')
    expect(html).toContain('inline code')
    expect(html).toContain('this link')

    expect(container.textContent).toContain('This is a paragraph')
    expect(container.textContent).toContain('List item one')
    expect(container.textContent).toContain('inline code')
    expect(container.textContent).toContain('this link')
  })

  it('should maintain semantic HTML structure', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Elements should still be semantically correct
    expect(html).toContain('<h1')
    expect(html).toContain('<h2')
    expect(html).toContain('<p')
    expect(html).toContain('<ul')
    expect(html).toContain('<li')
    expect(html).toContain('<code')
    expect(html).toContain('<a')

    expect(container.querySelector('h1')).toBeTruthy()
    expect(container.querySelector('h2')).toBeTruthy()
    expect(container.querySelector('p')).toBeTruthy()
    expect(container.querySelector('ul')).toBeTruthy()
    expect(container.querySelector('li')).toBeTruthy()
    expect(container.querySelector('code')).toBeTruthy()
    expect(container.querySelector('a')).toBeTruthy()
  })
})
