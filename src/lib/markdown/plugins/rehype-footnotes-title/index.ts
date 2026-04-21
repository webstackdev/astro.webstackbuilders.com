import { SKIP, visit } from 'unist-util-visit'
import type { Root, Element, ElementContent, Text, Properties } from 'hast'

const FOOTNOTES_HEADING_TEXT = 'Footnotes'
const FOOTNOTES_HEADING_ID = 'footnote-label'
const TOOLTIP_HOST_CLASSES = ['relative', 'inline-flex']
const TOOLTIP_TRIGGER_CLASSES = [
  'inline-flex',
  'items-center',
  'focus-visible:outline-2',
  'focus-visible:outline-offset-2',
  'focus-visible:outline-spotlight',
]
const TOOLTIP_POPUP_CLASSES = [
  'pointer-events-none',
  'absolute',
  'left-0',
  'top-full',
  'z-(--z-content-floating)',
  'mt-2',
  'hidden',
  'max-w-64',
  'rounded-md',
  'border',
  'border-trim',
  'bg-page-inverse',
  'px-2',
  'py-1',
  'text-sm',
  'leading-tight',
  'text-page-base',
  'shadow-elevated',
  'whitespace-nowrap',
]

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

  const headingId =
    typeof headingProperties['id'] === 'string' ? headingProperties['id'] : FOOTNOTES_HEADING_ID

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

function removeTooltipProperties(properties: Properties): Properties {
  const nextProperties: Properties = { ...properties }
  delete nextProperties['data-tooltip']
  delete nextProperties['title']
  return nextProperties
}

function wrapBackrefWithTooltip(node: Element, title: string): void {
  const anchorNode: Element = {
    type: 'element',
    tagName: 'a',
    properties: removeTooltipProperties(node.properties || {}),
    children: node.children,
  }

  node.tagName = 'site-tooltip'
  node.properties = {
    className: TOOLTIP_HOST_CLASSES,
  }
  node.children = [
    {
      type: 'element',
      tagName: 'span',
      properties: {
        'data-tooltip-trigger': '',
        className: TOOLTIP_TRIGGER_CLASSES,
      },
      children: [anchorNode],
    },
    {
      type: 'element',
      tagName: 'span',
      properties: {
        'data-tooltip-popup': '',
        role: 'tooltip',
        'aria-hidden': 'true',
        className: TOOLTIP_POPUP_CLASSES,
      },
      children: [{ type: 'text', value: title }],
    },
  ]
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

      wrapBackrefWithTooltip(node, buildTitle(titleTemplate, identifier))
      return SKIP
    })
  }
}

export default rehypeFootnotesTitle
