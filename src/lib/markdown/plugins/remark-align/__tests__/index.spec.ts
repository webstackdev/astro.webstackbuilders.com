import { describe, it, expect } from 'vitest'
import dedent from 'dedent'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkAlign from '@lib/markdown/plugins/remark-align'
import type { RemarkAlignOptions } from '@lib/markdown/plugins/remark-align'

async function process(markdown: string, options?: RemarkAlignOptions): Promise<string> {
  const processor = remark()
  if (options) {
    processor.use(remarkAlign, options)
  } else {
    processor.use(remarkAlign)
  }
  const result = await processor.use(remarkRehype).use(rehypeStringify).process(markdown)
  return String(result)
}

describe('remark-align (Layer 1: Isolated)', () => {
  it('wraps inline markers with text alignment classes', async () => {
    const input = dedent`
      A simple paragraph

      [center]A centered paragraph[/center]

      [right]A right aligned paragraph[/right]

      [left]A left aligned paragraph[/left]
    `

    const html = await process(input)
    expect(html).toContain('<div class="text-center"><p>A centered paragraph</p></div>')
    expect(html).toContain('<div class="text-right"><p>A right aligned paragraph</p></div>')
    expect(html).toContain('<div class="text-left"><p>A left aligned paragraph</p></div>')
  })

  it('wraps marker-only blocks with flex-col + items-* classes', async () => {
    const input = dedent`
      [center]
      # Title

      Paragraph

      - a
      - b

      [/center]
    `

    const html = await process(input)

    // Note: isolated pipeline doesn't apply site rehype Tailwind classes, so headings/lists are plain.
    expect(html).toContain('<div class="flex flex-col items-center">')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<p>Paragraph</p>')
    expect(html).toContain('<ul>')
  })

  it('uses custom classes when provided (text vs block)', async () => {
    const input = dedent`
      [center]center[/center]

      [center]

      Block

      [/center]
    `

    const html = await process(input, {
      center: 'custom-center',
      centerBlock: 'custom-center-block',
    })

    expect(html).toContain('<div class="custom-center"><p>center</p></div>')
    expect(html).toContain('<div class="custom-center-block"><p>Block</p></div>')
  })

  it('does not treat escaped markers as alignment syntax', async () => {
    const input = dedent`
      \\[center]escaped[/center]

      \\[center]

      block

      [/center]
    `

    const html = await process(input)
    expect(html).not.toContain('<div class="text-center">')
    expect(html).toContain('<p>[center]escaped[/center]</p>')
    expect(html).toContain('<p>[center]</p>')
    expect(html).toContain('<p>block</p>')
    expect(html).toContain('<p>[/center]</p>')
  })

  it('supports :row block variant with row flex classes', async () => {
    const input = dedent`
      [right:row]
      One
      Two
      [/right:row]
    `

    const html = await process(input)
    expect(html).toContain('<div class="flex justify-end">')
    expect(html).toContain('One')
    expect(html).toContain('Two')
  })
})
