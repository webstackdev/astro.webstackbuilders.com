import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkAttribution, {
  type AttributionOptions,
} from '@lib/markdown/plugins/remark-attribution'

/**
 * Helper function to process markdown through the attribution plugin
 */
async function process(markdown: string, options?: Partial<AttributionOptions>): Promise<string> {
  const processor = remark()

  if (options) {
    processor.use(remarkAttribution, options)
  } else {
    processor.use(remarkAttribution)
  }

  const result = await processor.use(remarkRehype).use(rehypeStringify).process(markdown)

  return String(result)
}

describe('remark-attribution', () => {
  describe('default behavior', () => {
    it('should wrap blockquote with attribution in a figure element', async () => {
      const input = '> Quotation\n> — Attribution'
      const output = await process(input)

      expect(output).toContain('<figure class="c-blockquote">')
      expect(output).toContain('<blockquote>')
      expect(output).toContain('<p>Quotation</p>')
      expect(output).toContain('</blockquote>')
      expect(output).toContain('<figcaption class="c-blockquote__attribution">')
      expect(output).toContain('Attribution')
      expect(output).toContain('</figcaption>')
      expect(output).toContain('</figure>')
    })

    it('should remove the em dash marker by default', async () => {
      const input = '> Quotation\n> — Attribution'
      const output = await process(input)

      expect(output).not.toMatch(/<figcaption[^>]*>—/)
      expect(output).toContain('Attribution')
    })

    it('should extract URL and add cite attribute', async () => {
      const input = '> Quotation\n> — https://example.com Author Name'
      const output = await process(input)

      expect(output).toContain('cite="https://example.com"')
    })

    it('should handle multi-line quotations', async () => {
      const input =
        "> That's one small step for [a] man,\n> one giant leap for mankind.\n> — Neil Armstrong (1969, July 21)"
      const output = await process(input)

      expect(output).toContain("That's one small step")
      expect(output).toContain('one giant leap')
      expect(output).toContain('Neil Armstrong')
    })

    it('should leave blockquotes without attribution unchanged', async () => {
      const input = '> Just a regular blockquote\n> without attribution'
      const output = await process(input)

      expect(output).not.toContain('<figure')
      expect(output).not.toContain('<figcaption')
      expect(output).toContain('<blockquote>')
      expect(output).toContain('Just a regular blockquote')
    })

    it('should handle attribution at the start of blockquote', async () => {
      const input = '> — Attribution only'
      const output = await process(input)

      expect(output).toContain('<figure')
      expect(output).toContain('Attribution only')
    })
  })

  describe('custom marker', () => {
    it('should support custom attribution marker', async () => {
      const input = '> Quotation\n> -- Attribution'
      const output = await process(input, { marker: '--' })

      expect(output).toContain('<figure class="c-blockquote">')
      expect(output).toContain('Attribution')
      expect(output).not.toMatch(/<figcaption[^>]*>--/)
    })

    it('should only match custom marker', async () => {
      const input = '> Quotation with — em dash\n> -- Custom marker attribution'
      const output = await process(input, { marker: '--' })

      expect(output).toContain('Quotation with — em dash')
      expect(output).toContain('Custom marker attribution')
    })
  })

  describe('custom class names', () => {
    it('should use custom container class', async () => {
      const input = '> Quotation\n> — Attribution'
      const output = await process(input, { classNameContainer: 'c-quote' })

      expect(output).toContain('<figure class="c-quote">')
      expect(output).not.toContain('class="c-blockquote"')
    })

    it('should use custom attribution class', async () => {
      const input = '> Quotation\n> — Attribution'
      const output = await process(input, { classNameAttribution: 'c-quote__attribution' })

      expect(output).toContain('<figcaption class="c-quote__attribution">')
      expect(output).not.toContain('class="c-blockquote__attribution"')
    })

    it('should not add class attribute if empty string provided', async () => {
      const input = '> Quotation\n> — Attribution'
      const output = await process(input, {
        classNameContainer: '',
        classNameAttribution: '',
      })

      expect(output).toContain('<figure>')
      expect(output).toContain('<figcaption>')
      expect(output).not.toContain('class="c-blockquote"')
      expect(output).not.toContain('class="c-blockquote__attribution"')
    })
  })

  describe('removeMarker option', () => {
    it('should keep marker when removeMarker is false', async () => {
      const input = '> Quotation\n> — Attribution'
      const output = await process(input, { removeMarker: false })

      expect(output).toContain('<figcaption')
      expect(output).toContain('— Attribution')
    })

    it('should remove marker when removeMarker is true', async () => {
      const input = '> Quotation\n> — Attribution'
      const output = await process(input, { removeMarker: true })

      expect(output).toContain('<figcaption')
      expect(output).not.toMatch(/<figcaption[^>]*>—/)
      expect(output).toContain('Attribution')
    })
  })

  describe('edge cases', () => {
    it('should handle empty blockquote', async () => {
      const input = '> '
      const output = await process(input)

      expect(output).toContain('<blockquote>')
    })

    it('should handle attribution with URL and text', async () => {
      const input = '> Quote\n> — https://example.com/path?query=1 Author Name'
      const output = await process(input)

      expect(output).toContain('cite="https://example.com/path?query=1"')
      expect(output).toContain('Author Name')
    })

    it('should handle nested blockquotes', async () => {
      const input = '> Outer quote\n> > Inner quote\n> > — Inner attribution\n> — Outer attribution'
      const output = await process(input)

      // Both blockquotes should have attributions
      expect(output).toContain('Inner attribution')
      expect(output).toContain('Outer attribution')
    })
  })

  describe('combined options', () => {
    it('should apply all custom options together', async () => {
      const input = '> Quotation\n> ** Custom Attribution'
      const output = await process(input, {
        classNameContainer: 'my-quote',
        classNameAttribution: 'my-quote__author',
        marker: '**',
        removeMarker: false,
      })

      expect(output).toContain('<figure class="my-quote">')
      expect(output).toContain('<figcaption class="my-quote__author">')
      expect(output).toContain('** Custom Attribution')
    })
  })
})
