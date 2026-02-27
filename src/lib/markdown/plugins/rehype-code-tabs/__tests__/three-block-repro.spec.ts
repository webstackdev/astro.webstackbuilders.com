/**
 * Diagnostic test to reproduce the 3-block code-tabs grouping bug.
 * Run with: npx vitest run src/lib/markdown/plugins/rehype-code-tabs/__tests__/three-block-repro.spec.ts
 */
import { describe, it, expect } from 'vitest'
import type { Root, Element } from 'hast'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkCodeTabs from '@lib/markdown/plugins/remark-code-tabs'
import rehypeCodeTabs from '@lib/markdown/plugins/rehype-code-tabs'
import { unified } from 'unified'

function isElementNode(node: unknown): node is Element {
  return (
    !!node &&
    typeof node === 'object' &&
    (node as Element).type === 'element'
  )
}

describe('3-block code-tabs grouping', () => {
  it('groups 3 consecutive same-group blocks (remark pipeline)', async () => {
    const md = [
      '```typescript [g1:TypeScript]',
      'const x = 1',
      '```',
      '```php [g1:PHP]',
      '<?php echo 1;',
      '```',
      '```python [g1:Python]',
      'print(1)',
      '```',
    ].join('\n')

    const html = String(
      await remark()
        .use(remarkCodeTabs)
        .use(remarkRehype)
        .use(rehypeCodeTabs)
        .use(rehypeStringify)
        .process(md)
    )

    console.log('HTML output:', html)

    // All 3 should be inside a single <code-tabs>
    const codeTabsCount = (html.match(/<code-tabs/g) || []).length
    expect(codeTabsCount, 'Should have exactly 1 <code-tabs> wrapper').toBe(1)
  })

  it('groups 3 consecutive same-group HAST blocks directly', async () => {
    const makePre = (tab: string): Element => ({
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [{
        type: 'element',
        tagName: 'code',
        properties: {
          'data-code-tabs-group': 'g1',
          'data-code-tabs-tab': tab,
        },
        children: [{ type: 'text', value: `code for ${tab}` }],
      }],
    })

    const tree: Root = {
      type: 'root',
      children: [
        makePre('TypeScript'),
        { type: 'text', value: '\n' },
        makePre('PHP'),
        { type: 'text', value: '\n' },
        makePre('Python'),
      ],
    }

    const processor = unified().use(rehypeCodeTabs)
    await processor.run(tree as never)

    const elements = tree.children.filter(isElementNode)

    console.log('Elements:', elements.map(e => `${e.tagName}(${e.children?.length})`))

    expect(elements.length, 'Should have exactly 1 top-level element').toBe(1)
    const wrapper = elements[0]
    expect(wrapper).toBeDefined()
    if (!wrapper) return

    expect(wrapper.tagName).toBe('code-tabs')
    expect(wrapper.children.length, 'code-tabs should contain all 3 pre blocks').toBe(3)
  })

  it('unwraps figure-wrapped grouped code blocks and groups them', async () => {
    const makePre = (tab: string, lang: string): Element => ({
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [{
        type: 'element',
        tagName: 'code',
        properties: {
          className: [`language-${lang}`],
          'data-code-tabs-group': 'g1',
          'data-code-tabs-tab': tab,
        },
        children: [{ type: 'text', value: `code for ${tab}` }],
      }],
    })

    // Simulate remark-captions wrapping the 3rd code block in <figure>
    const tree: Root = {
      type: 'root',
      children: [
        makePre('TypeScript', 'typescript'),
        { type: 'text', value: '\n' },
        makePre('PHP', 'php'),
        { type: 'text', value: '\n' },
        {
          type: 'element',
          tagName: 'figure',
          properties: {},
          children: [
            makePre('Python', 'python'),
            {
              type: 'element',
              tagName: 'figcaption',
              properties: {},
              children: [{ type: 'text', value: 'Different admission control strategies.' }],
            },
          ],
        } as Element,
      ],
    }

    const processor = unified().use(rehypeCodeTabs)
    await processor.run(tree as never)

    const elements = tree.children.filter(isElementNode)

    expect(elements.length, 'Should have exactly 1 top-level element').toBe(1)
    const wrapper = elements[0]
    expect(wrapper).toBeDefined()
    if (!wrapper) return

    expect(wrapper.tagName).toBe('code-tabs')
    expect(wrapper.children.length, 'code-tabs should contain all 3 pre blocks').toBe(3)
    // Verify all children are <pre> (not figure)
    expect(wrapper.children.every(
      c => isElementNode(c) && c.tagName === 'pre'
    )).toBe(true)
  })

  it('does NOT unwrap figures containing non-grouped code blocks', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'figure',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'pre',
              properties: {},
              children: [{
                type: 'element',
                tagName: 'code',
                properties: { className: ['language-python'] },
                children: [{ type: 'text', value: 'print(1)' }],
              }],
            },
            {
              type: 'element',
              tagName: 'figcaption',
              properties: {},
              children: [{ type: 'text', value: 'A standalone caption.' }],
            },
          ],
        } as Element,
      ],
    }

    const processor = unified().use(rehypeCodeTabs)
    await processor.run(tree as never)

    const elements = tree.children.filter(isElementNode)

    // The figure should be left alone (not unwrapped)
    // The pre inside gets standalone-wrapped in code-tabs
    expect(elements.length).toBe(1)
    const figure = elements[0]
    expect(figure).toBeDefined()
    if (!figure) return

    // The figure stays as-is, and the standalone wrapping happens inside it
    expect(figure.tagName).toBe('figure')
  })
})
