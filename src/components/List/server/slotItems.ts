import { JSDOM } from 'jsdom'
import { BuildError } from '@lib/errors/BuildError'
import { queryListItemElements } from '@components/List/server/selectors'

type ListItemShape = {
  title?: string
  lead?: string
  text: string
  link?: string
  icon?: string
  color?: string
  inverseColor?: string
  bgColor?: string
}

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
  const listItemElements = queryListItemElements(document.body)

  if (listItemElements.length === 0) {
    throw new BuildError(
      'List: expected one or more ListItem children when using rich slot content.',
      buildErrorContext
    )
  }

  return listItemElements.map((element) => {
    const lead = element.getAttribute('data-lead')

    return {
      ...(lead ? { lead } : {}),
      text: element.innerHTML.trim(),
    }
  })
}