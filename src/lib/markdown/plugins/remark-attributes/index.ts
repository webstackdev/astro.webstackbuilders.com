/**
 * remark-attr - Modern TypeScript implementation
 *
 * Add support for custom attributes to markdown elements using a {.class #id key=value} syntax.
 * Refactored from the original remark-attr to work with modern unified/remark v11+
 *
 * Original: https://github.com/zestedesavoir/zmarkdown/tree/master/packages/remark-attr
 */

import type {
  Root,
  Code,
  Image,
  Emphasis,
  Strong,
  Delete,
  InlineCode,
  Link,
  Heading,
  Text,
  Parent,
} from 'mdast'
import type { Plugin } from 'unified'
import { visit, SKIP } from 'unist-util-visit'
// @ts-expect-error - No types available for md-attr-parser
import parseAttr from 'md-attr-parser'
import { htmlElementAttributes } from 'html-element-attributes'
import { isWhitespaceCharacter } from 'is-whitespace-character'
import { isDOMEventHandler } from './dom-event-handler'
import type { RemarkAttrOptions, SupportedElement, ParsedAttribute } from './types'

/**
 * Set of supported elements
 */
export const SUPPORTED_ELEMENTS = new Set<SupportedElement>([
  'image',
  'link',
  'atxHeading',
  'strong',
  'emphasis',
  'deletion',
  'code',
  'setextHeading',
  'fencedCode',
  'reference',
  'footnoteCall',
  'autoLink',
])

/**
 * Mapping from mdast node types to our SupportedElement types
 */
const NODE_TYPE_TO_ELEMENT: Record<string, SupportedElement> = {
  image: 'image',
  link: 'link',
  heading: 'atxHeading', // Both ATX and setext headings use 'heading' type
  strong: 'strong',
  emphasis: 'emphasis',
  delete: 'deletion', // mdast uses 'delete', we use 'deletion'
  inlineCode: 'code',
  code: 'fencedCode',
  linkReference: 'reference',
  // footnoteCall and autoLink are less common
}

/**
 * Element type to HTML tag mapping
 */
const ELEMENT_TO_TAG: Record<string, string> = {
  image: 'img',
  link: 'a',
  heading: 'h1',
  strong: 'strong',
  emphasis: 'em',
  delete: 's',
  inlineCode: 'code',
  code: 'code',
  linkReference: 'a',
  '*': '*',
}

/**
 * Internal config type with normalized elements as Set
 */
interface InternalConfig {
  allowDangerousDOMEventHandlers: boolean
  elements: Set<SupportedElement>
  extend: Record<string, string[]>
  scope: string
  mdAttrConfig: unknown
  enableAtxHeaderInline: boolean
  disableBlockElements: boolean
}

/**
 * Filter attributes based on scope and configuration
 */
