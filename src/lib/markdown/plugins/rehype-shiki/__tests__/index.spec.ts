import { describe, expect, it, vi } from 'vitest'
import type { Root, Element } from 'hast'

vi.mock('shiki', () => {
  return {
    createHighlighter: vi.fn(async () => {
      return {
        loadLanguage: vi.fn(async () => undefined),
        codeToHast: (_code: string) => {
          const highlightedPre: Element = {
            type: 'element',
            tagName: 'pre',
            properties: { class: 'shiki', tabindex: '0' },
            children: [
              {
                type: 'element',
                tagName: 'code',
                properties: {},
                children: [{ type: 'text', value: 'highlighted' }],
              },
            ],
          }

          const root: Root = {
            type: 'root',
            children: [highlightedPre],
          }

          return root
        },
      }
    }),
  }
})

import rehypeShiki from '../index'

function getPre(tree: Root): Element {
  const pre = tree.children[0] as Element | undefined
  if (!pre || pre.type !== 'element' || pre.tagName !== 'pre') {
    throw new Error('Expected pre element at root')
  }
  return pre
}

describe('rehype-shiki', () => {
  it('highlights code blocks and preserves existing data attributes', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {
            'data-code-tabs-group': 'g1',
            'data-code-tabs-tab': 'JavaScript',
          },
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {
                className: ['language-js'],
              },
              children: [{ type: 'text', value: 'console.log(1)\n' }],
            },
          ],
        },
      ],
    }

    const transformer = (rehypeShiki as unknown as (_opts: unknown) => unknown)({
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: 'light',
      langAlias: { js: 'javascript' },
      wrap: false,
    })

    const run = transformer as unknown as (_tree: Root) => Promise<void>
    await run(tree)

    const pre = getPre(tree)
    expect(pre.properties?.['data-code-tabs-group']).toBe('g1')
    expect(pre.properties?.['data-code-tabs-tab']).toBe('JavaScript')
    expect(pre.properties?.['data-language']).toBe('javascript')
    expect(pre.properties?.['tabIndex']).toBe(0)

    const classNames = pre.properties?.['className'] as string[]
    expect(classNames).toEqual(expect.arrayContaining(['shiki', 'overflow-x-auto', 'whitespace-pre']))
  })

  it('skips excluded languages', async () => {
    const originalPre: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: { className: ['language-mermaid'] },
          children: [{ type: 'text', value: 'graph TD; A-->B' }],
        },
      ],
    }

    const tree: Root = {
      type: 'root',
      children: [originalPre],
    }

    const transformer = (rehypeShiki as unknown as (_opts: unknown) => unknown)({
      themes: { light: 'github-light', dark: 'github-dark' },
      excludeLangs: ['mermaid', 'math'],
    })

    const run = transformer as unknown as (_tree: Root) => Promise<void>
    await run(tree)

    expect(tree.children[0]).toBe(originalPre)
  })
})
