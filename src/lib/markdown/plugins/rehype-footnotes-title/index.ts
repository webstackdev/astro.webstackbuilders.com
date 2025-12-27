import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

function getIdentifierFromBackrefHref(href: unknown): string | null {
  if (typeof href !== 'string') return null

  const trimmed = href.startsWith('#') ? href.slice(1) : href

  const withoutClobberPrefix = trimmed.startsWith('user-content-')
    ? trimmed.slice('user-content-'.length)
    : trimmed

  const fnrefPrefix = 'fnref-'
  const prefixIndex = withoutClobberPrefix.indexOf(fnrefPrefix)
  if (prefixIndex === -1) return null

  return withoutClobberPrefix.slice(prefixIndex + fnrefPrefix.length) || null
}

function buildTitle(template: string, identifier: string): string {
  if (!template) return identifier
  return template.includes('$id') ? template.replaceAll('$id', identifier) : template
}

export type RehypeFootnotesTitleOptions = string

export function rehypeFootnotesTitle(titleTemplate: RehypeFootnotesTitleOptions = '') {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') return

      const properties = node.properties || {}

      const isBackref =
        'dataFootnoteBackref' in properties ||
        'data-footnote-backref' in properties ||
        (Array.isArray(properties['className']) &&
          properties['className'].includes('footnote-backref'))

      if (!isBackref) return

      const identifier = getIdentifierFromBackrefHref(properties['href'])
      if (!identifier) return

      properties['title'] = buildTitle(titleTemplate, identifier)
      node.properties = properties
    })
  }
}

export default rehypeFootnotesTitle