function filterAttributes(
  prop: Record<string, string | undefined>,
  config: InternalConfig,
  htmlTag: string
): Record<string, string | undefined> {
  const { scope, extend, allowDangerousDOMEventHandlers } = config

  // Convert extend config keys from markdown types to HTML tags
  const extendTag: Record<string, string[]> = {}
  Object.keys(extend).forEach(key => {
    const tag = ELEMENT_TO_TAG[key] || key
    const value = extend[key]
    if (value) {
      extendTag[tag] = value
    }
  })

  // Delete empty key/class/id attributes - but keep them in the object
  Object.keys(prop).forEach(p => {
    if (p !== 'key' && p !== 'class' && p !== 'id') {
      prop[p] = prop[p] || ''
    }
  })

  // Helper functions for checking attribute scope
  const isDangerous = (p: string) => isDOMEventHandler(p)

  const isSpecific = (p: string) => {
    if (!(htmlTag in htmlElementAttributes)) {
      return false
    }
    const attrs = htmlElementAttributes[htmlTag as keyof typeof htmlElementAttributes]
    return Array.isArray(attrs) && attrs.includes(p)
  }

  const isGlobal = (p: string) => {
    const globalAttrs = htmlElementAttributes['*'] || []
    return (
      globalAttrs.includes(p) ||
      /^aria-[a-z][a-z.\-_\d]*$/.test(p) ||
      /^data-[a-z][a-z_.\-\d]*$/i.test(p)
    )
  } // Combine scope checkers
  const orFunc = (fun1: (_x: string) => boolean, fun2: (_x: string) => boolean) => (x: string) =>
    fun1(x) || fun2(x)

  let inScope: (_p: string) => boolean = (_p: string) => false

  // Determine scope
  switch (scope) {
    case 'none':
      break

    case 'permissive':
    case 'every':
      if (allowDangerousDOMEventHandlers) {
        inScope = () => true
      } else {
        inScope = x => !isDangerous(x)
      }
      break

    case 'extended': {
      inScope = p => {
        const hasExtended =
          (extendTag && htmlTag in extendTag && extendTag[htmlTag]?.includes(p)) ||
          ('*' in extendTag && extendTag['*']?.includes(p))
        return hasExtended || isSpecific(p) || isGlobal(p)
      }
      if (allowDangerousDOMEventHandlers) {
        inScope = orFunc(inScope, isDangerous)
      }
      break
    }

    case 'specific': {
      inScope = orFunc(isSpecific, isGlobal)
      if (allowDangerousDOMEventHandlers) {
        inScope = orFunc(inScope, isDangerous)
      }
      break
    }

    case 'global':
      inScope = isGlobal
      if (allowDangerousDOMEventHandlers) {
        inScope = orFunc(inScope, isDangerous)
      }
      break
  }

  // Filter out attributes not in scope
  const filtered: Record<string, string | undefined> = {}
  Object.keys(prop).forEach(p => {
    if (inScope(p)) {
      filtered[p] = prop[p]
    }
  })

  return filtered
}

/**
 * Parse attributes from text after an inline element
 */
function parseInlineAttributes(
  text: string,
  startIndex: number,
  mdAttrConfig: unknown
): ParsedAttribute | null {
  if (startIndex >= text.length) return null

  // Legacy syntax: `{.class #id key=value}`
  if (text[startIndex] === '{') {
    try {
      return parseAttr(text, startIndex, mdAttrConfig) as ParsedAttribute
    } catch {
      return null
    }
  }

  // MDX-safe syntax: `[[.class #id key=value]]`
  // Also allow a single leading space before the marker: ` [[...]]`
  const hasSingleLeadingSpace =
    text[startIndex] === ' ' && text[startIndex + 1] === '[' && text[startIndex + 2] === '['
  const openIndex = hasSingleLeadingSpace ? startIndex + 1 : startIndex

  if (text[openIndex] !== '[' || text[openIndex + 1] !== '[') {
    return null
  }

  const closeIndex = text.indexOf(']]', openIndex + 2)
  if (closeIndex === -1) {
    return null
  }

  const inner = text.slice(openIndex + 2, closeIndex)
  const normalized = `{${inner}}`

  try {
    const parsed = parseAttr(normalized, 0, mdAttrConfig) as ParsedAttribute
    if (!parsed) return null

    const eatenLength = closeIndex + 2 - openIndex + (hasSingleLeadingSpace ? 1 : 0)
    parsed.eaten = text.slice(startIndex, startIndex + eatenLength)
    return parsed
  } catch {
    return null
  }
}

/**
 * Process inline elements (emphasis, strong, delete, inlineCode, link)
 */
