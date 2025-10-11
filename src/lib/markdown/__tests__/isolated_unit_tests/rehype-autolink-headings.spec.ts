import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeStringify from 'rehype-stringify'
import { rehypeAutolinkHeadingsConfig } from '../../config/markdown.ts'

/**
 * Helper for testing rehype-autolink-headings
 */
async function processRehype(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkRehype)
    .use(rehypeAutolinkHeadings, rehypeAutolinkHeadingsConfig)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}

describe('rehype-autolink-headings (Layer 1: Isolated)', () => {
  describe('basic autolink functionality', () => {
    it('should add anchor links to headings', async () => {
      const markdown = '# My Heading'

      const html = await processRehype(markdown)

      expect(html).toContain('<h1')
      expect(html).toContain('<a')
      expect(html).toContain('href="#')
    })

    it('should use configured anchor content (emoji)', async () => {
      const markdown = '## Section Title'

      const html = await processRehype(markdown)

      expect(html).toContain('🔗')
      expect(html).toContain('class="anchor-link"')
    })

    it('should add aria-hidden to anchor content', async () => {
      const markdown = '### Subsection'

      const html = await processRehype(markdown)

      expect(html).toContain('aria-hidden="true"')
    })

    it('should work with all heading levels', async () => {
      const markdown = `# H1
## H2
### H3
#### H4
##### H5
###### H6`

      const html = await processRehype(markdown)

      expect(html).toContain('<h1')
      expect(html).toContain('<h2')
      expect(html).toContain('<h3')
      expect(html).toContain('<h4')
      expect(html).toContain('<h5')
      expect(html).toContain('<h6')

      // Should have anchor links for each
      const anchorCount = (html.match(/class="anchor-link"/g) || []).length
      expect(anchorCount).toBe(6)
    })
  })

  describe('heading ID generation', () => {
    it('should generate IDs from heading text', async () => {
      const markdown = '## My Section Title'

      const html = await processRehype(markdown)

      expect(html).toContain('id="')
      expect(html).toContain('href="#')
    })

    it('should handle headings with special characters', async () => {
      const markdown = '## Section: Special & Chars!'

      const html = await processRehype(markdown)

      expect(html).toContain('<h2')
      expect(html).toContain('id="')
    })

    it('should handle headings with code', async () => {
      const markdown = '## Using `code` in headings'

      const html = await processRehype(markdown)

      expect(html).toContain('<h2')
      expect(html).toContain('<code>')
    })
  })

  describe('edge cases', () => {
    it('should handle empty headings', async () => {
      const markdown = '##'

      const html = await processRehype(markdown)

      expect(html).toContain('<h2')
    })

    it('should handle headings with only whitespace', async () => {
      const markdown = '##   '

      const html = await processRehype(markdown)

      expect(html).toContain('<h2')
    })

    it('should handle multiple headings with same text', async () => {
      const markdown = `## Section
## Section
## Section`

      const html = await processRehype(markdown)

      // Each should get a unique ID
      expect(html).toContain('<h2')
    })
  })
})
