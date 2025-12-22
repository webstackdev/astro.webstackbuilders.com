import { describe, it, expect } from 'vitest'
import type { Root, Element } from 'hast'
import { unified } from 'unified'
import rehypeCodeTabs from '@lib/markdown/plugins/rehype-code-tabs'

describe('rehype-code-tabs (Layer 1: Isolated)', () => {
  it('should wrap consecutive grouped <pre> blocks in <code-tabs>', async () => {
    const pre1: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {
            'data-code-tabs-group': 'g1',
            'data-code-tabs-tab': 'JS',
          },
          children: [{ type: 'text', value: 'console.log(1)' }],
        },
      ],
    }

    const pre2: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {
            'data-code-tabs-group': 'g1',
            'data-code-tabs-tab': 'TS',
          },
          children: [{ type: 'text', value: 'console.log(2)' }],
        },
      ],
    }

    const tree: Root = {
      type: 'root',
      children: [pre1, { type: 'text', value: '\n' }, pre2],
    }

    const processor = unified().use(rehypeCodeTabs)
    await processor.run(tree as never)

    const wrapper = tree.children[0] as Element
    expect(wrapper.tagName).toBe('code-tabs')
    expect((wrapper.properties?.['className'] as string[])?.includes('code-tabs')).toBe(true)
    expect(wrapper.properties?.['data-code-tabs-group']).toBe('g1')
    expect(wrapper.children.length).toBe(2)
  })

  it('should wrap a standalone <pre> block in <code-tabs> (single block mode)', async () => {
    const pre: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {
        'data-language': 'ts',
      },
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {
            className: ['language-ts'],
          },
          children: [{ type: 'text', value: 'const x: number = 1' }],
        },
      ],
    }

    const tree: Root = {
      type: 'root',
      children: [pre],
    }

    const processor = unified().use(rehypeCodeTabs)
    await processor.run(tree as never)

    const wrapper = tree.children[0] as Element
    expect(wrapper.tagName).toBe('code-tabs')
    expect((wrapper.properties?.['className'] as string[])?.includes('code-tabs')).toBe(true)
    expect(wrapper.children.length).toBe(1)
    expect((wrapper.children[0] as Element).tagName).toBe('pre')
  })

  it.each(['mermaid', 'math', 'text'])('should not wrap excluded language %s', async (lang) => {
    const pre: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {
        'data-language': lang,
      },
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {
            className: [`language-${lang}`],
          },
          children: [{ type: 'text', value: 'x' }],
        },
      ],
    }

    const tree: Root = {
      type: 'root',
      children: [pre],
    }

    const processor = unified().use(rehypeCodeTabs)
    await processor.run(tree as never)

    const first = tree.children[0] as Element
    expect(first.tagName).toBe('pre')
  })

  it('should not wrap blocks from different groups', async () => {
    const pre1: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {
            'data-code-tabs-group': 'g1',
            'data-code-tabs-tab': 'JS',
          },
          children: [{ type: 'text', value: 'a' }],
        },
      ],
    }

    const pre2: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {
            'data-code-tabs-group': 'g2',
            'data-code-tabs-tab': 'TS',
          },
          children: [{ type: 'text', value: 'b' }],
        },
      ],
    }

    const tree: Root = {
      type: 'root',
      children: [pre1, { type: 'text', value: '\n' }, pre2],
    }

    const processor = unified().use(rehypeCodeTabs)
    await processor.run(tree as never)

    const first = tree.children[0] as Element
    expect(first.tagName).toBe('code-tabs')
    expect(first.children.length).toBe(1)
    expect((first.children[0] as Element).tagName).toBe('pre')

    const second = tree.children[2] as Element
    expect(second.tagName).toBe('code-tabs')
    expect(second.children.length).toBe(1)
    expect((second.children[0] as Element).tagName).toBe('pre')
  })

  it('should support camelCase data props (MDX-style) on <code>', async () => {
    const pre1: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {
            dataCodeTabsGroup: 'g1',
            dataCodeTabsTab: 'JavaScript',
          },
          children: [{ type: 'text', value: 'console.log(1)' }],
        },
      ],
    }

    const pre2: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {
            dataCodeTabsGroup: 'g1',
            dataCodeTabsTab: 'TypeScript',
          },
          children: [{ type: 'text', value: 'console.log(2)' }],
        },
      ],
    }

    const tree: Root = {
      type: 'root',
      children: [pre1, { type: 'text', value: '\n' }, pre2],
    }

    const processor = unified().use(rehypeCodeTabs)
    await processor.run(tree as never)

    const wrapper = tree.children[0] as Element
    expect(wrapper.tagName).toBe('code-tabs')
    expect(wrapper.properties?.['data-code-tabs-group']).toBe('g1')
    expect(wrapper.children.length).toBe(2)

    const firstPre = wrapper.children[0] as Element
    expect(firstPre.tagName).toBe('pre')
    expect(firstPre.properties?.['data-code-tabs-tab']).toBe('JavaScript')
  })
})
