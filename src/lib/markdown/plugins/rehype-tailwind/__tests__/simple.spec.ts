import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { rehypeTailwindClasses } from '@lib/markdown/plugins/rehype-tailwind'
import { processIsolated } from '@lib/markdown/helpers/processors'

function splitClassTokens(value: string | null): string[] {
  if (!value) return []
  return value
    .split(/\s+/g)
    .map(token => token.trim())
    .filter(Boolean)
}

function isWellFormedCssClassToken(token: string): boolean {
  // Keep intentionally permissive for Tailwind variants (e.g. `md:hover:...`, `w-1/2`, `!mt-0`).
  // The goal is to ensure we never emit whitespace/control chars or HTML-breaking characters.
  if (!token) return false
  if (/[\s"'`{};]/.test(token)) return false

  // Disallow ASCII control characters (0x00-0x1F) and DEL (0x7F).
  for (const char of token) {
    const code = char.charCodeAt(0)
    if (code <= 0x1f || code === 0x7f) return false
  }

  return true
}

function expectHasAtLeastOneValidClassAttribute(element: Element | null, name: string): void {
  if (!element) throw new Error(`Expected to find element: ${name}`)

  const classAttr = element.getAttribute('class')
  const tokens = splitClassTokens(classAttr)
  expect(tokens.length).toBeGreaterThan(0)
  tokens.forEach(token => {
    expect(isWellFormedCssClassToken(token)).toBe(true)
  })
}

async function renderMarkdownToDocument(markdown: string): Promise<Document> {
  const html = await processIsolated({
    markdown,
    plugin: rehypeTailwindClasses,
    stage: 'rehype',
    gfm: true,
  })

  return new JSDOM(html).window.document
}

describe('rehypeTailwindClasses (Layer 1: Isolated) - simple elements', () => {
  it('adds at least one class to <p> elements and preserves content', async () => {
    const document = await renderMarkdownToDocument('This is a test paragraph.')

    const paragraph = document.querySelector('p')
    expectHasAtLeastOneValidClassAttribute(paragraph, 'p')
    expect(paragraph?.textContent).toContain('This is a test paragraph.')
  })

  it('adds at least one class to <hr> elements', async () => {
    const document = await renderMarkdownToDocument('Content above\n\n---\n\nContent below')

    const hr = document.querySelector('hr')
    expectHasAtLeastOneValidClassAttribute(hr, 'hr')
  })

  it('wraps top-level lists in a .markdown-list container', async () => {
    const markdown = ['- Item 1', '- Item 2', '', '1. First', '2. Second'].join('\n')
    const document = await renderMarkdownToDocument(markdown)

    const listWrappers = Array.from(document.querySelectorAll('div.markdown-list'))
    expect(listWrappers.length).toBeGreaterThanOrEqual(2)
    listWrappers.forEach((wrapper, index) => {
      expectHasAtLeastOneValidClassAttribute(wrapper, `div.markdown-list[${index}]`)
    })

    expect(document.querySelector('ul')).toBeTruthy()
    expect(document.querySelector('ol')).toBeTruthy()
    expect(document.querySelector('li')).toBeTruthy()
  })

  it('adds at least one class to <table>, <th>, and <td> elements', async () => {
    const document = await renderMarkdownToDocument(
      ['| Header 1 | Header 2 |', '| --- | --- |', '| Cell 1 | Cell 2 |'].join('\n')
    )

    expectHasAtLeastOneValidClassAttribute(document.querySelector('table'), 'table')
    expectHasAtLeastOneValidClassAttribute(document.querySelector('th'), 'th')
    expectHasAtLeastOneValidClassAttribute(document.querySelector('td'), 'td')
  })

  it('does not emit malformed class tokens anywhere', async () => {
    const document = await renderMarkdownToDocument(
      [
        '# Heading',
        '',
        'Paragraph text.',
        '',
        '- List item',
        '',
        '---',
        '',
        '| A | B |',
        '| --- | --- |',
        '| 1 | 2 |',
      ].join('\n')
    )

    const withClass = Array.from(document.querySelectorAll('[class]'))
    expect(withClass.length).toBeGreaterThan(0)

    withClass.forEach(element => {
      const tokens = splitClassTokens(element.getAttribute('class'))
      expect(tokens.length).toBeGreaterThan(0)
      tokens.forEach(token => {
        expect(isWellFormedCssClassToken(token)).toBe(true)
      })
    })
  })
})
