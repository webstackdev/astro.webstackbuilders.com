import { describe, expect, it } from 'vitest'
import type { MarkdownHeading } from 'astro'
import headingsFixture from '../__fixtures__/headings.fixture.json'
import { buildTocTree } from '../index'

describe('buildTocTree', () => {
  it('constructs a nested tree and filters out unsupported headings', () => {
    const headings = headingsFixture as MarkdownHeading[]

    const tree = buildTocTree(headings)

    expect(tree).toHaveLength(2)

    const [firstSection, secondSection] = tree
    expect(firstSection?.slug).toBe('section-one')
    expect(firstSection?.children).toHaveLength(1)

    const firstChild = firstSection?.children.at(0)
    expect(firstChild?.slug).toBe('section-one-overview')
    expect(firstChild?.children).toHaveLength(1)
    expect(firstChild?.children.at(0)?.slug).toBe('section-one-details')

    expect(secondSection?.slug).toBe('section-two')
    expect(secondSection?.children.at(0)?.slug).toBe('section-two-overview')
  })

  it('returns an empty list when no headings pass validation', () => {
    const tree = buildTocTree([
      { slug: 'top', depth: 1, text: 'Heading 1' } as MarkdownHeading,
      { slug: 'empty', depth: 2, text: '' } as MarkdownHeading,
    ])

    expect(tree).toEqual([])
  })
})
