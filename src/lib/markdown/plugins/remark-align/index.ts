export type RemarkAlignOptions = {
  /** Class(es) applied when aligned content is inline (single paragraph) */
  left?: string
  center?: string
  right?: string
  /** Class(es) applied when aligned content is a block range (default column layout) */
  leftBlock?: string
  centerBlock?: string
  rightBlock?: string

  /** Class(es) applied when aligned content is a block range with `:row` layout */
  leftRowBlock?: string
  centerRowBlock?: string
  rightRowBlock?: string
}

type AlignType = 'left' | 'center' | 'right'
type AlignLayout = 'inline' | 'block' | 'blockRow'

import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import type { Plugin } from 'unified'
import type { Data } from 'unist'

type Position = {
  start?: { offset?: number }
  end?: { offset?: number }
}

type MdastNode = {
  type: string
  value?: string
  name?: string
  children?: MdastNode[]
  data?:
    | (Data & {
        hName?: string
        hProperties?: Record<string, unknown>
        __remarkAlignEscaped?: boolean
      })
    | undefined
  position?: Position
}

type MarkerInfo = {
  align: AlignType
  layout: AlignLayout
  markerOnly: boolean
  /** The exact text representation that was matched (e.g. '[center]' or '[/center:row]') */
  representation: string
}

const START_TAGS: Array<{ tag: string; align: AlignType; layout: AlignLayout }> = [
  { tag: '[left]', align: 'left', layout: 'block' },
  { tag: '[center]', align: 'center', layout: 'block' },
  { tag: '[right]', align: 'right', layout: 'block' },
  { tag: '[left:row]', align: 'left', layout: 'blockRow' },
  { tag: '[center:row]', align: 'center', layout: 'blockRow' },
  { tag: '[right:row]', align: 'right', layout: 'blockRow' },
]

const END_TAGS: Array<{ tag: string; align: AlignType }> = [
  { tag: '[/left]', align: 'left' },
  { tag: '[/center]', align: 'center' },
  { tag: '[/right]', align: 'right' },
  // Allow explicit row closers too.
  { tag: '[/left:row]', align: 'left' },
  { tag: '[/center:row]', align: 'center' },
  { tag: '[/right:row]', align: 'right' },
]

function splitClasses(classes: string): string[] {
  const trimmed = classes.trim()
  if (!trimmed) return []
  return trimmed.split(/\s+/)
}

function getTextValue(fileValue: unknown): string {
  if (typeof fileValue === 'string') return fileValue
  return ''
}

function isParagraph(node: MdastNode): node is MdastNode & { children: MdastNode[] } {
  return node.type === 'paragraph' && Array.isArray(node.children)
}

function findFirstTextChild(paragraph: MdastNode & { children: MdastNode[] }) {
  const index = paragraph.children.findIndex(
    child => child?.type === 'text' && typeof child.value === 'string'
  )
  if (index === -1) return null
  const node = paragraph.children[index]
  if (!node) return null
  return { node, index }
}

function findLastTextChild(paragraph: MdastNode & { children: MdastNode[] }) {
  for (let index = paragraph.children.length - 1; index >= 0; index--) {
    const child = paragraph.children[index]
    if (child && child.type === 'text' && typeof child.value === 'string')
      return { node: child, index }
  }
  return null
}

function isEscapedAtOffset(raw: string, offset: number | undefined): boolean {
  if (offset === undefined) return false
  if (offset <= 0) return false
  return raw[offset - 1] === '\\'
}

function detectMarkerOnlyParagraph(node: MdastNode, raw: string): MarkerInfo | null {
  if (!isParagraph(node)) return null
  const candidate = getMarkerOnlyCandidate(node)
  if (!candidate) return null
  const trimmed = candidate.trim()

  // NOTE: Escaping is only supported for the single-text-node marker form.
  // When remark-directive is enabled, ":row" markers can be split into directive nodes;
  // in that case, users should escape the entire tag if they need literal output.
  if (node.children.length === 1) {
    const only = node.children[0]
    if (only && only.type === 'text' && typeof only.value === 'string') {
      // Support escaping tags for literal output: "\\[center]" -> "[center]".
      if (trimmed.startsWith('\\')) {
        const unescaped = trimmed.slice(1)
        const isKnown =
          START_TAGS.some(entry => entry.tag === unescaped) ||
          END_TAGS.some(entry => entry.tag === unescaped)
        if (isKnown) {
          only.value = only.value.replace(trimmed, unescaped)
          only.data = { ...only.data, __remarkAlignEscaped: true }
          return null
        }
      }
      if (isEscapedAtOffset(raw, only.position?.start?.offset)) return null
    }
  }

  const start = START_TAGS.find(entry => entry.tag === trimmed)
  if (start)
    return { align: start.align, layout: start.layout, markerOnly: true, representation: start.tag }

  const end = END_TAGS.find(entry => entry.tag === trimmed)
  if (end) return { align: end.align, layout: 'inline', markerOnly: true, representation: end.tag }

  return null
}

