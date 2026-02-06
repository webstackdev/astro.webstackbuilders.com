import type { Code, Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

const remarkShikiMeta: Plugin<[], Root> = () => {
  return tree => {
    visit(tree, 'code', (node: Code) => {
      const meta = node.meta?.trim()
      if (!meta) return

      node.data = node.data || {}

      const existingProps =
        (node.data as { hProperties?: Record<string, unknown> }).hProperties || {}

      ;(node.data as { hProperties: Record<string, unknown> }).hProperties = {
        ...existingProps,
        'data-shiki-meta': meta,
      }
    })
  }
}

export default remarkShikiMeta
