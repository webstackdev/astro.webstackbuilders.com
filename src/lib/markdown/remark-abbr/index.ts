import type { Root, Text, Parent } from 'mdast'
import { visit, SKIP, CONTINUE } from 'unist-util-visit'
import type { Processor } from 'unified'
import type { AbbrDefinition, RemarkAbbr } from './types'

// Regex to match abbreviation definitions: *[abbr]: definition
const ABBR_DEFINITION_REGEX = /^\*\[([^\]]+)\]:\s*(.+)$/

/**
 * Checks if a text node contains an abbreviation definition.
 */
function isAbbrDefinition(text: string): AbbrDefinition | null {
  const match = text.match(ABBR_DEFINITION_REGEX)
  if (match && match[1] && match[2]) {
    return {
      abbr: match[1],
      reference: match[2],
    }
  }
  return null
}

/**
 * Collects all abbreviation definitions from the AST.
 * Abbreviation definitions are in the form: *[abbr]: definition
 */
function collectAbbreviations(tree: Root): Map<string, string> {
  const abbreviations = new Map<string, string>()

  visit(tree, 'paragraph', (node, index, parent) => {
    // Check if this paragraph contains only abbreviation definitions
    const firstChild = node.children[0]
    if (node.children.length === 1 && firstChild && firstChild.type === 'text') {
      const text = firstChild.value
      const lines = text.split('\n')
      const definitions: AbbrDefinition[] = []

      // Check if all lines are abbreviation definitions
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) {
          continue
        }

        const def = isAbbrDefinition(trimmed)
        if (def) {
          definitions.push(def)
        } else {
          // Not all lines are definitions, so this isn't a definition paragraph
          return CONTINUE
        }
      }

      // If we found definitions, add them and remove this paragraph
      if (definitions.length > 0) {
        for (const def of definitions) {
          // Later definitions override earlier ones (as per original behavior)
          abbreviations.set(def.abbr, def.reference)
        }

        // Remove this paragraph from the tree
        if (parent && typeof index === 'number') {
          ;(parent as Parent).children.splice(index, 1)
          return [SKIP, index]
        }
      }
    }

    return CONTINUE
  })

  return abbreviations
}

/**
 * Replaces abbreviations in text nodes with abbr nodes.
 */
function replaceAbbreviations(
  tree: Root,
  abbreviations: Map<string, string>,
  expandFirst: boolean
): void {
  // Track which abbreviations have been expanded
  const expanded = new Set<string>()

  // Sort abbreviations by length (longest first) to handle overlapping cases
  const sortedAbbrs = Array.from(abbreviations.keys()).sort((a, b) => b.length - a.length)

  // Visit all nodes that have children
  visit(tree, node => {
    const parentNode = node as Parent
    if (!parentNode.children) {
      return CONTINUE
    }

    // Process each child node
    for (let c = 0; c < parentNode.children.length; c++) {
      const child = parentNode.children[c]

      // Skip if child doesn't exist or is not a text node
      if (!child || child.type !== 'text') {
        continue
      }

      const textNode = child as Text
      const text = textNode.value

      // Track replacements to make
      const replacements: Array<{ start: number; end: number; abbr: string }> = []

      // Find all abbreviation occurrences
      for (const abbr of sortedAbbrs) {
        let index = 0
        while ((index = text.indexOf(abbr, index)) !== -1) {
          // Check if this is a whole-word match
          // For abbreviations, we need to ensure they're not part of a larger word
          const before = index > 0 ? text.charAt(index - 1) : ' '
          const after = index + abbr.length < text.length ? text.charAt(index + abbr.length) : ' '

          // Check if before/after are word boundaries (not letters)
          const beforeOk = !/[A-Za-z]/.test(before)
          const afterOk = !/[A-Za-z]/.test(after)

          if (beforeOk && afterOk) {
            // Check if this doesn't overlap with an existing replacement
            const overlaps = replacements.some(
              r =>
                (index >= r.start && index < r.end) ||
                (index + abbr.length > r.start && index < r.end)
            )

            if (!overlaps) {
              replacements.push({ start: index, end: index + abbr.length, abbr })
            }
          }

          index++
        }
      }

      // If no replacements, continue
      if (replacements.length === 0) {
        continue
      }

      // Sort replacements by start position
      replacements.sort((a, b) => a.start - b.start)

      // Build new nodes
      const newNodes: Array<Text | Record<string, unknown>> = []
      let lastIndex = 0

      for (const replacement of replacements) {
        const { start, end, abbr } = replacement
        const reference = abbreviations.get(abbr)

        if (!reference) {
          continue
        }

        // Add text before the abbreviation
        if (start > lastIndex) {
          newNodes.push({
            type: 'text',
            value: text.slice(lastIndex, start),
          } as Text)
        }

        // Add abbreviation node
        const isFirstOccurrence = !expanded.has(abbr)
        const shouldExpand = expandFirst && isFirstOccurrence

        if (shouldExpand) {
          // Expand first: "reference (abbr)"
          newNodes.push({
            type: 'text',
            value: `${reference} (`,
          } as Text)

          newNodes.push({
            type: 'abbr',
            abbr,
            reference,
            value: abbr,
            data: {
              hName: 'abbr',
              hProperties: {
                title: reference,
              },
              hChildren: [{ type: 'text', value: abbr }],
            },
          })

          newNodes.push({
            type: 'text',
            value: ')',
          } as Text)

          expanded.add(abbr)
        } else {
          // Regular abbr node
          newNodes.push({
            type: 'abbr',
            abbr,
            reference,
            value: abbr,
            data: {
              hName: 'abbr',
              hProperties: {
                title: reference,
              },
              hChildren: [{ type: 'text', value: abbr }],
            },
          })
        }

        lastIndex = end
      }

      // Add remaining text
      if (lastIndex < text.length) {
        newNodes.push({
          type: 'text',
          value: text.slice(lastIndex),
        } as Text)
      }

      // Replace the text node with the new nodes
      parentNode.children.splice(c, 1, ...(newNodes as Text[]))
      c += newNodes.length - 1
    }

    return CONTINUE
  })
}

/**
 * remark-abbr plugin
 *
 * Transforms abbreviation definitions into abbr elements.
 *
 * Example:
 * markdown
 * The HTML specification.
 *
 * [HTML]: Hyper Text Markup Language
 *
 * Becomes:
 * html
 * The abbr title="Hyper Text Markup Language">HTML abbr> specification.
 */
const remarkAbbr: RemarkAbbr = function (this: Processor, options = {}) {
  const expandFirst = options.expandFirst ?? false

  // Set up toMarkdownExtensions at the processor level
  const processorData = this.data()
  const toMarkdownExtensions =
    (processorData['toMarkdownExtensions'] as Array<Record<string, unknown>>) || []

  toMarkdownExtensions.push({
    handlers: {
      abbr: (node: Record<string, unknown>) => {
        return String(node['abbr'] || '')
      },
    },
  })

  processorData['toMarkdownExtensions'] = toMarkdownExtensions

  return (tree: Root) => {
    // Collect all abbreviation definitions
    const abbreviations = collectAbbreviations(tree)

    // Replace abbreviations in text nodes
    if (abbreviations.size > 0) {
      replaceAbbreviations(tree, abbreviations, expandFirst)
    }
  }
}

export default remarkAbbr
export { remarkAbbr }
