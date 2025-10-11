import { describe, it, expect } from 'vitest'
import { processWithFullPipeline } from '../../helpers/test-utils'

describe('Full Pipeline Integration (Layer 3)', () => {
  describe('all plugins working together', () => {
    it('should process complex markdown with all plugin features', async () => {
      const markdown = `
# Main Heading

## Table of Contents

## Abbreviations Section

This document uses MDAST and AST terminology.

*[MDAST]: Markdown Abstract Syntax Tree
*[AST]: Abstract Syntax Tree

## Attributes Section

This paragraph has a [link with custom class](https://example.com){.highlight}.

Here's a link with multiple attributes: [Visit our site](https://example.com){.external target="_blank"}

## Attribution Section

> That's one small step for man, one giant leap for mankind.
> — Neil Armstrong

## Emoji Section

I :heart: testing :rocket: with :sparkles: emojis!

## Auto-linking Section

Visit https://webstackbuilders.com for more information.

## Code Section

\`\`\`javascript
const test = 'with code blocks';
console.log(test);
\`\`\`

## Table Section (GFM)

| Feature | Status |
| ------- | ------ |
| Abbr | :white_check_mark: |
| Attr | :white_check_mark: |
| Attribution | :white_check_mark: |
      `.trim()

      const html = await processWithFullPipeline(markdown)

      // Verify remark-abbr worked
      expect(html, 'remarkAbbr should convert MDAST abbreviation')
        .toContain('<abbr title="Markdown Abstract Syntax Tree">MDAST</abbr>')

      expect(html, 'remarkAbbr should convert AST abbreviation')
        .toContain('<abbr title="Abstract Syntax Tree">AST</abbr>')

      // Verify remark-attr worked
      expect(html, 'remarkAttr should add custom class to link')
        .toContain('class="highlight"')

      expect(html, 'remarkAttr should add attributes to links')
        .toContain('target="_blank"')

      // Verify remark-attribution worked
      expect(html, 'remarkAttribution should wrap quote in figure element')
        .toMatch(/<figure[^>]*class="[^"]*c-blockquote/)

      expect(html, 'remarkAttribution should create figcaption with attribution')
        .toMatch(/<figcaption[^>]*class="[^"]*c-blockquote__attribution[^"]*">Neil Armstrong<\/figcaption>/)

      // Verify remark-emoji worked
      expect(html, 'remarkEmoji should convert :heart: to emoji')
        .toContain('❤️')

      expect(html, 'remarkEmoji should convert :rocket: to emoji')
        .toContain('🚀')

      // Verify remark-linkify-regex worked
      expect(html, 'remarkLinkifyRegex should auto-convert URLs to links')
        .toMatch(/href="https:\/\/webstackbuilders\.com"/)


      // Verify GFM tables worked
      expect(html, 'GFM should render markdown tables')
        .toMatch(/<table[^>]*>/)

      expect(html, 'GFM tables should have proper structure')
        .toMatch(/<thead[^>]*>/)

      // Verify rehype-accessible-emojis worked
      expect(html, 'rehypeAccessibleEmojis should add ARIA attributes to emojis')
        .toContain('role="img"')

      // Verify rehype-autolink-headings worked
      expect(html, 'rehypeAutolinkHeadings should add anchor links to headings')
        .toContain('class="anchor-link"')

      // Verify rehype-tailwind-classes worked
      expect(html, 'rehypeTailwindClasses should add classes to elements')
        .toMatch(/class="[^"]*w-full/)
    })

    it('should handle plugins interacting with formatted text', async () => {
      const markdown = `
> This is a quote with **bold** and ~~strikethrough~~ text.
> — Author Name

Here's a [link with bold text](https://example.com){.custom-link}.

*[API]: Application Programming Interface

Using the API :+1: is great!
      `.trim()

      const html = await processWithFullPipeline(markdown)

      // Attribution should work with GFM formatting in quotes
      expect(html).toMatch(/<figure[^>]*class="[^"]*c-blockquote/)
      expect(html).toContain('Author Name')
      expect(html).toContain('<strong>bold</strong>')
      expect(html).toContain('<del>strikethrough</del>')

      // Attributes should work on links
      expect(html).toContain('class="custom-link"')

      // Abbreviations should work with emojis
      expect(html).toContain('<abbr title="Application Programming Interface">API</abbr>')
      expect(html).toContain('👍')
    })

    it('should handle nested formatting and multiple features', async () => {
      const markdown = `
# Complex Example{#custom-id}

*[HTML]: HyperText Markup Language

This HTML :sparkles: example shows [**bold link**](https://example.com){.fancy}.

> Complex quote with :heart: emoji
> — Source

| Column | Value |
| ------ | ----- |
| Test | :white_check_mark: |
      `.trim()

      const html = await processWithFullPipeline(markdown)

      // Multiple plugins should not conflict
      expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>')
      expect(html).toContain('✨') // sparkles emoji
      expect(html).toContain('class="fancy"')
      expect(html).toContain('<strong>bold link</strong>')
      expect(html).toMatch(/<figure[^>]*class="[^"]*c-blockquote/)
      expect(html).toContain('❤️')
      expect(html).toMatch(/<table[^>]*>/)
      expect(html).toContain('✅') // white_check_mark emoji
    })

    it('should preserve plugin order and dependencies', async () => {
      const markdown = `
## Section Title

Visit https://example.com or https://test.com

> Quote text here
> — Author

I :heart: this test
      `.trim()

      const html = await processWithFullPipeline(markdown)

      // Verify critical dependencies work
      // - rehype-slug must come before rehype-autolink-headings
      expect(html).toContain('id="section-title"')
      expect(html).toContain('class="anchor-link"')

      // Verify plugins don't interfere
      expect(html).toContain('https://example.com')
      expect(html).toContain('https://test.com')
      expect(html).toMatch(/<figure[^>]*class="[^"]*c-blockquote/)
      expect(html).toContain('❤️')
    })
  })

  describe('edge cases and interactions', () => {
    it('should handle empty and minimal content', async () => {
      const markdown = 'Simple text'
      const html = await processWithFullPipeline(markdown)

      // Tailwind classes are added, so just check text is wrapped in p tag
      expect(html).toMatch(/<p[^>]*>Simple text<\/p>/)
    })

    it('should handle multiple abbreviations in same text', async () => {
      const markdown = `
The HTML and CSS specs define the DOM structure.

*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets
*[DOM]: Document Object Model
      `.trim()

      const html = await processWithFullPipeline(markdown)

      expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>')
      expect(html).toContain('<abbr title="Cascading Style Sheets">CSS</abbr>')
      expect(html).toContain('<abbr title="Document Object Model">DOM</abbr>')
    })

    it('should handle multiple quotes with attribution', async () => {
      const markdown = `
> First quote
> — First Author

Some text between quotes.

> Second quote
> — Second Author
      `.trim()

      const html = await processWithFullPipeline(markdown)

      // Both quotes should have attribution (use regex to account for Tailwind classes)
      const figureCount = (html.match(/<figure[^>]*class="[^"]*c-blockquote/g) || []).length
      expect(figureCount).toBe(2)

      expect(html).toContain('First Author')
      expect(html).toContain('Second Author')
    })

    it('should handle links with emojis and attributes', async () => {
      const markdown = '[Visit us :rocket:](https://example.com){.external}'
      const html = await processWithFullPipeline(markdown)

      expect(html).toContain('class="external"')
      expect(html).toContain('🚀')
      expect(html).toContain('href="https://example.com"')
    })

    it('should not break on special characters and symbols', async () => {
      const markdown = `
Test with "smart quotes" and 'apostrophes'

Em-dash --- and en-dash --

Ellipsis...

(c) (r) (tm)
      `.trim()

      const html = await processWithFullPipeline(markdown)

      // Should process without errors (p tags will have Tailwind classes)
      expect(html).toBeTruthy()
      expect(html).toMatch(/<p[^>]*>/)
    })
  })

  describe('performance and stress tests', () => {
    it('should handle large documents efficiently', async () => {
      // Generate a document with many features
      const sections = Array.from({ length: 10 }, (_, i) => `
## Section ${i + 1}

Content with :heart: emoji and https://example${i}.com

> Quote ${i}
> — Author ${i}

| Col 1 | Col 2 |
| ----- | ----- |
| Data ${i}A | Data ${i}B |

*[SEC${i}]: Section ${i} Abbreviation
      `).join('\n')

      const markdown = sections.trim()

      const startTime = Date.now()
      const html = await processWithFullPipeline(markdown)
      const endTime = Date.now()
      const processingTime = endTime - startTime

      // Should complete in reasonable time (< 1 second for 10 sections)
      expect(processingTime).toBeLessThan(1000)

      // Should contain all features (use regex for Tailwind classes)
      expect(html).toMatch(/<figure[^>]*class="[^"]*c-blockquote/)
      expect(html).toMatch(/<table[^>]*>/)
      expect(html).toContain('❤️')
      // Note: abbreviations are defined but not used in content, so no <abbr> tags
    })
  })
})
