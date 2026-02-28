import type { MarkdownHeading } from 'astro'

export interface TocItem {
  depth: number
  slug?: string
  text: string
  children: TocItem[]
}

/** Heading texts excluded from the table of contents (case-insensitive) */
const EXCLUDED_HEADINGS = new Set(['footnotes'])

export const buildTocTree = (headings: MarkdownHeading[]): TocItem[] => {
  const tree: TocItem[] = []
  const stack: TocItem[] = []

  headings.forEach(heading => {
    if (!heading.text || heading.depth < 2) {
      return
    }

    // Skip headings that should not appear in the ToC (e.g. "Footnotes")
    if (EXCLUDED_HEADINGS.has(heading.text.trim().toLowerCase())) {
      return
    }

    const node: TocItem = {
      depth: heading.depth,
      slug: heading.slug,
      text: heading.text,
      children: [],
    }

    while (stack.length > 0) {
      const parent = stack[stack.length - 1]
      if (!parent || node.depth > parent.depth) {
        break
      }
      stack.pop()
    }

    const parent = stack[stack.length - 1]
    if (!parent) {
      tree.push(node)
    } else {
      parent.children.push(node)
    }

    stack.push(node)
  })

  return tree
}
