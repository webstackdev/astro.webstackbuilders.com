import { visit } from 'unist-util-visit'
import type { Root, Element, ElementContent } from 'hast'

function isElementNode(node: ElementContent): node is Element {
  return node.type === 'element'
}

function findFirstElement(node: Element, tagName: string): Element | null {
  for (const child of node.children) {
    if (!isElementNode(child)) {
      continue
    }

    if (child.tagName === tagName) {
      return child
    }

    const nestedMatch = findFirstElement(child, tagName)
    if (nestedMatch) {
      return nestedMatch
    }
  }

  return null
}

function ensureSvgTitle(svg: Element, label: string): void {
  const hasTitle = svg.children.some(
    child => isElementNode(child) && child.tagName === 'title'
  )

  if (hasTitle) {
    return
  }

  svg.children.unshift({
    type: 'element',
    tagName: 'title',
    properties: {},
    children: [
      {
        type: 'text',
        value: label,
      },
    ],
  })
}

/**
 * Add accessible labels to MathJax SVG output using the original TeX source
 * preserved by rehypeMathjaxSource.
 */
export function rehypeMathjaxSvgAlt() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      const source = node.properties?.['dataMathSource']
      if (typeof source !== 'string' || !source) {
        return
      }

      const svg = findFirstElement(node, 'svg')
      if (!svg) {
        return
      }

      const label = `Math expression: ${source}`
      const properties = svg.properties || {}

      properties['aria-label'] = label
      properties['title'] = label
      svg.properties = properties

      ensureSvgTitle(svg, label)
    })
  }
}

export default rehypeMathjaxSvgAlt