function isRowDirective(node: MdastNode): boolean {
  if (!node) return false
  // remark-directive uses: textDirective | leafDirective | containerDirective
  if (
    node.type !== 'textDirective' &&
    node.type !== 'leafDirective' &&
    node.type !== 'containerDirective'
  )
    return false
  return node.name === 'row'
}

function serializeMarkerChild(node: MdastNode): string | null {
  if (node.type === 'text' && typeof node.value === 'string') return node.value
  if (isRowDirective(node)) return ':row'
  return null
}

function getMarkerOnlyCandidate(paragraph: MdastNode & { children: MdastNode[] }): string | null {
  if (paragraph.children.length === 0) return null
  // Marker-only paragraphs must contain only text and (optionally) a single :row directive.
  let directiveCount = 0
  const parts: string[] = []
  for (const child of paragraph.children) {
    const serialized = serializeMarkerChild(child)
    if (serialized === null) return null
    if (serialized === ':row') directiveCount++
    parts.push(serialized)
  }
  if (directiveCount > 1) return null
  return parts.join('')
}

function detectStartMarker(node: MdastNode, raw: string): MarkerInfo | null {
  const markerOnly = detectMarkerOnlyParagraph(node, raw)
  if (markerOnly) return markerOnly

  if (!isParagraph(node)) return null

  // If a marker was unescaped for literal output, never treat it as syntax.
  if (node.children.some(child => child?.type === 'text' && child.data?.__remarkAlignEscaped))
    return null

  // Support tags where ":row" was parsed into directive nodes (e.g. "[right" + :row + "]").
  // This can happen if a directive parser runs before this plugin.
  const serialized = serializeAlignParagraph(node)
  if (serialized) {
    const start = START_TAGS.find(entry => serialized.startsWith(entry.tag))
    if (start) {
      return {
        align: start.align,
        layout: start.layout === 'blockRow' ? 'blockRow' : 'inline',
        markerOnly: false,
        representation: start.tag,
      }
    }
  }

  const first = findFirstTextChild(node)
  if (!first) return null
  if (!first.node) return null
  if (first.node.data?.__remarkAlignEscaped) return null
  const value = first.node.value as string

  // If a tag is escaped (e.g. "\\[center]"), unescape for literal output but do not treat as syntax.
  if (value.startsWith('\\')) {
    const escapedStart = START_TAGS.find(entry => value.startsWith(`\\${entry.tag}`))
    if (escapedStart) {
      first.node.value = value.slice(1)
      first.node.data = { ...first.node.data, __remarkAlignEscaped: true }
      return null
    }
    const escapedEnd = END_TAGS.find(entry => value.startsWith(`\\${entry.tag}`))
    if (escapedEnd) {
      first.node.value = value.slice(1)
      first.node.data = { ...first.node.data, __remarkAlignEscaped: true }
      return null
    }
  }

  if (isEscapedAtOffset(raw, first.node.position?.start?.offset)) return null

  const start = START_TAGS.find(entry => value.startsWith(entry.tag))
  if (!start) return null

  // Inline tags align a single paragraph with text-*, except for `:row` which uses row flex wrappers.
  return {
    align: start.align,
    layout: start.layout === 'blockRow' ? 'blockRow' : 'inline',
    markerOnly: false,
    representation: start.tag,
  }
}

