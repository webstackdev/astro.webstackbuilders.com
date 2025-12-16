import type { Root } from 'mdast'
import type { Plugin } from 'unified'

/**
 * Scope for filtering attributes
 */
export type AttributeScope =
  | 'none' // Plugin disabled
  | 'permissive' // Allow all attributes except dangerous DOM handlers (unless enabled)
  | 'every' // Same as permissive
  | 'extended' // Allow specific + global + extended attributes
  | 'specific' // Allow element-specific + global attributes
  | 'global' // Allow only global HTML attributes

/**
 * Supported element types for attribute parsing
 */
export type SupportedElement =
  | 'image'
  | 'link'
  | 'atxHeading'
  | 'strong'
  | 'emphasis'
  | 'deletion'
  | 'code'
  | 'setextHeading'
  | 'fencedCode'
  | 'reference'
  | 'footnoteCall'
  | 'autoLink'

/**
 * Configuration for md-attr-parser
 */
export interface MdAttrConfig {
  // Configuration options for the md-attr-parser library
  [key: string]: unknown
}

/**
 * Extended attributes configuration
 * Maps element types to arrays of allowed attribute names
 */
export interface ExtendConfig {
  [elementType: string]: string[]
  '*'?: string[] // Global extensions
}

/**
 * Plugin configuration options
 */
export interface RemarkAttrOptions {
  /**
   * Allow dangerous DOM event handlers (onclick, onload, etc.)
   * @default false
   */
  allowDangerousDOMEventHandlers?: boolean

  /**
   * Elements to process for attributes
   * @default Set of all supported elements
   */
  elements?: Set<SupportedElement> | SupportedElement[]

  /**
   * Extended attribute configuration
   * @default {}
   */
  extend?: ExtendConfig

  /**
   * Scope for filtering attributes
   * @default 'extended'
   */
  scope?: AttributeScope

  /**
   * Configuration passed to md-attr-parser
   * @default undefined
   */
  mdAttrConfig?: MdAttrConfig

  /**
   * Enable inline attributes for ATX headings
   * @default true
   */
  enableAtxHeaderInline?: boolean

  /**
   * Disable processing of block elements
   * @default false
   */
  disableBlockElements?: boolean
}

/**
 * Parsed attribute result from md-attr-parser
 */
export interface ParsedAttribute {
  prop: Record<string, string | undefined>
  eaten: string
}

/**
 * HTML element to markdown type conversion map
 */
export interface ConversionMap {
  image: 'img'
  link: 'a'
  heading: 'h1'
  strong: 'strong'
  emphasis: 'em'
  delete: 's'
  inlineCode: 'code'
  code: 'code'
  linkReference: 'a'
  '*': '*'
}

/**
 * The remark-attr plugin type
 */
export type RemarkAttr = Plugin<[RemarkAttrOptions?], Root>
