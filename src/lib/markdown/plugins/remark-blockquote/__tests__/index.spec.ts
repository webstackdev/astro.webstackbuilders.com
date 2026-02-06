import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkBlockquote, { type RemarkBlockquoteOptions } from '@lib/markdown/plugins/remark-blockquote'

async function process(markdown: string, options?: Partial<RemarkBlockquoteOptions>): Promise<string> {
  const processor = remark()

  if (options) {
    processor.use(remarkBlockquote, options)
  } else {
    processor.use(remarkBlockquote)
  }

  const result = await processor.use(remarkRehype).use(rehypeStringify).process(markdown)
  return String(result)
}

describe('remark-blockquote', () => {
  describe('attribution', () => {
    it('wraps attribution-only blockquotes in figure/figcaption with new classes', async () => {
      const output = await process('> Quotation\n> — Attribution')

      expect(output).toContain('<figure class="blockquote">')
      expect(output).toContain('<blockquote')
      expect(output).toContain('<p>Quotation</p>')
      expect(output).toContain('<figcaption class="blockquote-attribution">')
      expect(output).toContain('<figcaption class="blockquote-attribution"><div><p>Attribution</p>')
    })

    it('removes the em dash marker by default', async () => {
      const output = await process('> Quotation\n> — Attribution')

      expect(output).not.toMatch(/blockquote-attribution[^>]*>—/)
      expect(output).toContain('Attribution')
    })

    it('extracts URL and adds cite attribute to the blockquote', async () => {
      const output = await process('> Quotation\n> — https://example.com Author Name')

      expect(output).toContain('cite="https://example.com"')
    })
  })

  describe('caption', () => {
    it('wraps caption-only blockquotes in figure/figcaption with new classes', async () => {
      const output = await process('> Quote text\n> Source: Quote caption')

      expect(output).toContain('<figure class="blockquote blockquote-figure">')
      expect(output).toContain('<blockquote')
      expect(output).toContain('<p>Quote text</p>')
      expect(output).toContain('<figcaption class="blockquote-caption">')
      expect(output).toContain('Quote caption')
      expect(output).not.toContain('blockquote-attribution')
    })

    it('removes the caption prefix by default', async () => {
      const output = await process('> Quote text\n> Source: Quote caption')

      expect(output).not.toMatch(/blockquote-caption[^>]*>Source:/)
      expect(output).toContain('Quote caption')
    })
  })

  describe('caption + attribution', () => {
    it('uses caption figcaption for accessible naming and renders attribution as a div', async () => {
      const output = await process('> Quote text\n> — Attribution\n> Source: Quote caption')

      expect(output).toContain('<figure class="blockquote blockquote-figure">')
      expect(output).toContain('<div class="blockquote-attribution">')
      expect(output).toContain('<div class="blockquote-attribution"><div><p>Attribution</p>')
      expect(output).toContain('<figcaption class="blockquote-caption">')
      expect(output).toContain('Quote caption')
      expect(output).not.toContain('<figcaption class="blockquote-attribution">')
    })
  })

  describe('edge cases', () => {
    it('wraps blockquotes without attribution/caption for consistent styling', async () => {
      const output = await process('> Just a regular blockquote\n> without metadata')

      expect(output).toContain('<figure class="blockquote">')
      expect(output).toContain('<blockquote')
    })

    it('supports custom marker and caption prefix', async () => {
      const output = await process('> Quote\n> -- Author\n> Caption: My caption', {
        marker: '--',
        captionPrefix: 'Caption:',
      })

      expect(output).toContain('class="blockquote blockquote-figure"')
      expect(output).toContain('Author')
      expect(output).toContain('My caption')
    })

    it('allows keeping marker/prefix when configured', async () => {
      const output = await process('> Quote\n> — Author\n> Source: My caption', {
        removeMarker: false,
        removeCaptionPrefix: false,
      })

      expect(output).toContain('— Author')
      expect(output).toContain('Source: My caption')
    })
  })
})
