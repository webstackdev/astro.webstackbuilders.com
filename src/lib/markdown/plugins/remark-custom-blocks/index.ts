import type {
  BlockContent,
  Blockquote,
  DefinitionContent,
  Paragraph,
  Parent,
  PhrasingContent,
  Root,
  Text,
} from 'mdast'
import type { Plugin } from 'unified'
import { remark } from 'remark'
import { visit, SKIP } from 'unist-util-visit'

export type CustomBlockTitleRequirement = 'required' | 'optional' | 'none'

export type CustomBlockDefinition = {
  classes?: string
  title?: CustomBlockTitleRequirement
  containerElement?: string
  titleElement?: string
  contentsElement?: string
  details?: boolean
  defaultTitle?: string
}

export type RemarkCustomBlocksOptions = Record<string, CustomBlockDefinition>

function parseMarkerLine(line: string): { blockType: string; title: string | null } | null {
  const match = /^\[\[([^\]|\s]+)(?:\s*\|\s*(.*))?\]\]$/.exec(line.trim())
  if (!match) return null

  const blockType = match[1]
  if (!blockType) return null

  const rawTitle = match[2]
  const title = typeof rawTitle === 'string' && rawTitle.trim().length > 0 ? rawTitle.trim() : null

  return { blockType, title }
}

function parseInlineMarkdown(text: string): PhrasingContent[] {
  const parsed = remark().parse(text) as Root
  const first = parsed.children[0]

  if (first && first.type === 'paragraph') {
    return (first as Paragraph).children
  }

  return [{ type: 'text', value: text }]
}

function parsePipedLines(lines: string[]): { body: string; consumed: number } {
  const bodyLines: string[] = []
  let consumed = 0

  for (const line of lines) {
    if (!line.startsWith('|')) break

    const trimmed = line.startsWith('| ') ? line.slice(2) : line.slice(1)
    bodyLines.push(trimmed)
    consumed += 1
  }

  return { body: bodyLines.join('\n'), consumed }
}

function splitClasses(classString: string | undefined): string[] {
  if (!classString) return []
  return classString
    .split(/\s+/)
    .map(c => c.trim())
    .filter(Boolean)
}

const remarkCustomBlocks: Plugin<[RemarkCustomBlocksOptions?], Root> = options => {
  const availableBlocks = options ?? {}

  return tree => {
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      if (!parent || typeof index !== 'number') return
      if (node.children.length !== 1) return

      const onlyChild = node.children[0] as Text
      if (onlyChild.type !== 'text') return

      const raw = onlyChild.value
      if (!raw.startsWith('[[') || !raw.includes('\n')) return

      const lines = raw.split('\n')
      const marker = parseMarkerLine(lines[0] ?? '')
      if (!marker) return

      const blockConfig = availableBlocks[marker.blockType]
      if (!blockConfig) return

      const titleAllowed = blockConfig.title === 'required' || blockConfig.title === 'optional'
      const titleRequired = blockConfig.title === 'required'

      const titleValue = marker.title ?? blockConfig.defaultTitle ?? null

      if (titleRequired && !titleValue) return
      if (!titleAllowed && titleValue) return

      const { body, consumed } = parsePipedLines(lines.slice(1))
      if (consumed === 0) return

      const resolvedConfig: CustomBlockDefinition = blockConfig.details
        ? {
            ...blockConfig,
            containerElement: 'details',
            titleElement: 'summary',
          }
        : blockConfig

      const containerElement = resolvedConfig.containerElement ?? 'div'
      const titleElement = resolvedConfig.titleElement ?? 'div'
      const contentsElement = resolvedConfig.contentsElement ?? 'div'
      const classList = splitClasses(resolvedConfig.classes)

      const bodyTree = remark().parse(body) as Root

      const bodyChildren = bodyTree.children as Array<BlockContent | DefinitionContent>

      const bodyNode: Blockquote = {
        type: 'blockquote',
        children: bodyChildren,
        data: {
          hName: contentsElement,
          hProperties: {
            className: ['custom-block-body'],
          },
        },
      }

      const children: Array<BlockContent | DefinitionContent> = [bodyNode]

      if (titleAllowed && titleValue) {
        const titleNode: Paragraph = {
          type: 'paragraph',
          children: parseInlineMarkdown(titleValue),
          data: {
            hName: titleElement,
            hProperties: {
              className: ['custom-block-heading'],
            },
          },
        }
        children.unshift(titleNode)
      }

      const containerNode: Blockquote = {
        type: 'blockquote',
        children,
        data: {
          hName: containerElement,
          hProperties: {
            className: ['custom-block', ...classList],
          },
        },
      }

      ;(parent as Parent).children.splice(index, 1, containerNode)
      return SKIP
    })
  }
}

export default remarkCustomBlocks
