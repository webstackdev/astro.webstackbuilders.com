// @ts-check
/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').Blockquote} Blockquote
 * @typedef {import('mdast').Paragraph} Paragraph
 * @typedef {import('mdast').Text} Text
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {import('mdast').Parent} Parent
 * @typedef {import('unist').Node} Node
 */

/**
 * @typedef AttributionOptions
 * @property {string} [classNameContainer='c-blockquote'] - HTML class added to the container of the blockquote
 * @property {string} [classNameAttribution='c-blockquote__attribution'] - HTML class added to the attribution line
 * @property {string} [marker='—'] - Characters used to identify the beginning of an attribution line
 * @property {boolean} [removeMarker=true] - Whether the attribution marker will be included in the generated markup
 */

import { visit } from 'unist-util-visit'

/**
 * A regular expression matching common URL patterns.
 * @see {@link https://mathiasbynens.be/demo/url-regex}
 * @type {RegExp}
 */
const REGEX_URL = /https?:\/\/[^\s/$.?#()].[^\s()]*/i

/**
 * Default options for the attribution plugin.
 * @type {AttributionOptions}
 */
const defaultOptions = {
  classNameContainer: 'c-blockquote',
  classNameAttribution: 'c-blockquote__attribution',
  marker: '—', // EM dash
  removeMarker: true
}

/**
 * Extract a URL from the given string.
 * @param {string} str - The string to extract a URL from
 * @returns {string | null} The extracted URL or null
 */
function extractUrl(str) {
  const matches = str.match(REGEX_URL)
  return matches !== null ? matches[0] : null
}

/**
 * Determine whether a string is empty.
 * @param {string | null | undefined} str - The string to inspect
 * @returns {boolean} True if empty
 */
function isEmpty(str) {
  return !str || str.trim().length === 0
}

/**
 * Find the position of an attribution marker in a string.
 * The marker must be at the start of the string or after a newline.
 * @param {string} str - The string to search
 * @param {string} marker - The marker to find
 * @returns {number} The position of the marker, or -1 if not found
 */
function findMarker(str, marker) {
  // Check if paragraph starts with the marker
  if (str.startsWith(marker)) {
    return 0
  }

  // Search for the marker following a newline
  const position = str.indexOf('\n' + marker, marker.length + 1)
  return position > marker.length ? position + 1 : -1
}

/**
 * Check if a paragraph contains an attribution line.
 * @param {Paragraph} paragraph - The paragraph node to check
 * @param {string} marker - The attribution marker
 * @returns {{ hasAttribution: boolean, markerIndex: number, text: string | null }} Attribution info
 */
function checkForAttribution(paragraph, marker) {
  // Get all text content from the paragraph
  let text = null

  for (const child of paragraph.children) {
    if (child.type === 'text') {
      text = child.value
      break
    }
  }

  if (!text) {
    return { hasAttribution: false, markerIndex: -1, text: null }
  }

  const markerIndex = findMarker(text, marker)
  return {
    hasAttribution: markerIndex !== -1,
    markerIndex,
    text
  }
}

/**
 * Split text content at the attribution marker.
 * @param {string} text - The text to split
 * @param {number} markerIndex - The position of the marker
 * @param {string} marker - The marker string
 * @param {boolean} removeMarker - Whether to remove the marker from the attribution
 * @returns {{ content: string | null, attribution: string }} The split content
 */
function splitAtMarker(text, markerIndex, marker, removeMarker) {
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
 * @param {Partial<AttributionOptions>} [options] - Plugin options
 * @returns {(tree: Root) => undefined} Transform function
 * @example
 * ```js
 * import { remark } from 'remark'
 * import remarkAttribution from './remark-attribution/index.mjs'
 *
 * const processor = remark()
 *   .use(remarkAttribution, {
 *     classNameContainer: 'c-quote',
 *     marker: '--'
 *   })
 * ```
 */
export default function remarkAttribution(options) {
  const settings = { ...defaultOptions, ...options }

  /**
   * Transform the tree.
   * @param {Root} tree - The mdast tree
   * @returns {undefined} Nothing
   */
  return function (tree) {
    visit(tree, 'blockquote', (node, index, parent) => {
      if (!parent || index === null || index === undefined) {
        return
      }

      // @ts-ignore - TypeScript doesn't narrow the type correctly
      const blockquote = /** @type {Blockquote} */ (node)

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

      const paragraph = /** @type {Paragraph} */ (lastChild)
      const marker = settings.marker
      if (!marker) {
        return
      }

      const { hasAttribution, markerIndex, text } = checkForAttribution(paragraph, marker)

      if (!hasAttribution || text === null) {
        return
      }

      // Split the content at the marker
      const { content, attribution } = splitAtMarker(text, markerIndex, marker, settings.removeMarker || false)

      // Extract URL from attribution if present
      const url = extractUrl(attribution)

      // Update or remove the paragraph based on remaining content
      if (isEmpty(content)) {
        // Remove the paragraph entirely if no content remains
        children.pop()
      } else if (content !== null) {
        // Update the text node with the remaining content
        const textNode = paragraph.children.find(child => child.type === 'text')
        if (textNode && textNode.type === 'text') {
          textNode.value = content
        }
      }

      // Add cite attribute to blockquote if URL found
      if (!isEmpty(url)) {
        blockquote.data = blockquote.data || {}
        blockquote.data.hProperties = blockquote.data.hProperties || {}
        blockquote.data.hProperties['cite'] = url
      }

      // Create the figcaption node for attribution
      /** @type {Paragraph} */
      const figcaption = {
        type: 'paragraph',
        data: {
          hName: 'figcaption',
          hProperties: settings.classNameAttribution
            ? { className: [settings.classNameAttribution] }
            : {}
        },
        children: [
          {
            type: 'text',
            value: attribution
          }
        ]
      }

      // Wrap blockquote and figcaption in a figure element
      // Using 'unknown' type because we're creating custom hName/hProperties for rehype
      /** @type {unknown} */
      const figure = {
        type: 'paragraph', // Use paragraph as the base type
        data: {
          hName: 'figure',
          hProperties: settings.classNameContainer
            ? { className: [settings.classNameContainer] }
            : {}
        },
        children: [
          blockquote,
          figcaption
        ]
      }

      // Replace the blockquote with the figure in the parent
      // @ts-ignore - Custom hName for rehype transformation
      parent.children[index] = figure
    })
  }
}