function processInlineElement(
  node: Emphasis | Strong | Delete | InlineCode | Link | Image,
  index: number | null,
  parent: Parent | undefined,
  config: InternalConfig
): void {
  if (index === null || !parent || !parent.children) {
    return
  }

  // Check if the next sibling is text starting with {
  const nextNode = parent.children[index + 1]
  if (!nextNode || nextNode.type !== 'text') {
    return
  }

  const textNode = nextNode as Text
  const parsedAttr = parseInlineAttributes(textNode.value, 0, config.mdAttrConfig)

  if (!parsedAttr) {
    return
  }

  // Get HTML tag for this element type
  const htmlTag = ELEMENT_TO_TAG[node.type] || 'span'

  // Filter and apply attributes
  const filteredProps = filterAttributes(parsedAttr.prop, config, htmlTag)

  // Always apply attributes if we parsed them, even if empty after filtering
  if (!node.data) {
    node.data = {}
  }
  if (!node.data.hProperties) {
    node.data.hProperties = {}
  }

  // Merge filtered properties
  Object.assign(node.data.hProperties, filteredProps)

  // Remove the attribute text from the next text node
  textNode.value = textNode.value.slice(parsedAttr.eaten.length)

  // If the text node is now empty, remove it
  if (textNode.value.length === 0) {
    parent.children.splice(index + 1, 1)
  }
}

/**
 * Process heading elements with inline attributes
 * Only applies to ATX headings (# Title {attrs}), not setext headings
 */
function processHeadingInline(node: Heading, config: InternalConfig): void {
  if (!config.enableAtxHeaderInline || !node.children || node.children.length === 0) {
    return
  }

  // Skip if this is a setext heading (has multiple lines in position)
  // Setext headings have the underline on a separate line
  if (node.position) {
    const lines = node.position.end.line - node.position.start.line
    if (lines > 0) {
      // This is a setext heading (multi-line), skip inline attribute processing
      return
    }
  }

  const lastChild = node.children[node.children.length - 1]

  if (!lastChild || lastChild.type !== 'text') {
    return
  }

  const textNode = lastChild as Text
  const text = textNode.value

  const endsWithCurly = text.endsWith('}')
  const endsWithDoubleBrackets = text.endsWith(']]')

  if (!text || text.length === 0 || (!endsWithCurly && !endsWithDoubleBrackets)) {
    return
  }

  // Find the opening marker
  const openIndex = endsWithCurly ? text.lastIndexOf('{') : text.lastIndexOf('[[')
  if (openIndex <= 0) {
    return
  }

  // Try to parse attributes
  const parsedAttr = parseInlineAttributes(text, openIndex, config.mdAttrConfig)
  if (!parsedAttr || parsedAttr.eaten !== text.slice(openIndex)) {
    return
  }

  // Check for whitespace before the opening brace
  let wsIndex = openIndex - 1
  while (wsIndex >= 0 && isWhitespaceCharacter(text.charCodeAt(wsIndex))) {
    wsIndex--
  }

  if (wsIndex < 0) {
    return
  }

  // Filter and apply attributes
  const htmlTag = ELEMENT_TO_TAG['heading'] || 'h1'
  const filteredProps = filterAttributes(parsedAttr.prop, config, htmlTag)

  if (Object.keys(filteredProps).length > 0) {
    if (!node.data) {
      node.data = {}
    }
    node.data.hProperties = filteredProps
  }

  // Remove attribute text from the text node
  textNode.value = text.slice(0, wsIndex + 1)
}

/**
 * Process heading elements with attributes on next line
 */
