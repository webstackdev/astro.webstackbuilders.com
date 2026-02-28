import { describe, it, expect } from 'vitest'
import rehypeAutolinkHeadings from '@lib/markdown/plugins/rehype-autolink-headings'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('rehype-autolink-headings plugin (Layer 1: Isolated)', () => {
  it('should append anchor links to headings with ids', async () => {
    const markdown = '# My Heading'

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeAutolinkHeadings,
      slugify: true,
    })

    expect(html).toContain('<h1')
    expect(html).toContain('<a')
    expect(html).toContain('href="#')
    expect(html).toContain('class="heading-anchor')
  })

  it('should use the hard-coded emoji anchor content', async () => {
    const markdown = '## Section Title'

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeAutolinkHeadings,
      slugify: true,
    })

    expect(html).toContain('🔗')
    expect(html).toContain('class="anchor-link')
  })

  it('should set aria-hidden on anchor content span', async () => {
    const markdown = '### Subsection'

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeAutolinkHeadings,
      slugify: true,
    })

    expect(html).toContain('aria-hidden="true"')
  })

  it('should set aria-label on the anchor link', async () => {
    const markdown = '## Accessible Heading'

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeAutolinkHeadings,
      slugify: true,
    })

    expect(html).toContain('aria-label="Link to this section"')
  })

  it('should add no-underline classes to the anchor link', async () => {
    const markdown = '## Styled Heading'

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeAutolinkHeadings,
      slugify: true,
    })

    expect(html).toContain('no-underline')
    expect(html).toContain('transition-colors')
  })

  it('should work with all heading levels', async () => {
    const markdown = `# H1
## H2
### H3
#### H4
##### H5
###### H6`

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeAutolinkHeadings,
      slugify: true,
    })

    expect(html).toContain('<h1')
    expect(html).toContain('<h2')
    expect(html).toContain('<h3')
    expect(html).toContain('<h4')
    expect(html).toContain('<h5')
    expect(html).toContain('<h6')

    const anchorCount = (html.match(/class="anchor-link\b/g) || []).length
    expect(anchorCount).toBe(6)
  })

  it('should not add anchors to headings without ids', async () => {
    const markdown = '# My Heading'

    // No slugify → no ids → no anchor links
    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeAutolinkHeadings,
    })

    expect(html).toContain('<h1')
    expect(html).not.toContain('class="heading-anchor')
  })

  it('should handle headings with code', async () => {
    const markdown = '## Using `code` in headings'

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeAutolinkHeadings,
      slugify: true,
    })

    expect(html).toContain('<h2')
    expect(html).toContain('<code>')
    expect(html).toContain('🔗')
  })

  it('should handle multiple headings with the same text', async () => {
    const markdown = `## Section
## Section
## Section`

    const html = await processIsolated({
      markdown,
      stage: 'rehype',
      plugin: rehypeAutolinkHeadings,
      slugify: true,
    })

    const anchorCount = (html.match(/class="anchor-link\b/g) || []).length
    expect(anchorCount).toBe(3)
  })
})
