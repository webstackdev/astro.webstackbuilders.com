import { describe, it, expect, test } from 'vitest'
import dedent from 'dedent'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import stringify from 'rehype-stringify'
import remark2rehype from 'remark-rehype'
import remarkStringify from 'remark-stringify'

import type { RemarkAbbrOptions } from '@lib/markdown/plugins/remark-abbreviations/types'
import remarkAbbr from '@lib/markdown/plugins/remark-abbreviations'

const render = async (text: string, config?: RemarkAbbrOptions) => {
  const processor = unified().use(remarkParse)

  if (config !== undefined) {
    processor.use(remarkAbbr, config)
  } else {
    processor.use(remarkAbbr)
  }

  return processor.use(remark2rehype).use(stringify).process(text)
}

const renderToMarkdown = async (text: string, config?: RemarkAbbrOptions) => {
  const processor = unified().use(remarkParse).use(remarkStringify)

  if (config !== undefined) {
    processor.use(remarkAbbr, config)
  } else {
    processor.use(remarkAbbr)
  }

  return processor.process(text)
}

const configToTest: Record<string, RemarkAbbrOptions | undefined> = {
  'no-config': undefined,
  'empty object': {},
  expandFirst: { expandFirst: true },
}

for (const [configName, config] of Object.entries(configToTest)) {
  describe(configName, () => {
    it('renders references', async () => {
      const { value } = await render(
        dedent`
      This is an abbreviation: REF.
      ref and REFERENCE should be ignored.

      Here is another one in a link: [FOO](http://example.com).

      Here is the first one in a link: [REF](http://example.com).

      *[REF]: Reference
      *[FOO]: Reference
    `,
        config
      )

      expect(value).toMatchSnapshot()
    })

    it('passes the first regression test', async () => {
      const { value } = await render(
        dedent`
      The HTML specification is maintained by the W3C:\
      [link](https://w3c.github.io/html/), this line had an abbr before link.

      A line with [a link](http://example.com) before an abbr: HTML.

      *[HTML]: Hyper Text Markup Language
      *[W3C]:  World Wide Web Consortium
    `,
        config
      )

      expect(value).toMatchSnapshot()
    })

    it('passes the second regression test', async () => {
      const { value } = await render(
        dedent`
      The HTML specification is maintained by the W3C:\
      [link](https://w3c.github.io/html/), this line had an abbr before **link** HTML.

      A line with [a link](http://example.com) before an abbr: HTML.

      *[HTML]: Hyper Text Markup Language
      *[W3C]:  World Wide Web Consortium
    `,
        config
      )

      expect(value).toMatchSnapshot()
    })

    it('passes the retro test', async () => {
      const input = dedent`
      An ABBR: "REF", ref and REFERENCE should be ignored.

      The HTML specification is maintained by the W3C.

      *[REF]: Reference
      *[ABBR]: This gets overridden by the next one.
      *[ABBR]: Abbreviation
      *[HTML]: Hyper Text Markup Language
      *[W3C]:  World Wide Web Consortium
    `

      const { value: html } = await render(input)
      expect(html).toMatchSnapshot()

      const { value: markdown } = await renderToMarkdown(input)
      expect(markdown).toMatchSnapshot()
    })

    it('no reference', async () => {
      const { value } = await render(
        dedent`
      No reference!
    `,
        config
      )

      expect(value).toMatchSnapshot()
    })

    it('handles abbreviations ending with a period', async () => {
      const { value } = await render(
        dedent`
      A.B.C. and C-D%F. foo

      *[A.B.C.]: ref1
      *[C-D%F.]: ref2
    `,
        config
      )

      expect(value).toContain(`<abbr title="ref1">A.B.C.</abbr>`)
      expect(value).toContain(`<abbr title="ref2">C-D%F.</abbr>`)
    })

    it('does not parse words starting with abbr', async () => {
      const { value } = await render(
        dedent`
      ABC ABC ABC

      *[AB]: ref1
    `,
        config
      )

      expect(value).not.toContain('<abbr')
    })

    it('does not parse words ending with abbr', async () => {
      const { value } = await render(
        dedent`
      ABC ABC ABC

      *[BC]: ref1
    `,
        config
      )

      expect(value).not.toContain('<abbr')
    })

    it('does not parse words containing abbr', async () => {
      const { value } = await render(
        dedent`
      ABC ABC ABC

      *[B]: ref1
    `,
        config
      )

      expect(value).not.toContain('<abbr')
    })

    it('does not break with references in their own paragraphs', async () => {
      const { value } = await render(
        dedent`
      Here is a test featuring abc and def

      *[abc]: A B C

      *[def]: D E F
    `,
        config
      )

      expect(value).toMatchSnapshot()
    })
  })
}

test('compiles to markdown', async () => {
  const md = dedent`
      *abbr* HTML

      > HTML inside quote

      *[abbr]: abbreviation
      *[noabbr]: explanation that does not match
      *[HTML]: HyperText Markup Language
    `
  const { value } = await renderToMarkdown(md)
  expect(value).toMatchSnapshot()

  const value1 = (await renderToMarkdown(md)).value
  const value2 = (await renderToMarkdown(value1.toString())).value

  expect(value1).toBe(value2)
})
