import type { MarkdownHeading } from 'astro'

export interface TocItem {
  depth: number
  slug?: string
  text: string
  children: TocItem[]
}

export const buildTocTree = (headings: MarkdownHeading[]): TocItem[] => {
  const tree: TocItem[] = []
  const stack: TocItem[] = []

  headings.forEach(heading => {
    if (!heading.text || heading.depth < 2) {
      return
    }

    const node: TocItem = {
      depth: heading.depth,
      slug: heading.slug,
      text: heading.text,
      children: [],
    }

    while (stack.length > 0 && node.depth <= stack[stack.length - 1].depth) {
      stack.pop()
    }

    if (stack.length === 0) {
      tree.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }

    stack.push(node)
  })

  return tree
}