function processHeadingNextLine(
  node: Heading,
  index: number | null,
  parent: Parent | undefined,
  config: InternalConfig
): void {
  if (index === null || !parent || !parent.children) {
    return
  }

  // Check if the next sibling is a paragraph starting with {
  const nextNode = parent.children[index + 1]
  if (!nextNode || nextNode.type !== 'paragraph') {
    return
  }

  const paragraph = nextNode as Parent
  if (!paragraph.children || paragraph.children.length === 0) {
    return
  }

  const firstChild = paragraph.children[0]
  if (!firstChild || firstChild.type !== 'text') {
    return
  }

  const textNode = firstChild as Text
  const parsedAttr = parseInlineAttributes(textNode.value, 0, config.mdAttrConfig)

  if (!parsedAttr) {
    return
  }

  // Check if the entire paragraph is just the attribute
  if (parsedAttr.eaten !== textNode.value || paragraph.children.length !== 1) {
    return
  }

  // Filter and apply attributes
  const htmlTag = ELEMENT_TO_TAG['heading'] || 'h1'
  const filteredProps = filterAttributes(parsedAttr.prop, config, htmlTag)

  if (Object.keys(filteredProps).length > 0) {
    if (!node.data) {
      node.data = {}
    }
    node.data.hProperties = filteredProps
  }

  // Remove the attribute paragraph
  parent.children.splice(index + 1, 1)
}

/**
 * Process code block (fenced code) elements
 */
function processCodeBlock(node: Code, config: InternalConfig): void {
  if (!node.lang || !node.meta) {
    return
  }

  // Parse attributes from meta string
  let parsedAttr: ParsedAttribute | null = null

  try {
    parsedAttr = parseAttr(node.meta, 0, config.mdAttrConfig) as ParsedAttribute
  } catch {
    return
  }

  if (!parsedAttr) {
    return
  }

  // Filter and apply attributes
  const htmlTag = ELEMENT_TO_TAG['code'] || 'code'
  const filteredProps = filterAttributes(parsedAttr.prop, config, htmlTag)

  if (Object.keys(filteredProps).length > 0) {
    if (!node.data) {
      node.data = {}
    }
    if (node.data.hProperties) {
      node.data.hProperties = { ...node.data.hProperties, ...filteredProps }
    } else {
      node.data.hProperties = filteredProps
    }
  }
}

/**
 * The remark-attr plugin
 */
const remarkAttr: Plugin<[RemarkAttrOptions?], Root> = (userConfig = {}) => {
  // Merge user config with defaults
  const config: InternalConfig = {
    allowDangerousDOMEventHandlers: userConfig.allowDangerousDOMEventHandlers ?? false,
    elements: userConfig.elements
      ? userConfig.elements instanceof Set
        ? userConfig.elements
        : new Set(userConfig.elements)
      : SUPPORTED_ELEMENTS,
    extend: userConfig.extend ?? {},
    scope: userConfig.scope ?? 'extended',
    mdAttrConfig: userConfig.mdAttrConfig,
    enableAtxHeaderInline: userConfig.enableAtxHeaderInline ?? true,
    disableBlockElements: userConfig.disableBlockElements ?? false,
  }

  return tree => {
    // Process inline elements (emphasis, strong, delete, inlineCode, link)
    visit(
      tree,
      ['emphasis', 'strong', 'delete', 'inlineCode', 'link', 'image'],
      (node, index, parent) => {
        // Convert mdast node type to our element type
        const elementType = NODE_TYPE_TO_ELEMENT[node.type]
        if (elementType && config.elements.has(elementType)) {
          processInlineElement(
            node as Emphasis | Strong | Delete | InlineCode | Link | Image,
            index ?? null,
            parent,
            config
          )
        }
        return SKIP // Don't visit children since we already processed them
      }
    )

    // Process headings with inline attributes
    if (
      !config.disableBlockElements &&
      config.enableAtxHeaderInline &&
      config.elements.has('atxHeading')
    ) {
      visit(tree, 'heading', node => {
        processHeadingInline(node, config)
      })
    }

    // Process headings with next-line attributes (for both ATX and setext)
    if (!config.disableBlockElements && config.elements.has('atxHeading')) {
      visit(tree, 'heading', (node, index, parent) => {
        processHeadingNextLine(node, index ?? null, parent, config)
      })
    }

    // Process code blocks
    if (config.elements.has('fencedCode')) {
      visit(tree, 'code', node => {
        processCodeBlock(node, config)
      })
    }
  }
}

export default remarkAttr
