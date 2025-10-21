import type { Root, Blockquote, Paragraph, Parent } from 'mdast'
import { visit } from 'unist-util-visit'

export interface AttributionOptions {
  /** HTML class added to the container of the blockquote */
  classNameContainer?: string
  /** HTML class added to the attribution line */
  classNameAttribution?: string
  /** Characters used to identify the beginning of an attribution line */
  marker?: string
  /** Whether the attribution marker will be included in the generated markup */
  removeMarker?: boolean
}

/**
 * A regular expression matching common URL patterns.
 * @see {@link https://mathiasbynens.be/demo/url-regex}
 */
const REGEX_URL = /https?:\/\/[^\s/$.?#()].[^\s()]*/i

/**
 * Default options for the attribution plugin.
 */
const defaultOptions: AttributionOptions = {
  classNameContainer: 'c-blockquote',
  classNameAttribution: 'c-blockquote__attribution',
  marker: '—', // EM dash
  removeMarker: true,
}

/**
 * Extract a URL from the given string.
 * @param str - The string to extract a URL from
 * @returns The extracted URL or null
 */
function extractUrl(str: string): string | null {
  const matches = str.match(REGEX_URL)
  return matches !== null ? matches[0] : null
}

/**
 * Determine whether a string is empty.
 * @param str - The string to inspect
 * @returns True if empty
 */
function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0
}

/**
 * Find the position of an attribution marker in a string.
 * The marker must be at the start of the string or after a newline.
 * @param str - The string to search
 * @param marker - The marker to find
 * @returns The position of the marker, or -1 if not found
 */
function findMarker(str: string, marker: string): number {
  // Check if paragraph starts with the marker
  if (str.startsWith(marker)) {
    return 0
  }

  // Search for the marker following a newline
  const position = str.indexOf('\n' + marker, marker.length + 1)
  return position > marker.length ? position + 1 : -1
}

/**
 * Extract all text content from a paragraph node recursively.
 * This handles cases where formatting (like GFM bold/strikethrough) splits text into multiple nodes.
 * @param node - The node to extract text from
 * @returns Combined text content
 */
function extractAllText(node: Parent | Paragraph): string {
  let text = ''

  for (const child of node.children) {
    if (child.type === 'text') {
      text += child.value
    } else if ('children' in child) {
      // Recursively extract text from nested nodes (strong, emphasis, delete, etc.)
      text += extractAllText(child as Parent)
    }
  }

  return text
}

/**
 * Update the last text node in a paragraph (recursively finds the last text node).
 * This is used to remove the attribution marker from the paragraph.
 * @param node - The node to search
 * @param newValue - The new text value
 * @returns True if a text node was found and updated
 */
function updateLastTextNode(node: Parent | Paragraph, newValue: string): boolean {
  // Search children in reverse to find the last text node
  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i]
    if (!child) continue

    if (child.type === 'text') {
      child.value = newValue
      return true
    } else if ('children' in child && (child as Parent).children.length > 0) {
      // Recursively search nested nodes
      if (updateLastTextNode(child as Parent, newValue)) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if a paragraph contains an attribution line.
 * @param paragraph - The paragraph node to check
 * @param marker - The attribution marker
 * @returns Attribution info
 */
function checkForAttribution(
  paragraph: Paragraph,
  marker: string
): { hasAttribution: boolean; markerIndex: number; text: string | null } {
  // Get all text content from the paragraph (including from nested formatting nodes)
  const text = extractAllText(paragraph)

  if (!text) {
    return { hasAttribution: false, markerIndex: -1, text: null }
  }

  const markerIndex = findMarker(text, marker)
  return {
    hasAttribution: markerIndex !== -1,
    markerIndex,
    text,
  }
}

/**
 * Split text content at the attribution marker.
 * @param text - The text to split
 * @param markerIndex - The position of the marker
 * @param marker - The marker string
 * @param removeMarker - Whether to remove the marker from the attribution
 * @returns The split content
 */
function splitAtMarker(
  text: string,
  markerIndex: number,
  marker: string,
  removeMarker: boolean
): { content: string | null; attribution: string } {
  const content = markerIndex > 0 ? text.slice(0, markerIndex).trimEnd() : null
  let attribution = markerIndex > 0 ? text.slice(markerIndex) : text

  if (removeMarker) {
    attribution = attribution.slice(marker.length).trimStart()
  }

  return { content, attribution }
}

/**
 * A remark plugin that generates accessible markup for block quotes with attribution lines.
 * The generated output follows WHATWG HTML standards for blockquote elements with proper attribution.
 * @param options - Plugin options
 * @returns Transform function
 * @example
 * ```js
 * import { remark } from 'remark'
 * import remarkAttribution from './plugins/remark-attribution/index.ts'
 *
 * const processor = remark()
 *   .use(remarkAttribution, {
 *     classNameContainer: 'c-quote',
 *     marker: '--'
 *   })
 * ```
 */
export default function remarkAttribution(options?: Partial<AttributionOptions>) {
  const settings = { ...defaultOptions, ...options }

  return function (tree: Root): void {
    visit(tree, 'blockquote', (node, index, parent) => {
      if (!parent || index === null || index === undefined) {
        return
      }

      const blockquote = node as Blockquote

      // Find the last paragraph in the blockquote
      const children = blockquote.children
      if (children.length === 0) {
        return
      }

      // Check the last paragraph for attribution
      const lastChild = children[children.length - 1]
      if (!lastChild || lastChild.type !== 'paragraph') {
        return
      }

      const paragraph = lastChild as Paragraph
      const marker = settings.marker
      if (!marker) {
        return
      }

      const { hasAttribution, markerIndex, text } = checkForAttribution(paragraph, marker)

      if (!hasAttribution || text === null) {
        return
      }

      // Split the content at the marker
      const { content, attribution } = splitAtMarker(
        text,
        markerIndex,
        marker,
        settings.removeMarker || false
      )

      // Extract URL from attribution if present
      const url = extractUrl(attribution)

      // Update or remove the paragraph based on remaining content
      if (isEmpty(content)) {
        // Remove the paragraph entirely if no content remains
        children.pop()
      } else if (content !== null) {
        // Update the last text node with the remaining content
        // This finds the last text node recursively, handling nested formatting nodes
        updateLastTextNode(paragraph, content)
      }

      // Add cite attribute to blockquote if URL found
      if (!isEmpty(url)) {
        blockquote.data = blockquote.data || {}
        blockquote.data.hProperties = blockquote.data.hProperties || {}
        blockquote.data.hProperties['cite'] = url
      }

      // Create the figcaption node for attribution
      const figcaption: Paragraph = {
        type: 'paragraph',
        data: {
          hName: 'figcaption',
          hProperties: settings.classNameAttribution
            ? { className: [settings.classNameAttribution] }
            : {},
        },
        children: [
          {
            type: 'text',
            value: attribution,
          },
        ],
      }

      // Wrap blockquote and figcaption in a figure element
      // Using unknown type because we're creating custom hName/hProperties for rehype
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const figure: any = {
        type: 'paragraph', // Use paragraph as the base type
        data: {
          hName: 'figure',
          hProperties: settings.classNameContainer
            ? { className: [settings.classNameContainer] }
            : {},
        },
        children: [blockquote, figcaption],
      }

      // Replace the blockquote with the figure in the parent
      ;(parent as Parent).children[index] = figure
    })
  }
}
