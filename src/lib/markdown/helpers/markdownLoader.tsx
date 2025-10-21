/**
 * Markdown Fixture Loader for E2E Testing
 *
 * This module provides utilities for loading markdown fixtures and rendering
 * them for testing purposes.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/preact'
import { renderMarkdown } from './pipeline'

// Get the directory path for fixtures relative to the e2e test directory
const fixturesDir = join(__dirname, '../__tests__/layer_4_e2e/__fixtures__')

/**
 * Loads a markdown fixture file and strips any frontmatter
 *
 * @param filename - Name of the fixture file (e.g., 'abbreviations.md')
 * @returns Raw markdown content without frontmatter
 *
 * @example
 * ```ts
 * const markdown = loadFixture('abbreviations.md')
 * // Returns: "# Test\n\nMDAST stands for..."
 * ```
 */
export function loadFixture(filename: string): string {
  const filePath = join(fixturesDir, filename)
  const content = readFileSync(filePath, 'utf-8')

  // Strip frontmatter if present
  const frontmatterRegex = /^---\n[\s\S]*?\n---\n/
  return content.replace(frontmatterRegex, '').trim()
}

/**
 * Wrapper component for rendering HTML in tests
 *
 * This component safely renders HTML content for testing purposes.
 *
 * @param props - Component props
 * @param props.html - HTML string to render
 * @returns JSX element with rendered HTML
 */
export function MarkdownOutput({ html }: { html: string }) {
  return (
    <article
      className="markdown-content"
      data-testid="markdown-output"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * Renders a markdown fixture through the complete pipeline and returns both
 * the HTML string and the rendered container for testing
 *
 * @param fixtureName - Name of the fixture file (e.g., 'abbreviations.md')
 * @returns Object containing the HTML string and the rendered container
 *
 * @example
 * ```ts
 * const { html, container } = await renderFixture('abbreviations.md')
 *
 * // Test HTML content
 * expect(html).toContain('<abbr')
 *
 * // Test rendered DOM
 * const abbr = container.querySelector('abbr')
 * expect(abbr).toBeTruthy()
 * ```
 */
export async function renderFixture(fixtureName: string): Promise<{
  html: string
  container: Element
}> {
  const markdown = loadFixture(fixtureName)
  const html = await renderMarkdown(markdown)
  const { container } = render(<MarkdownOutput html={html} />)

  return { html, container }
}

/**
 * Re-export renderMarkdown for convenience
 */
export { renderMarkdown } from './pipeline'
