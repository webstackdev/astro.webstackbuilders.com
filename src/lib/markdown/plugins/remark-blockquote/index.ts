import type { Root, Blockquote, Paragraph, Parent } from 'mdast'
import type { ElementContent } from 'hast'
import { visit } from 'unist-util-visit'

export interface RemarkBlockquoteOptions {
  /** HTML class added to the figure container of an attribution-only blockquote */
  classNameAttributionFigure?: string
  /** HTML class added to the figure container of a captioned blockquote (caption only, or caption + attribution) */
  classNameCaptionFigure?: string
  /** HTML class added to the attribution element */
  classNameAttribution?: string
  /** HTML class added to the caption figcaption element */
  classNameCaption?: string
  /** Characters used to identify the beginning of an attribution line */
  marker?: string
  /** Prefix used to identify a caption line */
  captionPrefix?: string
  /** Whether the attribution marker will be included in the generated markup */
  removeMarker?: boolean
  /** Whether the caption prefix will be included in the generated markup */
  removeCaptionPrefix?: boolean
}

/**
 * A regular expression matching common URL patterns.
 * @see {@link https://mathiasbynens.be/demo/url-regex}
 */
const REGEX_URL = /https?:\/\/[^\s/$.?#()].[^\s()]*/i

const defaultOptions: Required<
  Pick<
    RemarkBlockquoteOptions,
    | 'classNameAttributionFigure'
    | 'classNameCaptionFigure'
    | 'classNameAttribution'
    | 'classNameCaption'
    | 'marker'
    | 'captionPrefix'
    | 'removeMarker'
    | 'removeCaptionPrefix'
  >
> = {
  classNameAttributionFigure: 'blockquote',
  classNameCaptionFigure: 'blockquote-figure',
  classNameAttribution: 'blockquote-attribution',
  classNameCaption: 'blockquote-caption',
  marker: '—',
  captionPrefix: 'Source:',
  removeMarker: true,
  removeCaptionPrefix: true,
}

function extractUrl(str: string): string | null {
  const matches = str.match(REGEX_URL)
  return matches !== null ? matches[0] : null
}

function removeUrl(str: string, url: string): string {
  return str.replace(url, '').replace(/\s{2,}/g, ' ').trim()
}

function splitAttribution(attributionText: string): { name: string; meta: string | null } {
  const trimmed = attributionText.trim()

  const openParenIndex = trimmed.lastIndexOf('(')
  const closeParenIndex = trimmed.lastIndexOf(')')

  const hasTrailingParens = openParenIndex !== -1 && closeParenIndex === trimmed.length - 1 && openParenIndex < closeParenIndex
  if (!hasTrailingParens) {
    return { name: trimmed, meta: null }
  }

  const name = trimmed.slice(0, openParenIndex).trim()
  const meta = trimmed.slice(openParenIndex + 1, closeParenIndex).trim()

  if (isEmpty(name) || isEmpty(meta)) {
    return { name: trimmed, meta: null }
  }

  return { name, meta }
}

function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0
}

function findLineMarker(text: string, marker: string): number {
  if (text.startsWith(marker)) return 0

  const position = text.indexOf(`\n${marker}`, marker.length + 1)
  return position > marker.length ? position + 1 : -1
}

function findLinePrefix(text: string, prefix: string): number {
  if (text.startsWith(prefix)) return 0

  const position = text.indexOf(`\n${prefix}`, prefix.length + 1)
  return position > prefix.length ? position + 1 : -1
}

/**
 * Extract all text content from a paragraph node recursively.
 * This handles cases where formatting (strong/emphasis/delete/etc) splits text across multiple nodes.
 */
function extractAllText(node: Parent | Paragraph): string {
  let text = ''

  for (const child of node.children) {
    if (child.type === 'text') {
      text += child.value
    } else if ('children' in child) {
      text += extractAllText(child as Parent)
    }
  }

  return text
}

/**
 * Update the last text node in a paragraph (recursively finds the last text node).
 * Used to remove the extracted attribution/caption segment from the blockquote content.
 */
function updateLastTextNode(node: Parent | Paragraph, newValue: string): boolean {
  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i]
    if (!child) continue

    if (child.type === 'text') {
      child.value = newValue
      return true
    }

    if ('children' in child && (child as Parent).children.length > 0) {
      if (updateLastTextNode(child as Parent, newValue)) {
        return true
      }
    }
  }

  return false
}

function stripLeadingLine(text: string): string {
  return text.replace(/^\s*\n/, '')
}

function stripPrefix(value: string, prefix: string): string {
  const trimmed = value.trimStart()
  if (!trimmed.startsWith(prefix)) return trimmed
  return trimmed.slice(prefix.length).trimStart()
}

function stripMarker(value: string, marker: string): string {
  const trimmed = value.trimStart()
  if (!trimmed.startsWith(marker)) return trimmed
  return trimmed.slice(marker.length).trimStart()
}

