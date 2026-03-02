import { visit } from 'unist-util-visit'
import type { Root, Element, ElementContent, Text } from 'hast'

const FOOTNOTES_HEADING_TEXT = 'Footnotes'
const FOOTNOTES_HEADING_ID = 'footnote-label'

function isElementNode(node: ElementContent): node is Element {
  return node.type === 'element'
}

function getNodeText(node: Element): string {
  let textContent = ''

  for (const child of node.children) {
    if (child.type === 'text') {
      textContent += (child as Text).value
      continue
    }

    if (isElementNode(child)) {
      textContent += getNodeText(child)
    }
  }

  return textContent
}

function findFootnotesHeading(section: Element): Element | null {
  for (const child of section.children) {
    if (!isElementNode(child) || child.tagName !== 'h2') continue

    if (getNodeText(child).trim() === FOOTNOTES_HEADING_TEXT) {
      return child
    }
  }

  return null
}

function labelFootnotesSection(section: Element): void {
  const heading = findFootnotesHeading(section)
  if (!heading) return

  const headingProperties = heading.properties || {}

  const headingClasses = headingProperties['className']
  if (Array.isArray(headingClasses)) {
    headingProperties['className'] = headingClasses.filter(className => className !== 'sr-only')
  }

  const headingId = typeof headingProperties['id'] === 'string'
    ? headingProperties['id']
    : FOOTNOTES_HEADING_ID

  headingProperties['id'] = headingId
  heading.properties = headingProperties

  const sectionProperties = section.properties || {}
  sectionProperties['aria-labelledby'] = headingId
  section.properties = sectionProperties
}

function isFootnotesSection(node: Element): boolean {
  const properties = node.properties || {}
  return 'dataFootnotes' in properties || 'data-footnotes' in properties
}

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
      if (node.tagName === 'section' && isFootnotesSection(node)) {
        labelFootnotesSection(node)
      }

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
