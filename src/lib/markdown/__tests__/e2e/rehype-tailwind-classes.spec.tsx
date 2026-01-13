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

function splitClassTokens(value: string | null): string[] {
  if (!value) return []
  return value
    .split(/\s+/g)
    .map(token => token.trim())
    .filter(Boolean)
}

function isWellFormedCssClassToken(token: string): boolean {
  // Allow Tailwind variants and utility syntax; disallow whitespace/control chars and HTML-breaking characters.
  if (!token) return false

  // Disallow whitespace (including newlines/tabs) and a small set of characters that would mangle HTML.
  if (/[\s"'`{};]/.test(token)) return false

  // Disallow ASCII control characters (0x00-0x1F) and DEL (0x7F).
  for (const char of token) {
    const code = char.charCodeAt(0)
    if (code <= 0x1f || code === 0x7f) return false
  }

  return true
}

function expectHasAtLeastOneValidClassAttribute(element: Element | null): void {
  expect(element).toBeTruthy()
  if (!element) return

  const classAttr = element.getAttribute('class')
  const tokens = splitClassTokens(classAttr)
  expect(tokens.length).toBeGreaterThan(0)
  tokens.forEach(token => {
    expect(isWellFormedCssClassToken(token)).toBe(true)
  })
}

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

    // h1 may not have classes but h2 and below should.
    const headingWithClass = container.querySelector('h2,h3,h4,h5,h6')
    expectHasAtLeastOneValidClassAttribute(headingWithClass)
  })

  it('should add Tailwind classes to paragraphs', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const paragraph = container.querySelector('p')
    expectHasAtLeastOneValidClassAttribute(paragraph)
  })

  it('should add Tailwind classes to lists', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const list = container.querySelector('ul')
    expectHasAtLeastOneValidClassAttribute(list)
  })

  it('should add Tailwind classes to list items', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const listItem = container.querySelector('li')
    expectHasAtLeastOneValidClassAttribute(listItem)
  })

  it('should add Tailwind classes to code elements', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    // Inline code should be matched by the plugin and receive at least one class.
    const inlineCode = container.querySelector('p code')
    expectHasAtLeastOneValidClassAttribute(inlineCode)

    // Code blocks should also remain semantic and have a class added to <pre>.
    const pre = container.querySelector('pre')
    expectHasAtLeastOneValidClassAttribute(pre)
  })

  it('should add Tailwind classes to links', () => {
    const { container } = render(<MarkdownOutput html={html} />)

    const link = container.querySelector('a[href^="https://example.com"]')
    expectHasAtLeastOneValidClassAttribute(link)
    expect(link?.getAttribute('href')).toBe('https://example.com')
  })

  it('should not emit malformed class tokens anywhere', () => {
    const { container } = render(<MarkdownOutput html={html} />)
    const withClass = Array.from(container.querySelectorAll('[class]'))
    expect(withClass.length).toBeGreaterThan(0)

    withClass.forEach(element => {
      const tokens = splitClassTokens(element.getAttribute('class'))
      expect(tokens.length).toBeGreaterThan(0)
      tokens.forEach(token => {
        expect(isWellFormedCssClassToken(token)).toBe(true)
      })
    })
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