function detectEndMarker(node: MdastNode, raw: string): MarkerInfo | null {
  const markerOnly = detectMarkerOnlyParagraph(node, raw)
  if (markerOnly) return markerOnly

  if (!isParagraph(node)) return null

  // If a marker was unescaped for literal output, never treat it as syntax.
  if (node.children.some(child => child?.type === 'text' && child.data?.__remarkAlignEscaped))
    return null

  // Support tags where ":row" was parsed into directive nodes (e.g. "[/right" + :row + "]").
  const serialized = serializeAlignParagraph(node)
  if (serialized) {
    const end = END_TAGS.find(entry => serialized.endsWith(entry.tag))
    if (end)
      return { align: end.align, layout: 'inline', markerOnly: false, representation: end.tag }
  }

  const last = findLastTextChild(node)
  if (!last) return null
  if (!last.node) return null
  if (last.node.data?.__remarkAlignEscaped) return null
  const value = last.node.value as string

  // If a closing tag is escaped at the end (e.g. "\\[/center]"), unescape for literal output but do not treat as syntax.
  const escapedEnd = END_TAGS.find(entry => value.endsWith(`\\${entry.tag}`))
  if (escapedEnd) {
    last.node.value = value.slice(0, value.length - escapedEnd.tag.length - 1) + escapedEnd.tag
    last.node.data = { ...last.node.data, __remarkAlignEscaped: true }
    return null
  }

  if (isEscapedAtOffset(raw, (last.node.position?.end?.offset ?? 0) - 1)) return null

  const end = END_TAGS.find(entry => value.endsWith(entry.tag))
  if (!end) return null

  return { align: end.align, layout: 'inline', markerOnly: false, representation: end.tag }
}

function serializeAlignParagraph(paragraph: MdastNode & { children: MdastNode[] }): string | null {
  // We only serialize when the paragraph is made of plain text and row directives.
  // If other nodes exist (links/emphasis/etc), we bail to avoid false matches.
  const parts: string[] = []
  for (const child of paragraph.children) {
    const serialized = serializeMarkerChild(child)
    if (serialized === null) return null
    parts.push(serialized)
  }
  return parts.join('')
}

function stripStartMarker(
  paragraph: MdastNode & { children: MdastNode[] },
  representation: string
) {
  let remaining = representation
  const index = 0
  while (remaining.length > 0 && index < paragraph.children.length) {
    const child = paragraph.children[index]
    if (!child) break

    if (child.type === 'text' && typeof child.value === 'string') {
      const value = child.value
      if (!remaining.startsWith(value)) {
        // Child might be longer than remaining; match prefix instead.
        if (!value.startsWith(remaining)) break
        const nextValue = value.slice(remaining.length)
        if (nextValue.length === 0) {
          paragraph.children.splice(index, 1)
        } else {
          child.value = nextValue
        }
        break
      }

      remaining = remaining.slice(value.length)
      paragraph.children.splice(index, 1)
      continue
    }

    if (isRowDirective(child)) {
      if (!remaining.startsWith(':row')) break
      remaining = remaining.slice(':row'.length)
      paragraph.children.splice(index, 1)
      continue
    }

    break
  }
}

function stripEndMarker(paragraph: MdastNode & { children: MdastNode[] }, representation: string) {
  let remaining = representation
  let index = paragraph.children.length - 1
  while (remaining.length > 0 && index >= 0) {
    const child = paragraph.children[index]
    if (!child) break

    if (child.type === 'text' && typeof child.value === 'string') {
      const value = child.value
      if (!remaining.endsWith(value)) {
        // Child might be longer than remaining; match suffix instead.
        if (!value.endsWith(remaining)) break
        const nextValue = value.slice(0, value.length - remaining.length)
        if (nextValue.length === 0) {
          paragraph.children.splice(index, 1)
        } else {
          child.value = nextValue
        }
        break
      }

      remaining = remaining.slice(0, remaining.length - value.length)
      paragraph.children.splice(index, 1)
      index--
      continue
    }

    if (isRowDirective(child)) {
      if (!remaining.endsWith(':row')) break
      remaining = remaining.slice(0, remaining.length - ':row'.length)
      paragraph.children.splice(index, 1)
      index--
      continue
    }

    break
  }
}

function isEmptyParagraph(node: MdastNode): boolean {
  if (!isParagraph(node)) return false
  if (node.children.length === 0) return true
  return node.children.every(
    child => child.type === 'text' && typeof child.value === 'string' && child.value.trim() === ''
  )
}

function wrapNodesInDiv(nodes: MdastNode[], classes: string): MdastNode {
  return {
    type: 'alignWrapper',
    data: {
      hName: 'div',
      hProperties: {
        className: splitClasses(classes),
      },
    },
    children: nodes,
  }
}

