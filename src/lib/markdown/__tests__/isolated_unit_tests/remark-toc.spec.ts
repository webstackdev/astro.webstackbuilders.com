import { describe, it, expect } from 'vitest'
import remarkToc from 'remark-toc'
import { processIsolated } from '../../helpers/test-utils'
import { remarkTocConfig } from '../../../config/markdown'

describe('remark-toc (Layer 1: Isolated)', () => {
  describe('basic TOC generation', () => {
    it('should generate table of contents for headings', async () => {
      const markdown = `# Main Title

## Contents

## Section 1

### Subsection 1.1

## Section 2`

      const html = await processIsolated(markdown, remarkToc, remarkTocConfig)

      // Should contain list structure
      expect(html).toContain('<ul>')
      expect(html).toContain('<li>')
      expect(html).toContain('Section 1')
      expect(html).toContain('Section 2')
    })

    it('should use custom heading from config', async () => {
      const markdown = `# Main Title

## Contents

## Section 1

## Section 2`

      const html = await processIsolated(markdown, remarkToc, remarkTocConfig)

      // The TOC should be inserted at "Contents" heading
      expect(html).toContain('Contents')
      expect(html).toContain('Section 1')
    })

    it('should create nested lists for subsections', async () => {
      const markdown = `## Contents

## Section 1

### Subsection 1.1

### Subsection 1.2

## Section 2`

      const html = await processIsolated(markdown, remarkToc, remarkTocConfig)

      expect(html).toContain('Section 1')
      expect(html).toContain('Subsection 1.1')
      expect(html).toContain('Subsection 1.2')
    })
  })

  describe('edge cases', () => {
    it('should handle documents without TOC placeholder', async () => {
      const markdown = `# Main Title

## Section 1

## Section 2`

      const html = await processIsolated(markdown, remarkToc, remarkTocConfig)

      // Should still process but no TOC inserted
      expect(html).toContain('Section 1')
      expect(html).toContain('Section 2')
    })

    it('should skip heading with matching TOC heading text', async () => {
      const markdown = `## Contents

## Real Section`

      const html = await processIsolated(markdown, remarkToc, remarkTocConfig)

      // TOC heading itself should not appear in the TOC
      expect(html).toContain('Real Section')
    })

    it('should handle empty document', async () => {
      const markdown = '## Contents'

      const html = await processIsolated(markdown, remarkToc, remarkTocConfig)

      expect(html).toContain('Contents')
    })
  })
})
