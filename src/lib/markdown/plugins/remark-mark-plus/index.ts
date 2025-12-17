import type { Root, Text, Parent } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

type MarkNode = {
  type: 'mark'
  children: Text[]
  data: {
    hName: 'mark'
  }
}

type HasChildren = Parent & { children: unknown[] }

function isHasChildren(node: unknown): node is HasChildren {
  if (!node || typeof node !== 'object') return false
  if (!('children' in (node as HasChildren))) return false
  return Array.isArray((node as HasChildren).children)
}

function splitMarkedText(value: string): Array<Text | MarkNode> {
  const parts: Array<Text | MarkNode> = []
  let hasMark = false

  let cursor = 0

  while (cursor < value.length) {
    const start = value.indexOf('==', cursor)
    if (start === -1) {
      const tail = value.slice(cursor)
      if (tail) parts.push({ type: 'text', value: tail })
      break
    }

    const before = value.slice(cursor, start)
    if (before) parts.push({ type: 'text', value: before })

    const contentStart = start + 2
    const end = value.indexOf('==', contentStart)

    // No closing delimiter; treat remainder as plain text.
    if (end === -1) {
      parts.push({ type: 'text', value: value.slice(start) })
      break
    }

    const marked = value.slice(contentStart, end)

    // Empty highlights are treated as plain text (avoids producing empty <mark/>).
    if (!marked) {
      parts.push({ type: 'text', value: '====' })
      cursor = end + 2
      continue
    }

    parts.push({
      type: 'mark',
      children: [{ type: 'text', value: marked }],
      data: { hName: 'mark' },
    })

    hasMark = true

    cursor = end + 2
  }

  // If no marks were created, keep the original text intact.
  // This prevents breaking other token-based plugins (e.g., `<==>` in remark-replacements).
  if (!hasMark) return [{ type: 'text', value }]

  return parts
}

const remarkMarkPlus: Plugin<[], Root> = () => {
  return tree => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || typeof index !== 'number') return
      if (!isHasChildren(parent)) return

      if (!node.value.includes('==')) return

      const replacement = splitMarkedText(node.value)
      if (replacement.length === 1) {
        const first = replacement.at(0)
        if (first?.type === 'text') return
      }

      ;(parent.children as unknown[]).splice(index, 1, ...replacement)

      // Tell unist-util-visit to skip over the nodes we just inserted.
      return index + replacement.length
    })
  }
}

export default remarkMarkPlus