function tryWrapFromIndex(
  children: MdastNode[],
  startIndex: number,
  raw: string,
  options: Required<RemarkAlignOptions>
): { consumed: number } | null {
  const startNode = children[startIndex]
  if (!startNode) return null
  const startInfo = detectStartMarker(startNode, raw)
  if (!startInfo) return null

  for (let endIndex = startIndex; endIndex < children.length; endIndex++) {
    const endNode = children[endIndex]
    if (!endNode) continue
    const endInfo = detectEndMarker(endNode, raw)
    if (!endInfo) continue

    // Start/end must match type.
    if (startInfo.align !== endInfo.align) continue

    // Marker-only paragraphs must be paired (a single tag line is not a valid range).
    if (endIndex === startIndex && startInfo.markerOnly && endInfo.markerOnly) continue

    const segment = children.slice(startIndex, endIndex + 1)

    // Remove/strip start marker
    if (startInfo.markerOnly) {
      segment.shift()
    } else {
      const first = segment[0]
      if (first && isParagraph(first)) stripStartMarker(first, startInfo.representation)
      if (segment[0] && isEmptyParagraph(segment[0])) segment.shift()
    }

    // Remove/strip end marker (note: start and end could be same node)
    if (endInfo.markerOnly) {
      segment.pop()
    } else {
      const last = segment[segment.length - 1]
      if (last && isParagraph(last)) stripEndMarker(last, endInfo.representation)
      const maybeLast = segment[segment.length - 1]
      if (maybeLast && isEmptyParagraph(maybeLast)) segment.pop()
    }

    if (segment.length === 0) return { consumed: endIndex - startIndex + 1 }

    const textClassMap: Record<AlignType, string> = {
      left: options.left,
      center: options.center,
      right: options.right,
    }
    const blockClassMap: Record<AlignType, string> = {
      left: options.leftBlock,
      center: options.centerBlock,
      right: options.rightBlock,
    }
    const rowBlockClassMap: Record<AlignType, string> = {
      left: options.leftRowBlock,
      center: options.centerRowBlock,
      right: options.rightRowBlock,
    }

    const isBlockRange = startInfo.markerOnly || endInfo.markerOnly
    const blockLayout = startInfo.layout === 'blockRow' ? 'blockRow' : 'block'

    const classes = isBlockRange
      ? blockLayout === 'blockRow'
        ? rowBlockClassMap[startInfo.align]
        : blockClassMap[startInfo.align]
      : startInfo.layout === 'blockRow'
        ? rowBlockClassMap[startInfo.align]
        : textClassMap[startInfo.align]

    const wrapped = wrapNodesInDiv(segment, classes)

    // Replace in-place
    children.splice(startIndex, endIndex - startIndex + 1, wrapped)
    return { consumed: 1 }
  }

  return null
}

function processContainer(node: MdastNode, raw: string, options: Required<RemarkAlignOptions>) {
  if (!Array.isArray(node.children)) return

  let index = 0
  while (index < node.children.length) {
    const result = tryWrapFromIndex(node.children, index, raw, options)
    if (result) {
      index += result.consumed
      continue
    }

    const child = node.children[index]
    if (child) processContainer(child, raw, options)
    index++
  }
}

const remarkAlign: Plugin<[RemarkAlignOptions?], Root> = (userOptions: RemarkAlignOptions = {}) => {
  const options: Required<RemarkAlignOptions> = {
    left: userOptions.left ?? 'text-left',
    center: userOptions.center ?? 'text-center',
    right: userOptions.right ?? 'text-right',
    leftBlock: userOptions.leftBlock ?? 'flex flex-col items-start',
    centerBlock: userOptions.centerBlock ?? 'flex flex-col items-center',
    rightBlock: userOptions.rightBlock ?? 'flex flex-col items-end',
    leftRowBlock: userOptions.leftRowBlock ?? 'flex justify-start',
    centerRowBlock: userOptions.centerRowBlock ?? 'flex justify-center',
    rightRowBlock: userOptions.rightRowBlock ?? 'flex justify-end',
  }

  return (tree: Root, file: VFile) => {
    const raw = getTextValue((file as unknown as { value?: unknown }).value)
    processContainer(tree as unknown as MdastNode, raw, options)
  }
}

export default remarkAlign
