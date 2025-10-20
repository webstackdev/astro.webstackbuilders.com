import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkAttribution from '../plugins/remark-attribution/index'

describe('Attribution Plugin Order Test', () => {
  const markdown = `> That's ~~not~~ **definitely** one small step.
> — Neil Armstrong`

  it('Debug: Check markdown format', () => {
    console.log('\n=== Markdown String ===')
    console.log(JSON.stringify(markdown))
    console.log('Contains newline?', markdown.includes('\n'))
    console.log(
      'Newline positions:',
      [...markdown].map((c, i) => (c === '\n' ? i : null)).filter(x => x !== null)
    )
  })

  it('Test 1: GFM BEFORE Attribution (current setup)', async () => {
    const result = await remark()
      .use(remarkGfm)
      .use(remarkAttribution)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(markdown)

    const html = String(result)
    console.log('\n=== GFM BEFORE Attribution ===')
    console.log(html)
    console.log('Has <figure>?', html.includes('<figure'))
    console.log('Has figcaption?', html.includes('<figcaption'))

    // Check expectations
    expect(html).toContain('<del>not</del>')
    expect(html).toContain('<strong>definitely</strong>')
  })

  it('Test 2: Attribution BEFORE GFM (proposed fix)', async () => {
    const result = await remark()
      .use(remarkAttribution) // MOVED BEFORE GFM
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(markdown)

    const html = String(result)
    console.log('\n=== Attribution BEFORE GFM ===')
    console.log(html)
    console.log('Has <figure>?', html.includes('<figure'))
    console.log('Has figcaption?', html.includes('<figcaption'))

    // Check expectations
    expect(html).toContain('<figure')
    expect(html).toContain('<figcaption')
    expect(html).toContain('Neil Armstrong')
    expect(html).toContain('<del>not</del>')
    expect(html).toContain('<strong>definitely</strong>')
  })

  it('Test 3: Plain text WITHOUT GFM formatting', async () => {
    const plainMarkdown = `> That's not definitely one small step.
> — Neil Armstrong`

    const result = await remark()
      .use(remarkGfm)
      .use(remarkAttribution)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(plainMarkdown)

    const html = String(result)
    console.log('\n=== Plain text (no GFM formatting) ===')
    console.log(html)
    console.log('Has <figure>?', html.includes('<figure'))
    console.log('Has figcaption?', html.includes('<figcaption'))

    // This SHOULD work since there's no formatting to break up the text
    expect(html).toContain('<figure')
    expect(html).toContain('<figcaption')
    expect(html).toContain('Neil Armstrong')
  })
})