export default function remarkBlockquote(options?: Partial<RemarkBlockquoteOptions>) {
  const settings = { ...defaultOptions, ...options }

  return function (tree: Root): void {
    visit(tree, 'blockquote', (node, index, parent) => {
      if (!parent || index === null || index === undefined) return

      // Avoid double-wrapping: once a blockquote is wrapped, its parent becomes the synthetic
      // mdast paragraph node with data.hName = 'figure'.
      const parentAsAny = parent as unknown as { type?: string; data?: { hName?: string } }
      if (parentAsAny.type === 'paragraph' && parentAsAny.data?.hName === 'figure') return

      const blockquote = node as Blockquote
      const children = blockquote.children
      if (children.length === 0) return

      let captionText: string | null = null
      let attributionText: string | null = null

      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i]
        if (!child || child.type !== 'paragraph') continue

        const paragraph = child as Paragraph
        const text = extractAllText(paragraph)
        if (isEmpty(text)) continue

        const markerIndex = attributionText ? -1 : findLineMarker(text, settings.marker)
        const captionIndex = captionText ? -1 : findLinePrefix(text, settings.captionPrefix)

        if (markerIndex === -1 && captionIndex === -1) continue

        const metaIndices = [markerIndex, captionIndex].filter(position => position !== -1)
        const firstMetaIndex = Math.min(...metaIndices)

        const content = firstMetaIndex > 0 ? text.slice(0, firstMetaIndex).trimEnd() : null

        if (markerIndex !== -1 && !attributionText) {
          const end = captionIndex !== -1 && captionIndex > markerIndex ? captionIndex : text.length
          let attribution = stripLeadingLine(text.slice(markerIndex, end))
          if (settings.removeMarker) {
            attribution = stripMarker(attribution, settings.marker)
          }
          attributionText = attribution.trim()

          const url = extractUrl(attributionText)
          if (!isEmpty(url)) {
            blockquote.data = blockquote.data || {}
            blockquote.data.hProperties = blockquote.data.hProperties || {}
            blockquote.data.hProperties['cite'] = url
          }
        }

        if (captionIndex !== -1 && !captionText) {
          const end = markerIndex !== -1 && markerIndex > captionIndex ? markerIndex : text.length
          let caption = stripLeadingLine(text.slice(captionIndex, end))
          if (settings.removeCaptionPrefix) {
            caption = stripPrefix(caption, settings.captionPrefix)
          }
          captionText = caption.trim()
        }

        if (isEmpty(content)) {
          children.splice(i, 1)
        } else if (content !== null) {
          updateLastTextNode(paragraph, content)
        }

        if (captionText && attributionText) break
      }

      const hasCaption = Boolean(captionText)

      const figureClassNames: string[] = []
      if (settings.classNameAttributionFigure) {
        figureClassNames.push(settings.classNameAttributionFigure)
      }
      if (hasCaption && settings.classNameCaptionFigure) {
        figureClassNames.push(settings.classNameCaptionFigure)
      }

      const figureChildren: unknown[] = [blockquote]

      if (attributionText) {
        const url = extractUrl(attributionText)
        const displayedAttributionText = url ? removeUrl(attributionText, url) : attributionText

        if (url) {
          blockquote.data = blockquote.data || {}
          blockquote.data.hProperties = blockquote.data.hProperties || {}
          blockquote.data.hProperties['cite'] = url
        }

        const { name, meta } = splitAttribution(displayedAttributionText)

        const attributionContainerTagName = hasCaption ? 'div' : 'figcaption'
        const attributionInnerChildren: ElementContent[] = [
          {
            type: 'element',
            tagName: 'p',
            properties: {},
            children: [{ type: 'text', value: name }],
          },
        ]

        if (meta) {
          attributionInnerChildren.push({
            type: 'element',
            tagName: 'p',
            properties: {},
            children: [{ type: 'text', value: meta }],
          })
        }

        const attributionNode: Paragraph = {
          type: 'paragraph',
          data: {
            hName: attributionContainerTagName,
            hProperties: settings.classNameAttribution ? { className: [settings.classNameAttribution] } : {},
            // Build desired HTML shape:
            // <figcaption class="blockquote-attribution">
            //   <div><p>Name</p><p>Date</p></div>
            // </figcaption>
            // (when caption exists, outer tag becomes <div> to keep figcaption reserved for caption)
            hChildren: [
              {
                type: 'element',
                tagName: 'div',
                properties: {},
                children: attributionInnerChildren,
              },
            ],
          },
          children: [],
        }

        if (hasCaption) {
          blockquote.children.push(attributionNode)
        } else {
          figureChildren.push(attributionNode)
        }
      }

      if (captionText) {
        const captionNode: Paragraph = {
          type: 'paragraph',
          data: {
            hName: 'figcaption',
            hProperties: settings.classNameCaption ? { className: [settings.classNameCaption] } : {},
          },
          children: [{ type: 'text', value: captionText }],
        }

        figureChildren.push(captionNode)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const figure: any = {
        type: 'paragraph',
        data: {
          hName: 'figure',
          hProperties: figureClassNames.length > 0 ? { className: figureClassNames } : {},
        },
        children: figureChildren,
      }

      ;(parent as Parent).children[index] = figure
    })
  }
}
