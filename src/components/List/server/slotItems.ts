import { JSDOM } from 'jsdom'
import { BuildError } from '@lib/errors/BuildError'
import type { Props as ListProps } from '@components/List/index.astro'

type ListItemShape = NonNullable<ListProps['items']>[number]

const unsupportedRichSlotVariants = new Set([
  'plain-icon-list',
  'two-column-icon-list',
  'three-column-icon-list',
])

const buildErrorContext = {
  phase: 'compilation',
  filePath: 'src/components/List/index.astro',
  tool: 'list',
} as const

/**
 * Parse rendered ListItem slot markup into the existing List items shape.
 */
export function getListItemsFromSlotMarkup(markup: string, variant: string): ListItemShape[] {
  if (unsupportedRichSlotVariants.has(variant)) {
    throw new BuildError(
      `List: rich ListItem children are not supported for the \`${variant}\` variant. Use the \`items\` prop for icon-based list variants.`,
      buildErrorContext
    )
  }

  const document = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`).window.document
  const meaningfulNodes = Array.from(document.body.childNodes).filter((node) => {
    if (node.nodeType === node.TEXT_NODE) {
      return node.textContent?.trim().length
    }

    return node.nodeType === node.ELEMENT_NODE
  })

  if (meaningfulNodes.length === 0) {
    throw new BuildError(
      'List: expected one or more ListItem children when using rich slot content.',
      buildErrorContext
    )
  }

  const invalidNode = meaningfulNodes.find((node) => {
    return node.nodeType !== node.ELEMENT_NODE || (node as Element).tagName.toLowerCase() !== 'wsb-list-item'
  })

  if (invalidNode) {
    throw new BuildError(
      'List: rich slot content must contain only ListItem children. Use either the `items` prop or `<ListItem>` children.',
      buildErrorContext
    )
  }

  return meaningfulNodes.map((node) => {
    const element = node as Element

    return {
      lead: element.getAttribute('data-lead') ?? undefined,
      text: element.innerHTML.trim(),
    }
  })
}