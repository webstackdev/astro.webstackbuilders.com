import type { Code, Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

type GroupMeta = {
  group: string
  tab: string
  /** Meta string with the [group:tab] token removed */
  cleanedMeta: string | undefined
}

const groupTokenRegex = /\[(?<group>[^\]:]+):(?<tab>[^\]]+)\]/

function parseGroupMeta(meta: string | null | undefined): GroupMeta | null {
  if (!meta) return null

  const match = groupTokenRegex.exec(meta)
  if (!match || !match.groups) return null

  const group = match.groups['group']?.trim()
  const tab = match.groups['tab']?.trim()

  if (!group || !tab) return null

  const cleanedMeta = meta.replace(match[0], '').trim() || undefined

  return { group, tab, cleanedMeta }
}

const remarkCodeTabs: Plugin<[], Root> = () => {
  return tree => {
    visit(tree, 'code', (node: Code) => {
      const parsed = parseGroupMeta(node.meta)
      if (!parsed) return

      node.meta = parsed.cleanedMeta

      node.data = node.data || {}

      const existingProps = (node.data as { hProperties?: Record<string, unknown> }).hProperties || {}

      ;(node.data as { hProperties: Record<string, unknown> }).hProperties = {
        ...existingProps,
        'data-code-tabs-group': parsed.group,
        'data-code-tabs-tab': parsed.tab,
      }
    })
  }
}

export default remarkCodeTabs
export { parseGroupMeta }
