/**
 * Tests for remark-replacements plugin
 */
import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkReplacements, { type RemarkReplacementsOptions } from '@lib/markdown/plugins/remark-replacements'

/**
 * Helper to process markdown with the plugin
 */
async function processMarkdown(
  markdown: string,
  options?: RemarkReplacementsOptions
): Promise<string> {
  const processor = unified().use(remarkParse)

  if (options) {
    processor.use(remarkReplacements, options)
  } else {
    processor.use(remarkReplacements)
  }

  const result = await processor.use(remarkStringify).process(markdown)

  return String(result)
}

describe('remark-replacements', () => {
  describe('arrow replacements', () => {
    it('converts single arrow right (-->)', async () => {
      const input = 'This arrow --> points right'
      const output = await processMarkdown(input)
      expect(output).toContain('This arrow → points right')
    })

    it('converts single arrow left (<--)', async () => {
      const input = 'This arrow <-- points left'
      const output = await processMarkdown(input)
      expect(output).toContain('This arrow ← points left')
    })

    it('converts bidirectional arrow (<-->)', async () => {
      const input = 'This arrow <--> goes both ways'
      const output = await processMarkdown(input)
      expect(output).toContain('This arrow ↔ goes both ways')
    })

    it('converts double arrow right (==>)', async () => {
      const input = 'This implies ==> that'
      const output = await processMarkdown(input)
      expect(output).toContain('This implies ⇒ that')
    })

    it('converts double arrow left (<==)', async () => {
      const input = 'That <== is implied by this'
      const output = await processMarkdown(input)
      expect(output).toContain('That ⇐ is implied by this')
    })

    it('converts bidirectional double arrow (<==>)', async () => {
      const input = 'This <==> that equivalence'
      const output = await processMarkdown(input)
      expect(output).toContain('This ⇔ that equivalence')
    })
  })

  describe('mathematical symbols', () => {
    it('converts plus-minus (+-)', async () => {
      const input = 'The tolerance is +- 0.5mm'
      const output = await processMarkdown(input)
      expect(output).toContain('The tolerance is ± 0.5mm')
    })

    it('converts multiplication (x)', async () => {
      const input = 'The area is 2 x 4 meters'
      const output = await processMarkdown(input)
      expect(output).toContain('The area is 2 × 4 meters')
    })

    it('handles multiplication with different spacing', async () => {
      const input = 'Calculate 10x20 and 5 x 10'
      const output = await processMarkdown(input)
      expect(output).toContain('Calculate 10 × 20')
      expect(output).toContain('5 × 10')
    })
  })

  describe('fraction replacements', () => {
    it('converts 1/2 to ½', async () => {
      const input = 'Use 1/2 cup of flour'
      const output = await processMarkdown(input)
      expect(output).toContain('Use ½ cup of flour')
    })

    it('converts 1/4 to ¼', async () => {
      const input = 'Add 1/4 teaspoon of salt'
      const output = await processMarkdown(input)
      expect(output).toContain('Add ¼ teaspoon of salt')
    })

    it('converts 3/4 to ¾', async () => {
      const input = 'Mix 3/4 of the batter'
      const output = await processMarkdown(input)
      expect(output).toContain('Mix ¾ of the batter')
    })
  })

  describe('code preservation', () => {
    it('does not replace inside inline code', async () => {
      const input = 'Use the `-->` operator in code'
      const output = await processMarkdown(input)
      expect(output).toContain('`-->`')
      expect(output).not.toContain('`→`')
    })

    it('does not replace inside code blocks', async () => {
      const input = `
\`\`\`javascript
// This arrow --> should not be replaced
const result = a ==> b
\`\`\`
`
      const output = await processMarkdown(input)
      expect(output).toContain('-->')
      expect(output).toContain('==>')
      expect(output).not.toContain('→')
      expect(output).not.toContain('⇒')
    })

    it('does not replace fractions in code paths', async () => {
      const input = 'The path `/api/v1/2/endpoint` should work'
      const output = await processMarkdown(input)
      // Note: 1/2 has word boundaries, so /api/v1/2/endpoint won't match
      expect(output).toContain('/api/v1/2/endpoint')
    })
  })

  describe('multiple replacements', () => {
    it('handles multiple replacements in one line', async () => {
      const input = 'Use 1/2 cup --> mix well <-- stir 2 x 3 times'
      const output = await processMarkdown(input)
      expect(output).toContain('½ cup')
      expect(output).toContain('→ mix well')
      expect(output).toContain('← stir')
      expect(output).toContain('2 × 3 times')
    })

    it('handles replacements across multiple paragraphs', async () => {
      const input = `
First paragraph with 1/2 fraction.

Second paragraph with --> arrow.

Third paragraph with 2 x 4 multiplication.
`
      const output = await processMarkdown(input)
      expect(output).toContain('½ fraction')
      expect(output).toContain('→ arrow')
      expect(output).toContain('2 × 4 multiplication')
    })
  })

  describe('plugin options', () => {
    it('respects disable option for specific rules', async () => {
      const input = 'Arrow --> and fraction 1/2'
      const output = await processMarkdown(input, {
        disable: ['arrow_right'],
      })
      expect(output).toContain('-->') // Not replaced
      expect(output).toContain('½') // Still replaced
    })

    it('can disable multiple rules', async () => {
      const input = 'Arrow --> and fraction 1/2 and 2 x 4'
      const output = await processMarkdown(input, {
        disable: ['arrow_right', 'multiplication'],
      })
      expect(output).toContain('-->') // Not replaced
      expect(output).toContain('2 x 4') // Not replaced
      expect(output).toContain('½') // Still replaced
    })

    it('can disable all fraction rules', async () => {
      const input = 'Use 1/2, 1/4, and 3/4 cups'
      const output = await processMarkdown(input, {
        disable: ['onehalf', 'onequarter', 'threequarters'],
      })
      expect(output).toContain('1/2')
      expect(output).toContain('1/4')
      expect(output).toContain('3/4')
    })
  })

  describe('edge cases', () => {
    it('handles empty strings', async () => {
      const input = ''
      const output = await processMarkdown(input)
      expect(output.trim()).toBe('')
    })

    it('handles strings with no matches', async () => {
      const input = 'Just plain text with no special characters'
      const output = await processMarkdown(input)
      expect(output).toContain('Just plain text')
    })

    it('does not replace HTML comments with arrows', async () => {
      const input = 'Text <!-- comment --> more text'
      const output = await processMarkdown(input)
      // Remark treats HTML as raw HTML nodes, not text nodes
      expect(output).toContain('<!--')
      expect(output).toContain('-->')
    })

    it('handles consecutive arrows correctly', async () => {
      const input = 'A --> B --> C'
      const output = await processMarkdown(input)
      expect(output).toContain('A → B → C')
    })

    it('preserves URLs with dashes', async () => {
      const input = 'Visit https://example.com/path--with--dashes'
      const output = await processMarkdown(input)
      // URLs should not be affected (arrows require spaces typically)
      expect(output).toContain('path--with--dashes')
    })
  })

  describe('real-world content', () => {
    it('handles technical documentation with mixed content', async () => {
      const input = `
# API Documentation

The data flow works like this: client --> server --> database.

## Usage

1. Add 1/2 cup of configuration
2. The result is \`data --> processor\` (in code)
3. Scale by 2 x 3 for production

\`\`\`javascript
// Arrow in code --> should be preserved
const factor = 1/2 // Also preserved
\`\`\`
`
      const output = await processMarkdown(input)

      // Text arrows replaced
      expect(output).toContain('client → server → database')

      // Code preserved
      expect(output).toContain('`data --> processor`')
      expect(output).toContain('// Arrow in code --> should be preserved')

      // Fractions in text replaced, in code preserved
      expect(output).toContain('Add ½ cup')
      expect(output).toContain('const factor = 1/2')

      // Multiplication replaced
      expect(output).toContain('2 × 3 for production')
    })
  })
})
