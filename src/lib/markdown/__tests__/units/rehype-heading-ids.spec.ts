import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import type { Element, Root } from 'hast'
import { rehypeHeadingIds } from '@astrojs/markdown-remark'

function getHeading(tree: Root, index: number): Element {
  const node = tree.children[index]
  if (!node || node.type !== 'element') {
    throw new Error(`Expected element at tree.children[${index}]`)
  }
  return node
}

describe('rehypeHeadingIds (external plugin)', () => {
  it('adds an id to headings based on text content', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: {},
          children: [{ type: 'text', value: 'Hello World' }],
        },
      ],
    }

    await unified().use(rehypeHeadingIds).run(tree)

    const heading = getHeading(tree, 0)
    expect(heading.properties).toMatchObject({ id: 'hello-world' })
  })

  it('generates unique ids when headings repeat', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: {},
          children: [{ type: 'text', value: 'Hello World' }],
        },
        {
          type: 'element',
          tagName: 'h3',
          properties: {},
          children: [{ type: 'text', value: 'Hello World' }],
        },
        {
          type: 'element',
          tagName: 'h4',
          properties: {},
          children: [{ type: 'text', value: 'Hello World' }],
        },
      ],
    }

    await unified().use(rehypeHeadingIds).run(tree)

    expect(getHeading(tree, 0).properties).toMatchObject({ id: 'hello-world' })
    expect(getHeading(tree, 1).properties).toMatchObject({ id: 'hello-world-1' })
    expect(getHeading(tree, 2).properties).toMatchObject({ id: 'hello-world-2' })
  })

  it('does not overwrite an existing id', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: { id: 'custom-id' },
          children: [{ type: 'text', value: 'Hello World' }],
        },
      ],
    }

    await unified().use(rehypeHeadingIds).run(tree)

    expect(getHeading(tree, 0).properties).toMatchObject({ id: 'custom-id' })
  })
})
