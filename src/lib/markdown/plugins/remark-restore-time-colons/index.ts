/**
 * Remark plugin to restore numeric-only directive nodes back to plain text.
 *
 * The `remark-directive` parser treats colon-prefixed digit sequences (e.g.
 * `:47` in "2:47 AM" or `:59` in "11:59:59") as text directives. Those
 * unhandled nodes later render as empty `<div></div>` elements and break
 * paragraph flow.
 *
 * This transformer runs **after** `remarkDirective` (and after any plugins
 * that consume real directives, such as `remarkVideo`). It walks the tree,
 * finds directive nodes whose name is purely numeric, and splices them back
 * into the surrounding text, restoring the original colon-separated time
 * strings.
 */
import type { Parent, Root, Text } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

/**
 * Test whether a directive name is purely numeric (0-9).
 * No valid remark directive would use a numeric-only name, so these are
 * always false positives created from time-like strings.
 */
const isNumericName = (name: string): boolean => /^\d+$/.test(name)

/** Record of a directive node to restore, collected during walk. */
interface PendingRestore {
  parent: Parent
  index: number
  name: string
}

const remarkRestoreTimeColons: Plugin<[], Root> = () => {
  return (tree: Root) => {
    // Phase 1: Collect all numeric directive nodes
    const pending: PendingRestore[] = []

    visit(tree, (node, index, parent) => {
      if (
        node.type !== 'textDirective' &&
        node.type !== 'leafDirective'
      ) {
        return
      }

      // Only restore purely-numeric names; real directives have alphabetic names
      if (!isNumericName(node.name)) return
      if (index === undefined || !parent) return

      pending.push({ parent: parent as Parent, index, name: node.name })
    })

    // Phase 2: Process in reverse order so earlier indices stay valid
    for (let i = pending.length - 1; i >= 0; i--) {
      const entry = pending[i]
      if (!entry) continue
      const { parent, index, name } = entry

      const textNode: Text = { type: 'text', value: `:${name}` }
      parent.children.splice(index, 1, textNode as typeof parent.children[0])

      // Merge with next text sibling
      const current = parent.children[index]
      const next = parent.children[index + 1]
      if (current && next && current.type === 'text' && next.type === 'text') {
        ;(current as Text).value += (next as Text).value
        parent.children.splice(index + 1, 1)
      }

      // Merge with previous text sibling
      const prev = parent.children[index - 1]
      const curr = parent.children[index]
      if (prev && curr && prev.type === 'text' && curr.type === 'text') {
        ;(prev as Text).value += (curr as Text).value
        parent.children.splice(index, 1)
      }
    }
  }
}

export default remarkRestoreTimeColons
