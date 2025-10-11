import { describe, it, expect } from 'vitest'
import remarkAbbr from '../../remark-abbr/index'
import { processIsolated } from '../../helpers/test-utils'

describe('remark-abbr (Layer 1: Isolated)', () => {
  describe('basic abbreviation functionality', () => {
    it('should convert abbreviations defined at bottom of file', async () => {
      const markdown = `
This uses MDAST functionality.

*[MDAST]: Markdown Abstract Syntax Tree
      `.trim()

      const html = await processIsolated(markdown, remarkAbbr)

      expect(html).toContain('<abbr title="Markdown Abstract Syntax Tree">MDAST</abbr>')
    })

    it('should handle multiple abbreviations', async () => {
      const markdown = `
This uses MDAST and AST functionality.

*[MDAST]: Markdown Abstract Syntax Tree
*[AST]: Abstract Syntax Tree
      `.trim()

      const html = await processIsolated(markdown, remarkAbbr)

      expect(html).toContain('<abbr title="Markdown Abstract Syntax Tree">MDAST</abbr>')
      expect(html).toContain('<abbr title="Abstract Syntax Tree">AST</abbr>')
    })

    it('should not create abbr tags when no definition exists', async () => {
      const markdown = 'This is MDAST without definition'

      const html = await processIsolated(markdown, remarkAbbr)

      expect(html).not.toContain('<abbr')
      expect(html).toContain('MDAST')
    })
  })

  describe('edge cases', () => {
    it('should handle abbreviations in different contexts', async () => {
      const markdown = `
# Heading with MDAST

Paragraph with MDAST.

- List item with MDAST
- Another item

> Quote with MDAST

*[MDAST]: Markdown Abstract Syntax Tree
      `.trim()

      const html = await processIsolated(markdown, remarkAbbr)

      // Should replace all instances
      const matches = html.match(/<abbr title="Markdown Abstract Syntax Tree">MDAST<\/abbr>/g)
      expect(matches).toBeTruthy()
      expect(matches?.length).toBeGreaterThan(1)
    })

    it('should preserve case sensitivity', async () => {
      const markdown = `
This has MDAST and mdast.

*[MDAST]: Markdown Abstract Syntax Tree
      `.trim()

      const html = await processIsolated(markdown, remarkAbbr)

      expect(html).toContain('<abbr title="Markdown Abstract Syntax Tree">MDAST</abbr>')
      // Lowercase should not be converted
      expect(html).toContain('mdast')
      expect(html).not.toContain('<abbr title="Markdown Abstract Syntax Tree">mdast</abbr>')
    })

    it('should handle abbreviations with special characters', async () => {
      const markdown = `
Use HTML/CSS here.

*[HTML/CSS]: HyperText Markup Language and Cascading Style Sheets
      `.trim()

      const html = await processIsolated(markdown, remarkAbbr)

      expect(html).toContain('<abbr title="HyperText Markup Language and Cascading Style Sheets">HTML/CSS</abbr>')
    })
  })
})
