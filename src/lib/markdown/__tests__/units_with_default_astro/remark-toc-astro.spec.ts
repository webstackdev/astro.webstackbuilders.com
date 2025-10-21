import { describe, it, expect } from 'vitest'
import remarkToc from 'remark-toc'
import { processWithAstroSettings } from '../../helpers/test-utils'
import { remarkTocConfig } from '../../../config/markdown'

describe('remark-toc (Layer 2: With Astro Pipeline)', () => {
  describe('TOC with GFM', () => {
    it('should generate TOC with GFM tables in content', async () => {
      const markdown = `
## Contents

## Section with Table

| Header |
| ------ |
| Data   |

## Another Section
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkToc, remarkTocConfig)

      expect(html).toContain('Contents')
      expect(html).toContain('Section with Table')
      expect(html).toContain('Another Section')
    })

    it('should handle headings with GFM strikethrough', async () => {
      const markdown = `
## Contents

## ~~Old~~ New Approach

## Final Section
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkToc, remarkTocConfig)

      expect(html).toContain('Contents')
      expect(html).toContain('<del>Old</del>')
    })

    it('should work with GFM autolinks in headings', async () => {
      const markdown = `
## Contents

## Visit https://example.com

## Another Heading
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkToc, remarkTocConfig)

      expect(html).toContain('Contents')
      expect(html).toContain('https://example.com')
    })
  })

  describe('TOC with Astro footnote settings', () => {
    it('should handle headings with footnote references', async () => {
      const markdown = `
## Contents

## Section Title[^1]

[^1]: Additional info

## Another Section
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkToc, remarkTocConfig)

      expect(html).toContain('Section Title')
      expect(html).toContain('Another Section')
    })
  })

  describe('edge cases with Astro settings', () => {
    it('should preserve TOC structure through remarkRehype conversion', async () => {
      const markdown = `
## Contents

## First

### Subsection 1.1

### Subsection 1.2

## Second
      `.trim()

      const html = await processWithAstroSettings(markdown, remarkToc, remarkTocConfig)

      expect(html).toContain('<ul')
      expect(html).toContain('First')
      expect(html).toContain('Subsection')
      expect(html).toContain('Second')
    })
  })
})
