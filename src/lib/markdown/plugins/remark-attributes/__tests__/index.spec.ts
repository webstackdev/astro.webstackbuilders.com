import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkAttr from '@lib/markdown/plugins/remark-attributes'
import type { RemarkAttrOptions } from '@lib/markdown/plugins/remark-attributes/types'

/**
 * Helper function to process markdown through the attr plugin
 */
async function process(markdown: string, options?: RemarkAttrOptions): Promise<string> {
  const processor = remark()

  if (options) {
    processor.use(remarkAttr, options)
  } else {
    processor.use(remarkAttr)
  }

  const result = await processor.use(remarkRehype).use(rehypeStringify).process(markdown)

  return String(result)
}

/**
 * Helper function with permissive scope (allows most attributes)
 */
async function processPermissive(
  markdown: string,
  options?: Partial<RemarkAttrOptions>
): Promise<string> {
  return process(markdown, {
    allowDangerousDOMEventHandlers: false,
    scope: 'permissive',
    ...options,
  })
}

describe('remark-attr (Layer 1: Isolated)', () => {
  describe('basic inline elements', () => {
    it('should add attributes to emphasis elements', async () => {
      const input = 'Inline *test*[[style="em:4"]] paragraph.'
      const output = await process(input)

      expect(output).toContain('<em style="em:4">test</em>')
    })

    it('should add attributes to strong elements', async () => {
      const input = 'Use **multiple**[[style="color:pink"]] inline tag.'
      const output = await process(input)

      expect(output).toContain('<strong style="color:pink">multiple</strong>')
    })

    it('should add attributes to inline code with class', async () => {
      const input = 'This `code`[[class="highlight"]] is special.'
      const output = await processPermissive(input)

      expect(output).toContain('<code class="highlight">code</code>')
    })

    it('should add attributes to inline code elements', async () => {
      const input = 'Line `tagCode`[[style="color:yellow"]].'
      const output = await process(input)

      expect(output).toContain('<code style="color:yellow">tagCode</code>')
    })

    it('should handle multiple inline attributes in one paragraph', async () => {
      const input =
        'Inline *test*[[style="em:4"]] paragraph. Use **multiple**[[style="color:pink"]] inline tag. Line `tagCode`[[style="color:yellow"]].'
      const output = await process(input)

      expect(output).toContain('<em style="em:4">test</em>')
      expect(output).toContain('<strong style="color:pink">multiple</strong>')
      expect(output).toContain('<code style="color:yellow">tagCode</code>')
    })
  })

  describe('link elements', () => {
    it('should add attributes to links', async () => {
      const input =
        'This is a link :[Test link](https://ache.one)[[ping="https://ache.one/big.brother"]]'
      const output = await processPermissive(input)

      expect(output).toContain('href="https://ache.one"')
      expect(output).toContain('ping="https://ache.one/big.brother"')
      expect(output).toContain('>Test link</a>')
    })

    it('should add attributes to autolinks', async () => {
      const input = 'This is a link :<https://ache.one>[[ping="https://ache.one/big.brother"]]'
      const output = await processPermissive(input)

      expect(output).toContain('href="https://ache.one"')
      expect(output).toContain('ping="https://ache.one/big.brother"')
    })

    it('should add attributes to link references', async () => {
      const input = '[Google][google][[hreflang="en"]]\n\n[google]: https://google.com'
      const output = await process(input)

      expect(output).toContain('href="https://google.com"')
      expect(output).toContain('hreflang="en"')
      expect(output).toContain('>Google</a>')
    })
  })

  describe('image elements', () => {
    it('should add attributes to images', async () => {
      const input = '![Alt text](https://example.com/image.png)[[width=300 .centered]]'
      const output = await process(input)

      expect(output).toContain('<img')
      expect(output).toContain('src="https://example.com/image.png"')
      expect(output).toContain('alt="Alt text"')
      expect(output).toContain('width="300"')
      expect(output).toContain('class="centered"')
    })
  })

  describe('heading elements', () => {
    it('should add attributes to setext headings', async () => {
      const input = 'Title of the article\n====================\n[[data-id="title"]]'
      const output = await process(input)

      expect(output).toContain('<h1 data-id="title">Title of the article</h1>')
    })

    it('should add attributes to ATX headings (next line)', async () => {
      const input = '# Title of the article\n[[data-id="title"]]'
      const output = await process(input)

      expect(output).toContain('<h1 data-id="title">Title of the article</h1>')
    })

    it('should add inline attributes to ATX headings', async () => {
      const input = '# Title of the article [[data-id="title"]]'
      const output = await process(input)

      expect(output).toContain('<h1 data-id="title">Title of the article</h1>')
    })

    it('should add inline attributes to ATX headings without space', async () => {
      const input = '# Title of the article[[data-id="title"]]'
      const output = await process(input)

      expect(output).toContain('<h1 data-id="title">Title of the article</h1>')
    })

    it('should not add attributes to setext headings with inline syntax', async () => {
      const input = 'Title of the article [[data-id="title"]]\n======================================'
      const output = await process(input)

      // Setext headings don't support inline attributes
      expect(output).toContain('Title of the article [[data-id="title"]]')
    })

    it('should not parse incomplete attribute syntax', async () => {
      const input = '# Header [[data-id="title"'
      const output = await process(input)

      expect(output).toContain('Header [[data-id="title"')
      expect(output).not.toContain('data-id="title">')
    })

    it('should not parse attributes without opening brace', async () => {
      const input = '# Header data-id="title"]]'
      const output = await process(input)

      expect(output).toContain('Header data-id="title"]]')
      expect(output).not.toContain('data-id="title">')
    })

    it('should not parse empty attribute blocks', async () => {
      const input = '# [[data-id="title"]]'
      const output = await process(input)

      expect(output).toContain('[[data-id="title"]]')
    })
  })

  describe('fenced code blocks', () => {
    it('should add attributes from meta string', async () => {
      const input = '~~~lang info=string\nThis is an awesome code\n\n~~~'
      const output = await processPermissive(input)

      expect(output).toContain('class="language-lang"')
      expect(output).toContain('info="string"')
      expect(output).toContain('This is an awesome code')
    })

    it('should add attributes with bracket syntax', async () => {
      const input = '~~~lang {info=string}\nThis is an awesome code\n\n~~~'
      const output = await processPermissive(input)

      expect(output).toContain('class="language-lang"')
      expect(output).toContain('info="string"')
    })

    it('should handle attributes with spaces before brackets', async () => {
      const input = '~~~lang   {info=string}\nThis is an awesome code\n\n~~~'
      const output = await processPermissive(input)

      expect(output).toContain('class="language-lang"')
      expect(output).toContain('info="string"')
    })
  })

  describe('combined elements', () => {
    it('should handle emphasis and strong with attributes', async () => {
      const input =
        'Hey ! *That looks cool*[[style="color: blue;"]] ! No, that\'s **not**[[class="not"]] !'
      const output = await process(input)

      expect(output).toContain('<em style="color: blue;">That looks cool</em>')
      expect(output).toContain('<strong class="not">not</strong>')
    })
  })

  describe('attribute scope - extended (default)', () => {
    it('should allow specific HTML attributes for elements', async () => {
      const input = 'textexamplenointerest **Important**[[style="4em"]] still no interest'
      const output = await process(input)

      expect(output).toContain('<strong style="4em">Important</strong>')
    })

    it('should filter out non-standard attributes in extended scope', async () => {
      const input = '*Wait*! This is **awesome**[[awesomeness="max"]]'
      const output = await process(input)

      expect(output).not.toContain('awesomeness')
    })
  })

  describe('attribute scope - permissive', () => {
    it('should allow custom attributes in permissive scope', async () => {
      const input = 'This is a **Unicorn**[[awesome="true"]] !'
      const output = await processPermissive(input)

      expect(output).toContain('<strong awesome="true">Unicorn</strong>')
    })

    it('should not allow dangerous event handlers by default', async () => {
      const input = '*Wait*! I **love**[[onload="dangerous()" style="color: red;"]] you!'
      const output = await processPermissive(input)

      expect(output).not.toContain('onload')
      expect(output).toContain('style="color: red;"')
    })

    it('should allow event handlers when explicitly enabled', async () => {
      const input = '*Wait*! **Click me**[[onclick="alert()"]]'
      const output = await process(input, {
        scope: 'permissive',
        allowDangerousDOMEventHandlers: true,
      })

      expect(output).toContain('onclick="alert()"')
    })
  })

  describe('aria and data attributes', () => {
    it('should allow aria-* attributes', async () => {
      const input = '*Wait*! I **love**[[style="color: pink;" aria-love="true"]] you!'
      const output = await process(input)

      expect(output).toContain('aria-love="true"')
      expect(output).toContain('style="color: pink;"')
    })

    it('should allow data-* attributes', async () => {
      const input = '*Wait*! This is a **test**[[data-id="2"]]'
      const output = await process(input)

      expect(output).toContain('data-id="2"')
    })

    it('should allow data attributes with hyphens', async () => {
      const input = '*Wait*! This is a **test**[[data-id-node="2"]]'
      const output = await process(input)

      expect(output).toContain('data-id-node="2"')
    })

    it('should allow single character after data-', async () => {
      const input = '*Wait*! This is a **test**[[data-i="2"]]'
      const output = await process(input)

      expect(output).toContain('data-i="2"')
    })

    it('should not allow invalid data attributes (double dash)', async () => {
      const input = '*Wait*! This is a **test**[[data--id="2"]]'
      const output = await process(input)

      expect(output).not.toContain('data--id')
    })
  })

  describe('extend configuration', () => {
    it('should allow extended attributes for specific elements', async () => {
      const input = '*Wait*! **Beautiful**[[ex-attr="true"]]'
      const output = await process(input, {
        scope: 'extended',
        extend: { strong: ['ex-attr'] },
      })

      expect(output).toContain('ex-attr="true"')
    })

    it('should allow global extended attributes', async () => {
      const input = '*Wait*! You are **beautiful**[[ex-attr="true"]] !'
      const output = await process(input, {
        extend: { '*': ['ex-attr'] },
      })

      expect(output).toContain('ex-attr="true"')
    })

    it('should filter attributes not in extended config', async () => {
      const input = '*Wait*! You are **beautiful**[[ex-attr="true" onload="qdss" pss="NOK"]] !'
      const output = await process(input, {
        scope: 'extended',
        extend: { strong: ['ex-attr'] },
      })

      expect(output).toContain('ex-attr="true"')
      expect(output).not.toContain('onload')
      expect(output).not.toContain('pss')
    })
  })

  describe('scope none', () => {
    it('should not add any attributes when scope is none', async () => {
      const input = '*Wait*! I **love**[[style="color: red;" data-id="test"]] you!'
      const output = await process(input, { scope: 'none' })

      expect(output).not.toContain('style')
      expect(output).not.toContain('data-id')
    })
  })

  describe('edge cases', () => {
    it('should handle attributes with spaces', async () => {
      const input = 'Use **multiple**[[ style="color:pink" ]] inline tag.'
      const output = await process(input)

      expect(output).toContain('<strong style="color:pink">multiple</strong>')
    })

    it('should handle attributes without spaces', async () => {
      const input = 'Use **multiple**[[style="color:pink"]] inline tag.'
      const output = await process(input)

      expect(output).toContain('<strong style="color:pink">multiple</strong>')
    })

    it('should handle empty attribute values', async () => {
      const input = 'This is **bold**[[class=""]]'
      const output = await processPermissive(input)

      // Empty class should still be added
      expect(output).toContain('<strong')
    })

    it('should handle class shorthand notation', async () => {
      const input = 'This is **bold**[[.my-class]]'
      const output = await process(input)

      expect(output).toContain('class="my-class"')
    })

    it('should handle id shorthand notation', async () => {
      const input = 'This is **bold**[[#my-id]]'
      const output = await process(input)

      expect(output).toContain('id="my-id"')
    })

    it('should handle combined shorthand and regular attributes', async () => {
      const input = 'This is **bold**[[#my-id .my-class style="color:red"]]'
      const output = await process(input)

      expect(output).toContain('id="my-id"')
      expect(output).toContain('class="my-class"')
      expect(output).toContain('style="color:red"')
    })
  })

  describe('elements configuration', () => {
    it('should only process specified elements', async () => {
      const input = 'Use **bold**[[style="color:red"]] and *italic*[[style="color:blue"]]'
      const output = await process(input, {
        elements: new Set(['strong']),
      })

      expect(output).toContain('<strong style="color:red">bold</strong>')
      expect(output).not.toContain('<em style="color:blue">')
      expect(output).toContain('<em>italic</em>[[style="color:blue"]]')
    })

    it('should support elements as array', async () => {
      const input = 'Use **bold**[[style="color:red"]] and *italic*[[style="color:blue"]]'
      const output = await process(input, {
        elements: ['strong'],
      })

      expect(output).toContain('<strong style="color:red">bold</strong>')
      expect(output).toContain('<em>italic</em>[[style="color:blue"]]')
    })
  })

  describe('disableBlockElements option', () => {
    it('should not process block elements when disabled', async () => {
      const input = '# Title [[data-id="test"]]\n\nParagraph text'
      const output = await process(input, {
        disableBlockElements: true,
      })

      // Should not have the attribute on the h1 tag
      expect(output).not.toMatch(/<h1[^>]*data-id/)
      // Should keep the attribute syntax in the text content
      expect(output).toContain('Title [[data-id="test"]]')
    })

    it('should still process inline elements when block elements disabled', async () => {
      const input = '# Title\n\nParagraph with **bold**[[style="color:red"]]'
      const output = await process(input, {
        disableBlockElements: true,
      })

      expect(output).toContain('<strong style="color:red">bold</strong>')
    })
  })

  describe('enableAtxHeaderInline option', () => {
    it('should not process inline heading attributes when disabled', async () => {
      const input = '# Title [[data-id="test"]]'
      const output = await process(input, {
        enableAtxHeaderInline: false,
      })

      expect(output).not.toContain('data-id="test">')
      expect(output).toContain('Title [[data-id="test"]]')
    })

    it('should still process next-line heading attributes when inline disabled', async () => {
      const input = '# Title\n[[data-id="test"]]'
      const output = await process(input, {
        enableAtxHeaderInline: false,
      })

      expect(output).toContain('data-id="test">')
    })
  })
})
