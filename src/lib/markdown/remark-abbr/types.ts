import type { Root } from 'mdast'
import type { Plugin } from 'unified'

/**
 * Configuration options for the remark-abbr plugin.
 */
export interface RemarkAbbrOptions {
  /**
   * When true, the first occurrence of an abbreviation will be expanded
   * to show the full text followed by the abbreviation in parentheses.
   * For example: "Hyper Text Markup Language (HTML)"
   * Subsequent occurrences will only show the abbreviation with a title attribute.
   *
   * @default false
   */
  expandFirst?: boolean
}

/**
 * Represents an abbreviation definition parsed from the markdown.
 * Example: *[HTML]: Hyper Text Markup Language
 */
export interface AbbrDefinition {
  /** The abbreviation text (e.g., "HTML") */
  abbr: string
  /** The full expansion/definition (e.g., "Hyper Text Markup Language") */
  reference: string
}

/**
 * Custom mdast node type for abbreviations.
 * This node type is used in the AST to represent abbreviations that should
 * be rendered as <abbr> elements.
 */
export interface AbbrNode {
  type: 'abbr'
  /** The abbreviation text */
  abbr: string
  /** The full expansion/definition */
  reference: string
  /** The text content to display */
  value: string
  /** Optional data for additional properties */
  data?: {
    hName?: string
    hProperties?: Record<string, string>
  }
}

/**
 * The remark-abbr plugin type.
 */
export type RemarkAbbr = Plugin<[RemarkAbbrOptions?], Root>
